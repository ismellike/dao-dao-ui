import { StdFee } from '@cosmjs/amino'
import {
  CosmWasmClient,
  ExecuteResult,
  SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate'

import {
  Coin,
  CosmosMsgForEmpty,
  Duration,
} from '@dao-dao/types/contracts/common'
import {
  ListVotesResponse,
  Threshold,
  Vote,
  VoteResponse,
} from '@dao-dao/types/contracts/DaoProposalSingle.common'
import {
  ConfigResponse,
  DaoResponse,
  InfoResponse,
  ListProposalsResponse,
  PreProposeInfo,
  ProposalCountResponse,
  ProposalCreationPolicyResponse,
  ProposalHooksResponse,
  ProposalResponse,
  ReverseProposalsResponse,
  VoteHooksResponse,
} from '@dao-dao/types/contracts/DaoProposalSingle.v2'
import { CHAIN_GAS_MULTIPLIER } from '@dao-dao/utils'

export interface DaoProposalSingleV2ReadOnlyInterface {
  contractAddress: string
  config: () => Promise<ConfigResponse>
  proposal: ({
    proposalId,
  }: {
    proposalId: number
  }) => Promise<ProposalResponse>
  listProposals: ({
    limit,
    startAfter,
  }: {
    limit?: number
    startAfter?: number
  }) => Promise<ListProposalsResponse>
  reverseProposals: ({
    limit,
    startBefore,
  }: {
    limit?: number
    startBefore?: number
  }) => Promise<ReverseProposalsResponse>
  proposalCount: () => Promise<ProposalCountResponse>
  getVote: ({
    proposalId,
    voter,
  }: {
    proposalId: number
    voter: string
  }) => Promise<VoteResponse>
  listVotes: ({
    limit,
    proposalId,
    startAfter,
  }: {
    limit?: number
    proposalId: number
    startAfter?: string
  }) => Promise<ListVotesResponse>
  proposalCreationPolicy: () => Promise<ProposalCreationPolicyResponse>
  proposalHooks: () => Promise<ProposalHooksResponse>
  voteHooks: () => Promise<VoteHooksResponse>
  dao: () => Promise<DaoResponse>
  info: () => Promise<InfoResponse>
}
export class DaoProposalSingleV2QueryClient
  implements DaoProposalSingleV2ReadOnlyInterface
{
  client: CosmWasmClient
  contractAddress: string

  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client
    this.contractAddress = contractAddress
    this.config = this.config.bind(this)
    this.proposal = this.proposal.bind(this)
    this.listProposals = this.listProposals.bind(this)
    this.reverseProposals = this.reverseProposals.bind(this)
    this.proposalCount = this.proposalCount.bind(this)
    this.getVote = this.getVote.bind(this)
    this.listVotes = this.listVotes.bind(this)
    this.proposalCreationPolicy = this.proposalCreationPolicy.bind(this)
    this.proposalHooks = this.proposalHooks.bind(this)
    this.voteHooks = this.voteHooks.bind(this)
    this.dao = this.dao.bind(this)
    this.info = this.info.bind(this)
  }

  config = async (): Promise<ConfigResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      config: {},
    })
  }
  proposal = async ({
    proposalId,
  }: {
    proposalId: number
  }): Promise<ProposalResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      proposal: {
        proposal_id: proposalId,
      },
    })
  }
  listProposals = async ({
    limit,
    startAfter,
  }: {
    limit?: number
    startAfter?: number
  }): Promise<ListProposalsResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      list_proposals: {
        limit,
        start_after: startAfter,
      },
    })
  }
  reverseProposals = async ({
    limit,
    startBefore,
  }: {
    limit?: number
    startBefore?: number
  }): Promise<ReverseProposalsResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      reverse_proposals: {
        limit,
        start_before: startBefore,
      },
    })
  }
  proposalCount = async (): Promise<ProposalCountResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      proposal_count: {},
    })
  }
  getVote = async ({
    proposalId,
    voter,
  }: {
    proposalId: number
    voter: string
  }): Promise<VoteResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      get_vote: {
        proposal_id: proposalId,
        voter,
      },
    })
  }
  listVotes = async ({
    limit,
    proposalId,
    startAfter,
  }: {
    limit?: number
    proposalId: number
    startAfter?: string
  }): Promise<ListVotesResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      list_votes: {
        limit,
        proposal_id: proposalId,
        start_after: startAfter,
      },
    })
  }
  proposalCreationPolicy =
    async (): Promise<ProposalCreationPolicyResponse> => {
      return this.client.queryContractSmart(this.contractAddress, {
        proposal_creation_policy: {},
      })
    }
  proposalHooks = async (): Promise<ProposalHooksResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      proposal_hooks: {},
    })
  }
  voteHooks = async (): Promise<VoteHooksResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      vote_hooks: {},
    })
  }
  dao = async (): Promise<DaoResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      dao: {},
    })
  }
  info = async (): Promise<InfoResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      info: {},
    })
  }
}
export interface DaoProposalSingleV2Interface
  extends DaoProposalSingleV2ReadOnlyInterface {
  contractAddress: string
  sender: string
  propose: (
    {
      description,
      msgs,
      proposer,
      title,
    }: {
      description: string
      msgs: CosmosMsgForEmpty[]
      proposer?: string
      title: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  vote: (
    {
      proposalId,
      vote,
    }: {
      proposalId: number
      vote: Vote
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  execute: (
    {
      proposalId,
    }: {
      proposalId: number
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  veto: (
    {
      proposalId,
    }: {
      proposalId: number
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  close: (
    {
      proposalId,
    }: {
      proposalId: number
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  updateConfig: (
    {
      allowRevoting,
      closeProposalOnExecutionFailure,
      dao,
      maxVotingPeriod,
      minVotingPeriod,
      onlyMembersExecute,
      threshold,
    }: {
      allowRevoting: boolean
      closeProposalOnExecutionFailure: boolean
      dao: string
      maxVotingPeriod: Duration
      minVotingPeriod?: Duration
      onlyMembersExecute: boolean
      threshold: Threshold
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  updatePreProposeInfo: (
    {
      info,
    }: {
      info: PreProposeInfo
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  addProposalHook: (
    {
      address,
    }: {
      address: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  removeProposalHook: (
    {
      address,
    }: {
      address: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  addVoteHook: (
    {
      address,
    }: {
      address: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  removeVoteHook: (
    {
      address,
    }: {
      address: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
}
export class DaoProposalSingleV2Client
  extends DaoProposalSingleV2QueryClient
  implements DaoProposalSingleV2Interface
{
  client: SigningCosmWasmClient
  sender: string
  contractAddress: string

  constructor(
    client: SigningCosmWasmClient,
    sender: string,
    contractAddress: string
  ) {
    super(client, contractAddress)
    this.client = client
    this.sender = sender
    this.contractAddress = contractAddress
    this.propose = this.propose.bind(this)
    this.vote = this.vote.bind(this)
    this.execute = this.execute.bind(this)
    this.veto = this.veto.bind(this)
    this.close = this.close.bind(this)
    this.updateConfig = this.updateConfig.bind(this)
    this.updatePreProposeInfo = this.updatePreProposeInfo.bind(this)
    this.addProposalHook = this.addProposalHook.bind(this)
    this.removeProposalHook = this.removeProposalHook.bind(this)
    this.addVoteHook = this.addVoteHook.bind(this)
    this.removeVoteHook = this.removeVoteHook.bind(this)
  }

  propose = async (
    {
      description,
      msgs,
      proposer,
      title,
    }: {
      description: string
      msgs: CosmosMsgForEmpty[]
      proposer?: string
      title: string
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        propose: {
          description,
          msgs,
          proposer,
          title,
        },
      },
      fee,
      memo,
      funds
    )
  }
  vote = async (
    {
      proposalId,
      vote,
    }: {
      proposalId: number
      vote: Vote
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        vote: {
          proposal_id: proposalId,
          vote,
        },
      },
      fee,
      memo,
      funds
    )
  }
  execute = async (
    {
      proposalId,
    }: {
      proposalId: number
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        execute: {
          proposal_id: proposalId,
        },
      },
      fee,
      memo,
      funds
    )
  }
  veto = async (
    {
      proposalId,
    }: {
      proposalId: number
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        veto: {
          proposal_id: proposalId,
        },
      },
      fee,
      memo,
      funds
    )
  }
  close = async (
    {
      proposalId,
    }: {
      proposalId: number
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        close: {
          proposal_id: proposalId,
        },
      },
      fee,
      memo,
      funds
    )
  }
  updateConfig = async (
    {
      allowRevoting,
      closeProposalOnExecutionFailure,
      dao,
      maxVotingPeriod,
      minVotingPeriod,
      onlyMembersExecute,
      threshold,
    }: {
      allowRevoting: boolean
      closeProposalOnExecutionFailure: boolean
      dao: string
      maxVotingPeriod: Duration
      minVotingPeriod?: Duration
      onlyMembersExecute: boolean
      threshold: Threshold
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        update_config: {
          allow_revoting: allowRevoting,
          close_proposal_on_execution_failure: closeProposalOnExecutionFailure,
          dao,
          max_voting_period: maxVotingPeriod,
          min_voting_period: minVotingPeriod,
          only_members_execute: onlyMembersExecute,
          threshold,
        },
      },
      fee,
      memo,
      funds
    )
  }
  updatePreProposeInfo = async (
    {
      info,
    }: {
      info: PreProposeInfo
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        update_pre_propose_info: {
          info,
        },
      },
      fee,
      memo,
      funds
    )
  }
  addProposalHook = async (
    {
      address,
    }: {
      address: string
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        add_proposal_hook: {
          address,
        },
      },
      fee,
      memo,
      funds
    )
  }
  removeProposalHook = async (
    {
      address,
    }: {
      address: string
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        remove_proposal_hook: {
          address,
        },
      },
      fee,
      memo,
      funds
    )
  }
  addVoteHook = async (
    {
      address,
    }: {
      address: string
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        add_vote_hook: {
          address,
        },
      },
      fee,
      memo,
      funds
    )
  }
  removeVoteHook = async (
    {
      address,
    }: {
      address: string
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        remove_vote_hook: {
          address,
        },
      },
      fee,
      memo,
      funds
    )
  }
}
