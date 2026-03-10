import type { Address, WalletClient } from 'viem'
import type { W3LayerInstance } from '@rsksmart/w3layer'
import { validateAddress } from '@rsksmart/sdk-base'
import type { ContractAddresses } from '../contracts/addresses'
import { BuilderRegistryAbi, BackersManagerAbi, GaugeAbi } from '../contracts/abis'

/**
 * Token type for claiming rewards
 */
export type ClaimableToken = 'rif' | 'rbtc' | 'usdrif' | 'all'

/**
 * Result of claim rewards operation
 */
export interface ClaimRewardsResult {
  /** Transaction hash */
  hash: `0x${string}`
  /** Wait for transaction confirmation */
  wait: (confirmations?: number) => Promise<{
    transactionHash: `0x${string}`
    blockNumber: bigint
    status: 'success' | 'reverted'
  }>
}

/**
 * Info about claimable rewards
 */
export interface ClaimableRewardsInfo {
  /** Gauges with RIF rewards > 0 */
  rifGauges: Address[]
  /** Gauges with RBTC rewards > 0 */
  rbtcGauges: Address[]
  /** Gauges with USDRIF rewards > 0 */
  usdrifGauges: Address[]
  /** All unique gauges with any rewards > 0 */
  allGauges: Address[]
  /** Whether there are any rewards to claim */
  hasRewards: boolean
}

/**
 * Get the token address for a claim token type
 */
function getTokenAddress(addresses: ContractAddresses, token: ClaimableToken): Address | undefined {
  switch (token) {
    case 'rif':
      return addresses.RIF
    case 'rbtc':
      return addresses.COINBASE_ADDRESS
    case 'usdrif':
      return addresses.USDRIF
    case 'all':
      return undefined
  }
}

/**
 * Get information about which gauges have claimable rewards for a backer
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @param backerAddress - Address of the backer
 * @returns Info about claimable rewards per gauge
 * @throws Error if backer address is invalid
 */
export async function getClaimableRewardsInfo(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  backerAddress: Address
): Promise<ClaimableRewardsInfo> {
  validateAddress(backerAddress)

  const gaugesLength = await w3.readContract<bigint>({
    address: addresses.builderRegistry,
    abi: BuilderRegistryAbi,
    functionName: 'getGaugesLength',
    args: [],
  })

  if (gaugesLength === 0n) {
    return {
      rifGauges: [],
      rbtcGauges: [],
      usdrifGauges: [],
      allGauges: [],
      hasRewards: false,
    }
  }

  const gauges = await w3.readContract<Address[]>({
    address: addresses.builderRegistry,
    abi: BuilderRegistryAbi,
    functionName: 'getGaugesInRange',
    args: [0n, gaugesLength],
  })

  const earnedCalls = gauges.flatMap((gauge) => [
    {
      address: gauge,
      abi: GaugeAbi,
      functionName: 'earned',
      args: [addresses.RIF, backerAddress],
    },
    {
      address: gauge,
      abi: GaugeAbi,
      functionName: 'earned',
      args: [addresses.COINBASE_ADDRESS, backerAddress],
    },
    {
      address: gauge,
      abi: GaugeAbi,
      functionName: 'earned',
      args: [addresses.USDRIF, backerAddress],
    },
  ])

  const results = await w3.multicall({
    contracts: earnedCalls,
    allowFailure: true,
  })

  const rifGauges: Address[] = []
  const rbtcGauges: Address[] = []
  const usdrifGauges: Address[] = []

  for (let i = 0; i < gauges.length; i++) {
    const gauge = gauges[i]
    const rifIndex = i * 3
    const rbtcIndex = i * 3 + 1
    const usdrifIndex = i * 3 + 2

    const rifEarned = results[rifIndex]?.status === 'success' ? (results[rifIndex].result as bigint) : 0n
    const rbtcEarned = results[rbtcIndex]?.status === 'success' ? (results[rbtcIndex].result as bigint) : 0n
    const usdrifEarned = results[usdrifIndex]?.status === 'success' ? (results[usdrifIndex].result as bigint) : 0n

    if (rifEarned > 0n) rifGauges.push(gauge)
    if (rbtcEarned > 0n) rbtcGauges.push(gauge)
    if (usdrifEarned > 0n) usdrifGauges.push(gauge)
  }

  const allGauges = [...new Set([...rifGauges, ...rbtcGauges, ...usdrifGauges])]

  return {
    rifGauges,
    rbtcGauges,
    usdrifGauges,
    allGauges,
    hasRewards: allGauges.length > 0,
  }
}

/**
 * Claim backer rewards
 *
 * This function claims rewards for a backer from the BackersManager contract.
 * You can claim all rewards at once, or claim a specific token type.
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @param walletClient - Viem WalletClient
 * @param backerAddress - Address of the backer
 * @param token - Which token to claim: 'rif', 'rbtc', 'usdrif', or 'all' (default)
 * @returns Claim result with transaction hash and wait function
 *
 * @example
 * ```ts
 * // Claim all rewards
 * const result = await sdk.holdings.claimRewards(walletClient, backerAddress)
 * await result.wait()
 *
 * // Claim only RIF rewards
 * const result = await sdk.holdings.claimRewards(walletClient, backerAddress, 'rif')
 * await result.wait()
 * ```
 */
export async function claimRewards(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  walletClient: WalletClient,
  backerAddress: Address,
  token: ClaimableToken = 'all'
): Promise<ClaimRewardsResult> {
  const info = await getClaimableRewardsInfo(w3, addresses, backerAddress)

  let gaugesToClaim: Address[]
  switch (token) {
    case 'rif':
      gaugesToClaim = info.rifGauges
      break
    case 'rbtc':
      gaugesToClaim = info.rbtcGauges
      break
    case 'usdrif':
      gaugesToClaim = info.usdrifGauges
      break
    case 'all':
      gaugesToClaim = info.allGauges
      break
  }

  if (gaugesToClaim.length === 0) {
    throw new Error(`No ${token === 'all' ? '' : token + ' '}rewards to claim`)
  }

  const tokenAddress = getTokenAddress(addresses, token)

  if (tokenAddress) {
    return w3.writeContract(walletClient, {
      address: addresses.backersManager,
      abi: BackersManagerAbi,
      functionName: 'claimBackerRewards',
      args: [tokenAddress, gaugesToClaim],
    })
  } else {
    return w3.writeContract(walletClient, {
      address: addresses.backersManager,
      abi: BackersManagerAbi,
      functionName: 'claimBackerRewards',
      args: [gaugesToClaim],
    })
  }
}
