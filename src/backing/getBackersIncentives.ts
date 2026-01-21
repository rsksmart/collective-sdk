import type { W3LayerInstance } from '@rsksmart/w3layer'
import { toTokenAmount, formatPercentage } from '@rsksmart/sdk-base'
import type { ContractAddresses } from '../contracts/addresses'
import { BackersManagerAbi, BuilderRegistryAbi, GaugeAbi } from '../contracts/abis'
import type { BackersIncentives } from '../types'
import type { Address } from 'viem'

const RIF_DECIMALS = 18
const RBTC_DECIMALS = 18
const USDRIF_DECIMALS = 18

const PERCENTAGE_PRECISION = 10000
//TODO I put this assuming 2 weeks cycles, we need to check if this is correct with the DAO team.
const CYCLES_PER_YEAR = 26

/**
 * Get global backers incentives statistics
 *
 * @param w3 - W3Layer instance
 * @param addresses - Contract addresses
 * @returns Backers incentives information
 */
export async function getBackersIncentives(
  w3: W3LayerInstance,
  addresses: ContractAddresses
): Promise<BackersIncentives> {
  const [rewardsRif, rewardsNative, rewardsUsdrif, totalPotentialReward] = await Promise.all([
    w3.readContract<bigint>({
      address: addresses.backersManager,
      abi: BackersManagerAbi,
      functionName: 'rewardsRif',
      args: [],
    }),
    w3.readContract<bigint>({
      address: addresses.backersManager,
      abi: BackersManagerAbi,
      functionName: 'rewardsNative',
      args: [],
    }),
    w3.readContract<bigint>({
      address: addresses.backersManager,
      abi: BackersManagerAbi,
      functionName: 'rewardsUsdrif',
      args: [],
    }),
    w3.readContract<bigint>({
      address: addresses.backersManager,
      abi: BackersManagerAbi,
      functionName: 'totalPotentialReward',
      args: [],
    }),
  ])

  // Calculate Annual Backers Incentives (ABI)
  // ABI = (cycleRewards / totalAllocation) * cyclesPerYear * 100
  const annualPercentage = await calculateABI(w3, addresses, rewardsRif)

  return {
    annualPercentage: formatPercentage(annualPercentage, PERCENTAGE_PRECISION),
    rewardsRif: toTokenAmount(rewardsRif, RIF_DECIMALS, 'RIF'),
    rewardsNative: toTokenAmount(rewardsNative, RBTC_DECIMALS, 'RBTC'),
    rewardsUsdrif: toTokenAmount(rewardsUsdrif, USDRIF_DECIMALS, 'USDRIF'),
    totalPotentialReward: toTokenAmount(totalPotentialReward, RIF_DECIMALS),
  }
}

/**
 * Calculate Annual Backers Incentives percentage
 */
async function calculateABI(
  w3: W3LayerInstance,
  addresses: ContractAddresses,
  cycleRewardsRif: bigint
): Promise<number> {
  const gaugesLength = await w3.readContract<bigint>({
    address: addresses.builderRegistry,
    abi: BuilderRegistryAbi,
    functionName: 'getGaugesLength',
    args: [],
  })

  if (gaugesLength === 0n) {
    return 0
  }

  const gauges = await w3.readContract<Address[]>({
    address: addresses.builderRegistry,
    abi: BuilderRegistryAbi,
    functionName: 'getGaugesInRange',
    args: [0n, gaugesLength],
  })

  const allocationResults = await w3.multicall({
    contracts: gauges.map((gauge) => ({
      address: gauge,
      abi: GaugeAbi,
      functionName: 'totalAllocation',
      args: [],
    })),
    allowFailure: true,
  })

  const totalAllocation = allocationResults.reduce((sum, result) => {
    if (result.status === 'success') {
      return sum + (result.result as bigint)
    }
    return sum
  }, 0n)

  if (totalAllocation === 0n) {
    return 0
  }

  // Calculate ABI: (cycleRewards / totalAllocation) * cyclesPerYear * 100
  // Using bigint math with precision to avoid floating point issues
  const abiValue =
    (Number(cycleRewardsRif) / Number(totalAllocation)) * CYCLES_PER_YEAR * PERCENTAGE_PRECISION

  return Math.round(abiValue)
}
