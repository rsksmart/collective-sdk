import type { Address, WalletClient } from 'viem'
import type { W3LayerInstance } from '@rsksmart/w3layer'
import { validateAddress } from '@rsksmart/sdk-base'
import type { ContractAddresses } from '../contracts/addresses'
import { GovernorAbi } from '../contracts/abis'
import { ProposalState, VoteSupport, type VoteResult } from './types'

/**
 * Check if a user has already voted on a proposal
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @param proposalId - The proposal ID
 * @param voterAddress - The voter's address
 * @returns true if the user has already voted
 * @throws Error if voter address is invalid
 */
export async function hasVoted(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  proposalId: string | bigint,
  voterAddress: Address
): Promise<boolean> {
  validateAddress(voterAddress)
  const id = typeof proposalId === 'string' ? BigInt(proposalId) : proposalId

  return w3.readContract<boolean>({
    address: addresses.governor,
    abi: GovernorAbi,
    functionName: 'hasVoted',
    args: [id, voterAddress],
  })
}

/**
 * Get the current state of a proposal
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @param proposalId - The proposal ID
 * @returns The proposal state
 */
export async function getProposalState(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  proposalId: string | bigint
): Promise<ProposalState> {
  const id = typeof proposalId === 'string' ? BigInt(proposalId) : proposalId

  return w3.readContract<ProposalState>({
    address: addresses.governor,
    abi: GovernorAbi,
    functionName: 'state',
    args: [id],
  })
}

/**
 * Options for casting a vote
 */
export interface CastVoteOptions {
  /** Optional reason for the vote (will be emitted in the event) */
  reason?: string
  /** Skip validation checks (proposal state, already voted). Use with caution. */
  skipValidation?: boolean
}

/**
 * Cast a vote on a proposal
 *
 * This function requires a WalletClient connected to the user's wallet.
 * If a reason is provided in options, it will use castVoteWithReason.
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @param walletClient - Viem WalletClient (from wagmi, window.ethereum, or private key)
 * @param proposalId - The proposal ID to vote on
 * @param support - The vote: VoteSupport.For, VoteSupport.Against, or VoteSupport.Abstain
 * @param options - Optional: reason for the vote, skip validation
 * @returns Vote result with transaction hash and wait function
 *
 * @example
 * ```ts
 * // Simple vote (frontend with wagmi)
 * import { useWalletClient } from 'wagmi'
 * const { data: walletClient } = useWalletClient()
 * const result = await sdk.proposals.castVote(walletClient, proposalId, VoteSupport.For)
 *
 * // Vote with reason
 * const result = await sdk.proposals.castVote(
 *   walletClient,
 *   proposalId,
 *   VoteSupport.Against,
 *   { reason: 'I disagree with the budget allocation' }
 * )
 *
 * // Backend with private key
 * import { createWalletClient, http } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * const account = privateKeyToAccount('0x...')
 * const walletClient = createWalletClient({ account, chain, transport: http() })
 * const result = await sdk.proposals.castVote(walletClient, proposalId, VoteSupport.For)
 * ```
 */
export async function castVote(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  walletClient: WalletClient,
  proposalId: string | bigint,
  support: VoteSupport,
  options: CastVoteOptions = {}
): Promise<VoteResult> {
  const { reason, skipValidation = false } = options
  const id = typeof proposalId === 'string' ? BigInt(proposalId) : proposalId

  const [voterAddress] = await walletClient.getAddresses()
  if (!voterAddress) {
    throw new Error('No account available in wallet client')
  }

  if (!skipValidation) {
    const state = await getProposalState(w3, addresses, id)
    if (state !== ProposalState.Active) {
      throw new Error(
        `Cannot vote on proposal: state is ${ProposalState[state]} (must be Active)`
      )
    }

    const alreadyVoted = await hasVoted(w3, addresses, id, voterAddress)
    if (alreadyVoted) {
      throw new Error('User has already voted on this proposal')
    }
  }

  if (reason) {
    return w3.writeContract(walletClient, {
      address: addresses.governor,
      abi: GovernorAbi,
      functionName: 'castVoteWithReason',
      args: [id, support, reason],
    })
  }

  return w3.writeContract(walletClient, {
    address: addresses.governor,
    abi: GovernorAbi,
    functionName: 'castVote',
    args: [id, support],
  })
}
