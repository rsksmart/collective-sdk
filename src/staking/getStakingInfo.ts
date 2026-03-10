import type { Address } from 'viem'
import type { W3LayerInstance } from '@rsksmart/w3layer'
import { toTokenAmount, TOKEN_DECIMALS, type TokenAmount, validateAddress } from '@rsksmart/sdk-base'
import type { ContractAddresses } from '../contracts/addresses'
import { StRIFTokenAbi, RIFTokenAbi } from '../contracts/abis'

/**
 * Staking information for a user
 */
export interface StakingInfo {
  /** RIF token balance (available to stake) */
  rifBalance: TokenAmount
  /** stRIF token balance (staked amount) */
  stRifBalance: TokenAmount
  /** Current RIF allowance for staking contract */
  allowance: TokenAmount
  /** Whether the current allowance is sufficient for the given amount */
  hasAllowance: (amount: bigint) => boolean
}

/**
 * Get staking information for a user
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @param userAddress - Address of the user
 * @returns Staking information including balances and allowance
 * @throws Error if user address is invalid
 */
export async function getStakingInfo(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  userAddress: Address
): Promise<StakingInfo> {
  validateAddress(userAddress)

  const results = await w3.multicall({
    contracts: [
      {
        address: addresses.RIF,
        abi: RIFTokenAbi,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        address: addresses.stRIF,
        abi: StRIFTokenAbi,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        address: addresses.RIF,
        abi: RIFTokenAbi,
        functionName: 'allowance',
        args: [userAddress, addresses.stRIF],
      },
    ],
    allowFailure: true,
  })

  const rifBalance = results[0]?.status === 'success' ? (results[0].result as bigint) : 0n
  const stRifBalance = results[1]?.status === 'success' ? (results[1].result as bigint) : 0n
  const allowance = results[2]?.status === 'success' ? (results[2].result as bigint) : 0n

  return {
    rifBalance: toTokenAmount(rifBalance, TOKEN_DECIMALS.RIF, 'RIF'),
    stRifBalance: toTokenAmount(stRifBalance, TOKEN_DECIMALS.stRIF, 'stRIF'),
    allowance: toTokenAmount(allowance, TOKEN_DECIMALS.RIF, 'RIF'),
    hasAllowance: (amount: bigint) => allowance >= amount,
  }
}
