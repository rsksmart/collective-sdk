import { describe, it, expect, vi } from 'vitest'
import { getProposal } from '../../src/proposals/getProposal'
import { createTestW3 } from '../setup'
import { mockAddresses, mockProposalId } from '../mocks'
import { ProposalState } from '../../src/proposals/types'

describe('getProposal', () => {
  it('should return null when proposal state call fails', async () => {
    const w3 = createTestW3({
      multicallResults: [
        { status: 'failure', error: new Error('not found') },
        { status: 'success', result: [0n, 0n, 0n] },
        { status: 'success', result: '0x0000000000000000000000000000000000000000' },
        { status: 'success', result: 0n },
        { status: 'success', result: 0n },
        { status: 'success', result: [[], [], [], '0x'] },
        { status: 'success', result: 0n },
        { status: 'success', result: false },
      ],
    })

    const result = await getProposal(w3, mockAddresses, mockProposalId)
    expect(result).toBeNull()
  })

  it('should return quorum as null and quorumReached as null when snapshotBlock is 0', async () => {
    const w3 = createTestW3({
      multicallResults: [
        { status: 'success', result: ProposalState.Active },
        { status: 'success', result: [0n, 100n, 0n] },
        { status: 'success', result: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        { status: 'success', result: 0n }, // snapshotBlock = 0n
        { status: 'success', result: 1000n },
        { status: 'success', result: [[], [], [], '0x'] },
        { status: 'success', result: 0n },
        { status: 'success', result: false },
      ],
    })

    const result = await getProposal(w3, mockAddresses, mockProposalId)

    expect(result).not.toBeNull()
    expect(result!.quorum).toBeNull()
    expect(result!.quorumReached).toBeNull()
  })

  it('should return quorum as null and quorumReached as null when quorum RPC call fails', async () => {
    const w3 = createTestW3({
      multicallResults: [
        { status: 'success', result: ProposalState.Active },
        { status: 'success', result: [0n, 200n, 50n] },
        { status: 'success', result: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        { status: 'success', result: 500n }, // snapshotBlock > 0n
        { status: 'success', result: 1000n },
        { status: 'success', result: [[], [], [], '0x'] },
        { status: 'success', result: 0n },
        { status: 'success', result: false },
      ],
    })

    // Override readContract to reject for the quorum call
    vi.mocked(w3.readContract).mockRejectedValueOnce(new Error('RPC timeout'))

    const result = await getProposal(w3, mockAddresses, mockProposalId)

    expect(result).not.toBeNull()
    expect(result!.quorum).toBeNull()
    expect(result!.quorumReached).toBeNull()
  })

  it('should return quorumReached=true when forVotes >= quorum', async () => {
    const w3 = createTestW3({
      multicallResults: [
        { status: 'success', result: ProposalState.Active },
        { status: 'success', result: [0n, 500n, 0n] }, // [against, for, abstain]
        { status: 'success', result: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        { status: 'success', result: 100n }, // snapshotBlock > 0
        { status: 'success', result: 1000n },
        { status: 'success', result: [[], [], [], '0x'] },
        { status: 'success', result: 0n },
        { status: 'success', result: false },
      ],
    })

    // quorum call returns 200n, forVotes is 500n -> quorumReached = true
    vi.mocked(w3.readContract).mockResolvedValueOnce(200n)

    const result = await getProposal(w3, mockAddresses, mockProposalId)

    expect(result).not.toBeNull()
    expect(result!.quorum).not.toBeNull()
    expect(result!.quorum!.value).toBe(200n)
    expect(result!.quorumReached).toBe(true)
  })

  it('should return quorumReached=false when forVotes < quorum', async () => {
    const w3 = createTestW3({
      multicallResults: [
        { status: 'success', result: ProposalState.Active },
        { status: 'success', result: [0n, 100n, 0n] }, // [against, for, abstain]
        { status: 'success', result: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        { status: 'success', result: 100n }, // snapshotBlock > 0
        { status: 'success', result: 1000n },
        { status: 'success', result: [[], [], [], '0x'] },
        { status: 'success', result: 0n },
        { status: 'success', result: false },
      ],
    })

    // quorum call returns 500n, forVotes is 100n -> quorumReached = false
    vi.mocked(w3.readContract).mockResolvedValueOnce(500n)

    const result = await getProposal(w3, mockAddresses, mockProposalId)

    expect(result).not.toBeNull()
    expect(result!.quorum).not.toBeNull()
    expect(result!.quorum!.value).toBe(500n)
    expect(result!.quorumReached).toBe(false)
  })

  it('should correctly parse proposal state label', async () => {
    const w3 = createTestW3({
      multicallResults: [
        { status: 'success', result: ProposalState.Executed },
        { status: 'success', result: [0n, 0n, 0n] },
        { status: 'success', result: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        { status: 'success', result: 0n },
        { status: 'success', result: 0n },
        { status: 'success', result: [[], [], [], '0x'] },
        { status: 'success', result: 0n },
        { status: 'success', result: false },
      ],
    })

    const result = await getProposal(w3, mockAddresses, mockProposalId)

    expect(result).not.toBeNull()
    expect(result!.state).toBe(ProposalState.Executed)
    expect(result!.stateLabel).toBe('Executed')
  })

  it('should calculate totalVotes correctly', async () => {
    const w3 = createTestW3({
      multicallResults: [
        { status: 'success', result: ProposalState.Active },
        { status: 'success', result: [100n, 200n, 50n] }, // against=100, for=200, abstain=50
        { status: 'success', result: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        { status: 'success', result: 0n },
        { status: 'success', result: 0n },
        { status: 'success', result: [[], [], [], '0x'] },
        { status: 'success', result: 0n },
        { status: 'success', result: false },
      ],
    })

    const result = await getProposal(w3, mockAddresses, mockProposalId)

    expect(result).not.toBeNull()
    expect(result!.votes.forVotes.value).toBe(200n)
    expect(result!.votes.againstVotes.value).toBe(100n)
    expect(result!.votes.abstainVotes.value).toBe(50n)
    expect(result!.votes.totalVotes.value).toBe(350n)
  })

  it('should accept proposal ID as string or bigint', async () => {
    const w3String = createTestW3({
      multicallResults: [
        { status: 'success', result: ProposalState.Active },
        { status: 'success', result: [0n, 0n, 0n] },
        { status: 'success', result: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        { status: 'success', result: 0n },
        { status: 'success', result: 0n },
        { status: 'success', result: [[], [], [], '0x'] },
        { status: 'success', result: 0n },
        { status: 'success', result: false },
      ],
    })

    const resultString = await getProposal(w3String, mockAddresses, '12345')
    expect(resultString).not.toBeNull()
    expect(resultString!.proposalId).toBe('12345')

    const w3BigInt = createTestW3({
      multicallResults: [
        { status: 'success', result: ProposalState.Active },
        { status: 'success', result: [0n, 0n, 0n] },
        { status: 'success', result: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        { status: 'success', result: 0n },
        { status: 'success', result: 0n },
        { status: 'success', result: [[], [], [], '0x'] },
        { status: 'success', result: 0n },
        { status: 'success', result: false },
      ],
    })

    const resultBigInt = await getProposal(w3BigInt, mockAddresses, 12345n)
    expect(resultBigInt).not.toBeNull()
    expect(resultBigInt!.proposalId).toBe('12345')
  })
})
