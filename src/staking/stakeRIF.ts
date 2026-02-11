import type { Address, WalletClient } from 'viem'
import type { W3LayerInstance, WriteContractResult } from '@rsksmart/w3layer'
import type { ContractAddresses } from '../contracts/addresses'
import { StRIFTokenAbi } from '../contracts/abis'

/**
 * Result of staking operation
 */
export interface StakeResult extends WriteContractResult {}

/**
 * Stake RIF tokens to receive stRIF
 *
 * This function deposits RIF and delegates voting power to the specified address.
 * The delegatee is typically the user's own address.
 *
 * IMPORTANT: You must first approve the stRIF contract to spend your RIF tokens.
 * Use `approveRIF()` or check `getStakingInfo().hasAllowance()` before staking.
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @param walletClient - Viem WalletClient
 * @param amount - Amount of RIF to stake (in wei)
 * @param delegatee - Address to delegate voting power to (usually your own address)
 * @returns Transaction result
 *
 * @example
 * ```ts
 * import { parseEther } from 'viem'
 *
 * // Stake 100 RIF and delegate to self
 * const amount = parseEther('100')
 *
 * // Check and approve if needed
 * const info = await sdk.staking.getStakingInfo(myAddress)
 * if (!info.hasAllowance(amount)) {
 *   const approveTx = await sdk.staking.approveRIF(walletClient, amount)
 *   await approveTx.wait()
 * }
 *
 * // Stake
 * const stakeTx = await sdk.staking.stakeRIF(walletClient, amount, myAddress)
 * await stakeTx.wait()
 * ```
 */
export async function stakeRIF(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  walletClient: WalletClient,
  amount: bigint,
  delegatee: Address
): Promise<StakeResult> {
  if (amount <= 0n) {
    throw new Error('Amount must be greater than 0')
  }

  return w3.writeContract(walletClient, {
    address: addresses.stRIF,
    abi: StRIFTokenAbi,
    functionName: 'depositAndDelegate',
    args: [delegatee, amount],
  })
}
