import type { WalletClient } from 'viem'
import type { W3LayerInstance, WriteContractResult } from '@rsksmart/w3layer'
import type { ContractAddresses } from '../contracts/addresses'
import { RIFTokenAbi } from '../contracts/abis'

/**
 * Approve RIF tokens for staking
 *
 * This must be called before staking if the current allowance is insufficient.
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @param walletClient - Viem WalletClient
 * @param amount - Amount of RIF to approve (in wei)
 * @returns Transaction result
 *
 * @example
 * ```ts
 * // Check current allowance
 * const info = await sdk.staking.getStakingInfo(userAddress)
 *
 * // Approve if needed
 * if (!info.hasAllowance(stakeAmount)) {
 *   const approveTx = await sdk.staking.approveRIF(walletClient, stakeAmount)
 *   await approveTx.wait()
 * }
 * ```
 */
export async function approveRIF(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  walletClient: WalletClient,
  amount: bigint
): Promise<WriteContractResult> {
  return w3.writeContract(walletClient, {
    address: addresses.RIF,
    abi: RIFTokenAbi,
    functionName: 'approve',
    args: [addresses.stRIF, amount],
  })
}
