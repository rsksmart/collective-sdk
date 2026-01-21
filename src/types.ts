import type { Address } from 'viem'
import type { RootstockChainId } from '@rsksmart/w3layer'
import type { TokenAmount, Percentage } from '@rsksmart/sdk-base'
import type { ContractAddresses } from './contracts/addresses'

/**
 * Configuration for Collective SDK
 */
export interface CollectiveConfig {
  /** Chain ID: 30 for mainnet, 31 for testnet */
  chainId: RootstockChainId
  /** Custom RPC URL (optional) */
  rpcUrl?: string
  /** Override contract addresses (optional) */
  contractAddresses?: Partial<ContractAddresses>
}

/**
 * Available backing information for a user
 */
export interface AvailableForBacking {
  /** stRIF balance of the user */
  balance: TokenAmount
  /** Total amount already allocated by the user */
  totalAllocated: TokenAmount
  /** Available amount for new backing (balance - totalAllocated) */
  available: TokenAmount
}

/**
 * Total backing information for a user
 */
export interface TotalBacking {
  /** Total amount allocated across all builders */
  amount: TokenAmount
  /** Number of builders the user is backing */
  buildersCount: number
}

/**
 * Backers incentives statistics
 */
export interface BackersIncentives {
  /** Annual Backers Incentives percentage (estimated) */
  annualPercentage: Percentage
  /** Current cycle rewards in RIF */
  rewardsRif: TokenAmount
  /** Current cycle rewards in RBTC */
  rewardsNative: TokenAmount
  /** Current cycle rewards in USDRIF */
  rewardsUsdrif: TokenAmount
  /** Total potential reward for the cycle */
  totalPotentialReward: TokenAmount
}

/**
 * Builder state flags
 */
export interface BuilderStateFlags {
  initialized: boolean
  kycApproved: boolean
  communityApproved: boolean
  kycPaused: boolean
  selfPaused: boolean
}

/**
 * Backer reward percentage configuration
 */
export interface BackerRewardPercentage {
  /** Previous percentage */
  previous: bigint
  /** Next percentage (after cooldown) */
  next: bigint
  /** Cooldown end timestamp */
  cooldownEndTime: bigint
}

/**
 * Builder information
 */
export interface Builder {
  /** Builder wallet address */
  address: Address
  /** Builder's gauge contract address */
  gauge: Address
  /** Builder state flags */
  stateFlags: BuilderStateFlags
  /** Backer reward percentage configuration */
  backerRewardPct: BackerRewardPercentage
  /** Current reward percentage to apply */
  rewardPercentageToApply: bigint
  /** Whether the builder is operational (active and not paused) */
  isOperational: boolean
  /** Total allocation to this builder */
  totalAllocation: bigint
}

/**
 * Backing module interface
 */
export interface BackingModule {
  /** Get available balance for backing */
  getAvailableForBacking: (backerAddress: Address) => Promise<AvailableForBacking>
  /** Get total backing for a user */
  getTotalBacking: (backerAddress: Address) => Promise<TotalBacking>
  /** Get global backers incentives statistics */
  getBackersIncentives: () => Promise<BackersIncentives>
  /** Get list of all builders */
  getBuilders: () => Promise<Builder[]>
  /** Get a specific builder by address */
  getBuilder: (builderAddress: Address) => Promise<Builder | null>
}
