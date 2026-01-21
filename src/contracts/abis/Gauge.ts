/**
 * Gauge ABI (partial - only functions needed for backing)
 */
export const GaugeAbi = [
  {
    type: 'function',
    name: 'totalAllocation',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allocationOf',
    inputs: [
      {
        name: 'backer',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'allocation',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'rewardShares',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'estimatedBackerRewards',
    inputs: [
      {
        name: 'rewardToken_',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'backer_',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'earned',
    inputs: [
      {
        name: 'rewardToken_',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'backer_',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
] as const
