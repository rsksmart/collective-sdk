import { describe, it, expect } from 'vitest'
import {
  buildTreasuryTransferProposal,
  buildBuilderWhitelistProposal,
  buildBuilderRemovalProposal,
  buildCustomProposal,
  buildProposal,
} from '../../src/proposals/createProposal'
import { mockAddresses, mockBuilderAddress } from '../mocks'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const VALID_RECIPIENT = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const

describe('createProposal', () => {
  describe('parseAmount (tested via buildTreasuryTransferProposal)', () => {
    const baseOptions = {
      token: 'rif' as const,
      recipient: VALID_RECIPIENT,
      description: 'Test transfer',
    }

    it('should parse a valid integer amount', () => {
      const proposal = buildTreasuryTransferProposal(mockAddresses, {
        ...baseOptions,
        amount: '100',
      })
      expect(proposal).toHaveProperty('targets')
      expect(proposal).toHaveProperty('calldatas')
    })

    it('should parse a valid decimal amount', () => {
      const proposal = buildTreasuryTransferProposal(mockAddresses, {
        ...baseOptions,
        amount: '100.5',
      })
      expect(proposal).toHaveProperty('targets')
    })

    it('should parse a small decimal amount', () => {
      const proposal = buildTreasuryTransferProposal(mockAddresses, {
        ...baseOptions,
        amount: '0.001',
      })
      expect(proposal).toHaveProperty('targets')
    })

    it('should reject empty string amount', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          ...baseOptions,
          amount: '',
        })
      ).toThrow('Amount is required')
    })

    it('should reject whitespace-only amount', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          ...baseOptions,
          amount: '   ',
        })
      ).toThrow('Amount cannot be empty')
    })

    it('should reject negative amount', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          ...baseOptions,
          amount: '-100',
        })
      ).toThrow('Amount cannot be negative')
    })

    it('should reject scientific notation', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          ...baseOptions,
          amount: '1e18',
        })
      ).toThrow('Scientific notation is not supported')
    })

    it('should reject uppercase scientific notation', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          ...baseOptions,
          amount: '1E18',
        })
      ).toThrow('Scientific notation is not supported')
    })

    it('should reject non-numeric strings', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          ...baseOptions,
          amount: 'abc',
        })
      ).toThrow('Invalid amount format')
    })

    it('should reject mixed alphanumeric strings', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          ...baseOptions,
          amount: '100abc',
        })
      ).toThrow('Invalid amount format')
    })

    it('should reject zero amount', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          ...baseOptions,
          amount: '0',
        })
      ).toThrow('Amount must be greater than zero')
    })

    it('should reject zero decimal amount', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          ...baseOptions,
          amount: '0.0',
        })
      ).toThrow('Amount must be greater than zero')
    })

    it('should handle amounts with trailing whitespace', () => {
      const proposal = buildTreasuryTransferProposal(mockAddresses, {
        ...baseOptions,
        amount: '  100  ',
      })
      expect(proposal).toHaveProperty('targets')
    })

    it('should work with different token types (rbtc)', () => {
      const proposal = buildTreasuryTransferProposal(mockAddresses, {
        ...baseOptions,
        token: 'rbtc',
        amount: '0.01',
      })
      expect(proposal).toHaveProperty('targets')
    })

    it('should work with different token types (usdrif)', () => {
      const proposal = buildTreasuryTransferProposal(mockAddresses, {
        ...baseOptions,
        token: 'usdrif',
        amount: '1000',
      })
      expect(proposal).toHaveProperty('targets')
    })
  })

  describe('buildTreasuryTransferProposal - address validation', () => {
    it('should reject zero address as recipient', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          token: 'rif',
          recipient: ZERO_ADDRESS,
          amount: '100',
          description: 'Test',
        })
      ).toThrow('zero address')
    })

    it('should reject invalid address format as recipient', () => {
      expect(() =>
        buildTreasuryTransferProposal(mockAddresses, {
          token: 'rif',
          recipient: 'not-an-address' as `0x${string}`,
          amount: '100',
          description: 'Test',
        })
      ).toThrow('Invalid address')
    })

    it('should accept a valid recipient address', () => {
      const proposal = buildTreasuryTransferProposal(mockAddresses, {
        token: 'rif',
        recipient: VALID_RECIPIENT,
        amount: '100',
        description: 'Transfer test',
      })
      expect(proposal.targets).toHaveLength(1)
      expect(proposal.calldatas).toHaveLength(1)
      expect(proposal.description).toBe('Transfer test')
    })
  })

  describe('buildBuilderWhitelistProposal - address validation', () => {
    it('should reject zero address as builder address', () => {
      expect(() =>
        buildBuilderWhitelistProposal(mockAddresses, {
          builderAddress: ZERO_ADDRESS,
          description: 'Whitelist test',
        })
      ).toThrow('zero address')
    })

    it('should reject invalid address format', () => {
      expect(() =>
        buildBuilderWhitelistProposal(mockAddresses, {
          builderAddress: 'invalid' as `0x${string}`,
          description: 'Whitelist test',
        })
      ).toThrow('Invalid address')
    })

    it('should accept a valid builder address', () => {
      const proposal = buildBuilderWhitelistProposal(mockAddresses, {
        builderAddress: mockBuilderAddress,
        description: 'Whitelist builder',
      })
      expect(proposal.targets).toHaveLength(1)
      expect(proposal.calldatas).toHaveLength(1)
    })
  })

  describe('buildBuilderRemovalProposal - address validation', () => {
    it('should reject zero address as builder address', () => {
      expect(() =>
        buildBuilderRemovalProposal(mockAddresses, {
          builderAddress: ZERO_ADDRESS,
          description: 'Remove test',
        })
      ).toThrow('zero address')
    })

    it('should reject invalid address format', () => {
      expect(() =>
        buildBuilderRemovalProposal(mockAddresses, {
          builderAddress: '0xZZZZ' as `0x${string}`,
          description: 'Remove test',
        })
      ).toThrow('Invalid address')
    })

    it('should accept a valid builder address', () => {
      const proposal = buildBuilderRemovalProposal(mockAddresses, {
        builderAddress: mockBuilderAddress,
        description: 'Remove builder',
      })
      expect(proposal.targets).toHaveLength(1)
    })
  })

  describe('buildProposal', () => {
    it('should create a proposal with description hash', () => {
      const proposal = buildProposal(
        [mockAddresses.governor],
        [0n],
        ['0x' as `0x${string}`],
        'Test description'
      )
      expect(proposal.targets).toEqual([mockAddresses.governor])
      expect(proposal.values).toEqual([0n])
      expect(proposal.calldatas).toEqual(['0x'])
      expect(proposal.description).toBe('Test description')
      expect(proposal.descriptionHash).toMatch(/^0x[a-f0-9]{64}$/)
    })
  })

  describe('buildCustomProposal', () => {
    it('should create a custom proposal', () => {
      const proposal = buildCustomProposal({
        targets: [mockAddresses.governor],
        values: [0n],
        calldatas: ['0x' as `0x${string}`],
        description: 'Custom test',
      })
      expect(proposal.targets).toHaveLength(1)
      expect(proposal.description).toBe('Custom test')
      expect(proposal.descriptionHash).toBeDefined()
    })
  })
})
