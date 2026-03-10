import type { Address } from 'viem'
import type { TokenAmount } from '@rsksmart/sdk-base'

/**
 * Proposal state enum matching Governor contract
 */
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

/**
 * Vote support options matching Governor contract
 * Against = 0, For = 1, Abstain = 2
 */
export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

/**
 * Human-readable vote labels
 */
export const VoteSupportLabels: Record<VoteSupport, string> = {
  [VoteSupport.Against]: 'Against',
  [VoteSupport.For]: 'For',
  [VoteSupport.Abstain]: 'Abstain',
}

/**
 * Vote transaction result
 */
export interface VoteResult {
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
 * Human-readable proposal state labels
 */
export const ProposalStateLabels: Record<ProposalState, string> = {
  [ProposalState.Pending]: 'Pending',
  [ProposalState.Active]: 'Active',
  [ProposalState.Canceled]: 'Canceled',
  [ProposalState.Defeated]: 'Defeated',
  [ProposalState.Succeeded]: 'Succeeded',
  [ProposalState.Queued]: 'Queued',
  [ProposalState.Expired]: 'Expired',
  [ProposalState.Executed]: 'Executed',
}

/**
 * Proposal category/type
 */
export enum ProposalCategory {
  Grants = 'Grants',
  Activation = 'Activation',
  Deactivation = 'Deactivation',
  Milestone1 = 'Milestone 1',
  Milestone2 = 'Milestone 2',
  Milestone3 = 'Milestone 3',
}

/**
 * Proposal action information
 */
export interface ProposalAction {
  /** Action type (e.g., "transfer", "approve", etc.) */
  type: string
  /** Target contract address */
  target: Address
  /** Recipient address (if applicable) */
  to?: Address
  /** Amount (if applicable) */
  amount?: TokenAmount
  /** Token symbol (if applicable) */
  tokenSymbol?: string
  /** Raw calldata */
  calldata: `0x${string}`
  /** Value sent with the call */
  value: bigint
}

/**
 * Vote counts for a proposal
 */
export interface ProposalVotes {
  /** Votes in favor */
  forVotes: TokenAmount
  /** Votes against */
  againstVotes: TokenAmount
  /** Abstain votes */
  abstainVotes: TokenAmount
  /** Total votes cast */
  totalVotes: TokenAmount
}

/**
 * Basic proposal information (from contract)
 */
export interface ProposalBasic {
  /** Proposal ID (uint256 as string) */
  proposalId: string
  /** Proposer address */
  proposer: Address
  /** Current state */
  state: ProposalState
  /** Human-readable state label */
  stateLabel: string
  /** Block number when snapshot was taken */
  snapshotBlock: bigint
  /** Block number when voting ends */
  deadline: bigint
  /** Votes data */
  votes: ProposalVotes
  /** Quorum required at snapshot (null if could not be fetched) */
  quorum: TokenAmount | null
  /** Whether quorum has been reached (null if quorum could not be determined) */
  quorumReached: boolean | null
}

/**
 * Full proposal details
 */
export interface Proposal extends ProposalBasic {
  /** Target contract addresses for execution */
  targets: Address[]
  /** Values (ETH amounts) for each target call */
  values: bigint[]
  /** Encoded function calls for each target */
  calldatas: `0x${string}`[]
  /** Description hash */
  descriptionHash: `0x${string}`
  /** ETA for execution (0 if not queued) */
  eta: bigint
  /** Whether proposal needs queuing before execution */
  needsQueuing: boolean
  /** Proposal title/name (parsed from description) */
  title?: string
  /** Full description text */
  description?: string
  /** Proposal category/type */
  category?: ProposalCategory
  /** Community discussion URL (e.g., Discourse link) */
  discussionUrl?: string
  /** Creation timestamp (Unix seconds) */
  createdAt?: number
  /** Block number when proposal was created */
  createdAtBlock?: bigint
  /** Parsed actions from calldatas */
  actions?: ProposalAction[]
}

/**
 * Proposal summary for list views
 */
export interface ProposalSummary {
  /** Proposal ID */
  proposalId: string
  /** Index in the proposal list (0-based) */
  index: number
  /** Current state */
  state: ProposalState
  /** Human-readable state label */
  stateLabel: string
  /** Proposer address */
  proposer: Address
  /** Deadline block */
  deadline: bigint
  /** For votes (raw bigint) */
  forVotes: bigint
  /** Against votes (raw bigint) */
  againstVotes: bigint
  /** Abstain votes (raw bigint) */
  abstainVotes: bigint
}

/**
 * Proposals list result
 */
export interface ProposalsListResult {
  /** Total number of proposals */
  totalCount: number
  /** List of proposal summaries */
  proposals: ProposalSummary[]
}

/**
 * Governor statistics
 */
export interface GovernorStats {
  /** Total number of proposals */
  proposalCount: number
  /** Number of currently active proposals */
  activeProposals: number
  /** Minimum voting power required to create a proposal */
  proposalThreshold: TokenAmount
  /** Current quorum percentage (numerator/denominator * 100) */
  quorumPercentage: number
}
