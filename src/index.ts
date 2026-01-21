/**
 * @rsksmart/collective
 *
 * Rootstock Collective DAO SDK
 * Interact with the Collective DAO protocol for backing, governance, and rewards.
 */

export { CollectiveSDK, createCollective } from './collective'

export type {
  CollectiveConfig,
  AvailableForBacking,
  TotalBacking,
  BackersIncentives,
  Builder,
  BuilderStateFlags,
  BackerRewardPercentage,
  BackingModule,
} from './types'

export {
  getContractAddresses,
  createContractAddresses,
  type ContractAddresses,
} from './contracts/addresses'

export type { Address } from 'viem'
export type { TokenAmount, Percentage } from '@rsksmart/sdk-base'
export type { RootstockChainId } from '@rsksmart/w3layer'
