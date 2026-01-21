import type { Address } from 'viem'
import type { RootstockChainId } from '@rsksmart/w3layer'

/**
 * Contract addresses per network
 */
export interface ContractAddresses {
  stRIF: Address
  backersManager: Address
  builderRegistry: Address
}

/**
 * Contract addresses for Rootstock Mainnet (chainId: 30)
 */
const mainnetAddresses: ContractAddresses = {
  stRIF: '0x5db91e24bd32059584bbdb831a901f1199f3d459' as Address,
  backersManager: '0x7995C48D987941291d8008695A4133E557a11530' as Address,
  builderRegistry: '0x8cb62c58AC3D1253c6467537FDDc563857eD76cb' as Address,
}

/**
 * Contract addresses for Rootstock Testnet (chainId: 31)
 */
const testnetAddresses: ContractAddresses = {
  stRIF: '0xC4b091d97AD25ceA5922f09fe80711B7ACBbb16f' as Address,
  backersManager: '0x70AC0FE4F8BCA42Aa7e713E1EDA2E8166d0f8Ed8' as Address,
  builderRegistry: '0xad125E6D5C3B84329fa2466A8A6955F67906F4b2' as Address,
}

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: RootstockChainId): ContractAddresses {
  switch (chainId) {
    case 30:
      return mainnetAddresses
    case 31:
      return testnetAddresses
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

/**
 * Override contract addresses (useful for testing or custom deployments)
 */
export function createContractAddresses(
  chainId: RootstockChainId,
  overrides: Partial<ContractAddresses>
): ContractAddresses {
  const defaults = getContractAddresses(chainId)
  return {
    ...defaults,
    ...overrides,
  }
}
