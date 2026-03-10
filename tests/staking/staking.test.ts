import { describe, it, expect, vi } from 'vitest'
import { approveRIF } from '../../src/staking/approveRIF'
import { stakeRIF } from '../../src/staking/stakeRIF'
import { unstakeRIF } from '../../src/staking/unstakeRIF'
import { getStakingInfo } from '../../src/staking/getStakingInfo'
import { createTestW3 } from '../setup'
import { mockAddresses, mockUserAddress } from '../mocks'
import type { WalletClient } from 'viem'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const VALID_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const

const mockWalletClient = {
  getAddresses: vi.fn().mockResolvedValue([mockUserAddress]),
} as unknown as WalletClient

describe('Staking module', () => {
  describe('approveRIF', () => {
    it('should call writeContract with correct parameters', async () => {
      const w3 = createTestW3()
      const amount = 1000000000000000000n

      const result = await approveRIF(w3, mockAddresses, mockWalletClient, amount)

      expect(result).toHaveProperty('hash')
      expect(w3.writeContract).toHaveBeenCalledWith(
        mockWalletClient,
        expect.objectContaining({
          address: mockAddresses.RIF,
          functionName: 'approve',
          args: [mockAddresses.stRIF, amount],
        })
      )
    })

    it('should allow approving zero amount (to reset allowance)', async () => {
      const w3 = createTestW3()

      const result = await approveRIF(w3, mockAddresses, mockWalletClient, 0n)

      expect(result).toHaveProperty('hash')
      expect(w3.writeContract).toHaveBeenCalledWith(
        mockWalletClient,
        expect.objectContaining({
          args: [mockAddresses.stRIF, 0n],
        })
      )
    })
  })

  describe('stakeRIF', () => {
    it('should call writeContract with correct parameters', async () => {
      const w3 = createTestW3()
      const amount = 1000000000000000000n

      const result = await stakeRIF(w3, mockAddresses, mockWalletClient, amount, VALID_ADDRESS)

      expect(result).toHaveProperty('hash')
      expect(w3.writeContract).toHaveBeenCalledWith(
        mockWalletClient,
        expect.objectContaining({
          address: mockAddresses.stRIF,
          functionName: 'depositAndDelegate',
          args: [VALID_ADDRESS, amount],
        })
      )
    })

    it('should reject amount of 0', async () => {
      const w3 = createTestW3()

      await expect(
        stakeRIF(w3, mockAddresses, mockWalletClient, 0n, VALID_ADDRESS)
      ).rejects.toThrow('Amount must be greater than 0')
    })

    it('should reject negative amount', async () => {
      const w3 = createTestW3()

      await expect(
        stakeRIF(w3, mockAddresses, mockWalletClient, -1n, VALID_ADDRESS)
      ).rejects.toThrow('Amount must be greater than 0')
    })

    it('should reject zero address as delegatee', async () => {
      const w3 = createTestW3()

      await expect(
        stakeRIF(w3, mockAddresses, mockWalletClient, 1000n, ZERO_ADDRESS)
      ).rejects.toThrow('zero address')
    })

    it('should reject invalid address as delegatee', async () => {
      const w3 = createTestW3()

      await expect(
        stakeRIF(w3, mockAddresses, mockWalletClient, 1000n, 'not-address' as `0x${string}`)
      ).rejects.toThrow('Invalid address')
    })
  })

  describe('unstakeRIF', () => {
    it('should call writeContract with correct parameters', async () => {
      const w3 = createTestW3()
      const amount = 500000000000000000n

      const result = await unstakeRIF(w3, mockAddresses, mockWalletClient, amount, VALID_ADDRESS)

      expect(result).toHaveProperty('hash')
      expect(w3.writeContract).toHaveBeenCalledWith(
        mockWalletClient,
        expect.objectContaining({
          address: mockAddresses.stRIF,
          functionName: 'withdrawTo',
          args: [VALID_ADDRESS, amount],
        })
      )
    })

    it('should reject amount of 0', async () => {
      const w3 = createTestW3()

      await expect(
        unstakeRIF(w3, mockAddresses, mockWalletClient, 0n, VALID_ADDRESS)
      ).rejects.toThrow('Amount must be greater than 0')
    })

    it('should reject negative amount', async () => {
      const w3 = createTestW3()

      await expect(
        unstakeRIF(w3, mockAddresses, mockWalletClient, -1n, VALID_ADDRESS)
      ).rejects.toThrow('Amount must be greater than 0')
    })

    it('should reject zero address as recipient', async () => {
      const w3 = createTestW3()

      await expect(
        unstakeRIF(w3, mockAddresses, mockWalletClient, 1000n, ZERO_ADDRESS)
      ).rejects.toThrow('zero address')
    })

    it('should reject invalid address as recipient', async () => {
      const w3 = createTestW3()

      await expect(
        unstakeRIF(w3, mockAddresses, mockWalletClient, 1000n, 'bad-addr' as `0x${string}`)
      ).rejects.toThrow('Invalid address')
    })
  })

  describe('getStakingInfo', () => {
    it('should return staking info with correct shape', async () => {
      const w3 = createTestW3({
        multicallResults: [
          { status: 'success', result: 1000000000000000000n },
          { status: 'success', result: 500000000000000000n },
          { status: 'success', result: 200000000000000000n },
        ],
      })

      const info = await getStakingInfo(w3, mockAddresses, VALID_ADDRESS)

      expect(info.rifBalance.value).toBe(1000000000000000000n)
      expect(info.rifBalance.symbol).toBe('RIF')
      expect(info.stRifBalance.value).toBe(500000000000000000n)
      expect(info.stRifBalance.symbol).toBe('stRIF')
      expect(info.allowance.value).toBe(200000000000000000n)
      expect(typeof info.hasAllowance).toBe('function')
    })

    it('hasAllowance should return true when allowance >= amount', async () => {
      const w3 = createTestW3({
        multicallResults: [
          { status: 'success', result: 0n },
          { status: 'success', result: 0n },
          { status: 'success', result: 1000n },
        ],
      })

      const info = await getStakingInfo(w3, mockAddresses, VALID_ADDRESS)

      expect(info.hasAllowance(500n)).toBe(true)
      expect(info.hasAllowance(1000n)).toBe(true)
      expect(info.hasAllowance(1001n)).toBe(false)
    })

    it('should handle failed multicall results', async () => {
      const w3 = createTestW3({
        multicallResults: [
          { status: 'failure', error: new Error('fail') },
          { status: 'failure', error: new Error('fail') },
          { status: 'failure', error: new Error('fail') },
        ],
      })

      const info = await getStakingInfo(w3, mockAddresses, VALID_ADDRESS)

      expect(info.rifBalance.value).toBe(0n)
      expect(info.stRifBalance.value).toBe(0n)
      expect(info.allowance.value).toBe(0n)
    })

    it('should reject invalid user address', async () => {
      const w3 = createTestW3()

      await expect(
        getStakingInfo(w3, mockAddresses, 'not-address' as `0x${string}`)
      ).rejects.toThrow('Invalid address')
    })
  })
})
