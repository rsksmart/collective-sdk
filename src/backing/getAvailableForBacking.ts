import type { Address } from 'viem'
import type { W3LayerInstance } from '@rsksmart/w3layer'
import { toTokenAmount } from '@rsksmart/sdk-base'
import type { ContractAddresses } from '../contracts/addresses'
import { StRIFTokenAbi, BackersManagerAbi } from '../contracts/abis'
import type { AvailableForBacking } from '../types'

const STRIF_DECIMALS = 18
const STRIF_SYMBOL = 'stRIF'

/**
 * Get available balance for backing for a given user
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @param backerAddress - Address of the backer
 * @returns Available backing information
 */
export async function getAvailableForBacking(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  backerAddress: Address
): Promise<AvailableForBacking> {
  const results = await w3.multicall({
    contracts: [
      {
        address: addresses.stRIF,
        abi: StRIFTokenAbi,
        functionName: 'balanceOf',
        args: [backerAddress],
      },
      {
        address: addresses.backersManager,
        abi: BackersManagerAbi,
        functionName: 'backerTotalAllocation',
        args: [backerAddress],
      },
    ],
    allowFailure: false,
  })

  const balance = results[0]?.result as bigint ?? 0n
  const totalAllocated = results[1]?.result as bigint ?? 0n
  const available = balance > totalAllocated ? balance - totalAllocated : 0n

  return {
    balance: toTokenAmount(balance, STRIF_DECIMALS, STRIF_SYMBOL),
    totalAllocated: toTokenAmount(totalAllocated, STRIF_DECIMALS, STRIF_SYMBOL),
    available: toTokenAmount(available, STRIF_DECIMALS, STRIF_SYMBOL),
  }
}
