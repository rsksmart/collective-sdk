import type { Address, WalletClient } from 'viem'
import type { W3LayerInstance } from '@rsksmart/w3layer'
import { validateAddress, isZeroAddress } from '@rsksmart/sdk-base'
import type { ContractAddresses } from '../contracts/addresses'
import { StRIFTokenAbi } from '../contracts/abis'
import type { StakeResult } from './stakeRIF'

/**
 * Unstake stRIF to receive RIF tokens back
 *
 * This function withdraws staked RIF tokens to the specified recipient address.
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @param walletClient - Viem WalletClient
 * @param amount - Amount of stRIF to unstake (in wei)
 * @param recipient - Address to receive the RIF tokens (usually your own address)
 * @returns Transaction result
 *
 * @example
 * ```ts
 * import { parseEther } from 'viem'
 *
 * // Unstake 50 stRIF
 * const amount = parseEther('50')
 * const unstakeTx = await sdk.staking.unstakeRIF(walletClient, amount, myAddress)
 * await unstakeTx.wait()
 * ```
 */
export async function unstakeRIF(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  walletClient: WalletClient,
  amount: bigint,
  recipient: Address
): Promise<StakeResult> {
  if (amount <= 0n) {
    throw new Error('Amount must be greater than 0')
  }

  // Validate recipient address
  validateAddress(recipient)
  if (isZeroAddress(recipient)) {
    throw new Error('Recipient cannot be the zero address - RIF tokens would be permanently lost')
  }

  return w3.writeContract(walletClient, {
    address: addresses.stRIF,
    abi: StRIFTokenAbi,
    functionName: 'withdrawTo',
    args: [recipient, amount],
  })
}
