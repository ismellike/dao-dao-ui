import { selectorFamily } from 'recoil'

import { WithChainId } from '@dao-dao/types'
import {
  ConfigResponse,
  ListProposalsResponse,
  ProposalCountResponse,
  ProposalHooksResponse,
  ProposalResponse,
  ReverseProposalsResponse,
  VoteHooksResponse,
} from '@dao-dao/types/contracts/CwProposalSingle.v1'
import {
  ListVotesResponse,
  VoteResponse,
} from '@dao-dao/types/contracts/DaoProposalSingle.common'

import {
  CwProposalSingleV1Client,
  CwProposalSingleV1QueryClient,
} from '../../../contracts/CwProposalSingle.v1'
import {
  refreshProposalIdAtom,
  refreshProposalsIdAtom,
  signingCosmWasmClientAtom,
} from '../../atoms'
import { cosmWasmClientForChainSelector } from '../chain'
import { contractInfoSelector } from '../contract'
import { queryContractIndexerSelector } from '../indexer'

type QueryClientParams = WithChainId<{
  contractAddress: string
}>

const queryClient = selectorFamily<
  CwProposalSingleV1QueryClient,
  QueryClientParams
>({
  key: 'cwProposalSingleV1QueryClient',
  get:
    ({ contractAddress, chainId }) =>
    ({ get }) => {
      const client = get(cosmWasmClientForChainSelector(chainId))
      return new CwProposalSingleV1QueryClient(client, contractAddress)
    },
  dangerouslyAllowMutability: true,
})

export type ExecuteClientParams = WithChainId<{
  contractAddress: string
  sender: string
}>

export const executeClient = selectorFamily<
  CwProposalSingleV1Client | undefined,
  ExecuteClientParams
>({
  key: 'cwProposalSingleV1ExecuteClient',
  get:
    ({ chainId, contractAddress, sender }) =>
    ({ get }) => {
      const client = get(signingCosmWasmClientAtom({ chainId }))
      if (!client) return

      return new CwProposalSingleV1Client(client, sender, contractAddress)
    },
  dangerouslyAllowMutability: true,
})

export const configSelector = selectorFamily<ConfigResponse, QueryClientParams>(
  {
    key: 'cwProposalSingleV1Config',
    get:
      (queryClientParams) =>
      async ({ get }) => {
        const config = get(
          queryContractIndexerSelector({
            ...queryClientParams,
            formula: 'daoProposalSingle/config',
          })
        )
        if (config) {
          return config
        }

        // If indexer query fails, fallback to contract query.
        const client = get(queryClient(queryClientParams))
        return await client.config()
      },
  }
)
export const proposalSelector = selectorFamily<
  ProposalResponse,
  QueryClientParams & {
    params: Parameters<CwProposalSingleV1Client['proposal']>
  }
>({
  key: 'cwProposalSingleV1Proposal',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const id =
        get(refreshProposalsIdAtom) +
        get(
          refreshProposalIdAtom({
            address: queryClientParams.contractAddress,
            proposalId: params[0].proposalId,
          })
        )

      const proposalResponse = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoProposalSingle/proposal',
          args: {
            id: params[0].proposalId,
          },
          id,
          required: true,
        })
      )
      if (proposalResponse) {
        return proposalResponse
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.proposal(...params)
    },
})
export const listProposalsSelector = selectorFamily<
  ListProposalsResponse,
  QueryClientParams & {
    params: Parameters<CwProposalSingleV1Client['listProposals']>
  }
>({
  key: 'cwProposalSingleV1ListProposals',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const id = get(refreshProposalsIdAtom)

      const proposals = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoProposalSingle/listProposals',
          args: params[0],
          id,
          required: true,
        })
      )
      if (proposals) {
        return { proposals }
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.listProposals(...params)
    },
})
export const reverseProposalsSelector = selectorFamily<
  ReverseProposalsResponse,
  QueryClientParams & {
    params: Parameters<CwProposalSingleV1Client['reverseProposals']>
  }
>({
  key: 'cwProposalSingleV1ReverseProposals',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const id = get(refreshProposalsIdAtom)

      const proposals = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoProposalSingle/reverseProposals',
          args: params[0],
          id,
          required: true,
        })
      )
      if (proposals) {
        return { proposals }
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.reverseProposals(...params)
    },
})
export const proposalCountSelector = selectorFamily<
  ProposalCountResponse,
  QueryClientParams
>({
  key: 'cwProposalSingleV1ProposalCount',
  get:
    (queryClientParams) =>
    async ({ get }) => {
      const id = get(refreshProposalsIdAtom)

      const count = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoProposalSingle/proposalCount',
          id,
        })
      )
      if (typeof count === 'number') {
        return count
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      try {
        return await client.proposalCount()
      } catch {
        // V1 contract throws error if no proposals have been made, so return 0
        // for now until the contract is fixed.
        return 0
      }
    },
})
export const getVoteSelector = selectorFamily<
  VoteResponse,
  QueryClientParams & {
    params: Parameters<CwProposalSingleV1Client['getVote']>
  }
>({
  key: 'cwProposalSingleV1GetVote',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const id =
        get(refreshProposalsIdAtom) +
        get(
          refreshProposalIdAtom({
            address: queryClientParams.contractAddress,
            proposalId: params[0].proposalId,
          })
        )

      const vote = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoProposalSingle/vote',
          args: params[0],
          id,
        })
      )
      // Null when indexer fails. Undefined when no vote exists.
      if (vote !== null) {
        return { vote: vote || null }
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.getVote(...params)
    },
})
export const listVotesSelector = selectorFamily<
  ListVotesResponse,
  QueryClientParams & {
    params: Parameters<CwProposalSingleV1Client['listVotes']>
  }
>({
  key: 'cwProposalSingleV1ListVotes',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const id =
        get(refreshProposalsIdAtom) +
        get(
          refreshProposalIdAtom({
            address: queryClientParams.contractAddress,
            proposalId: params[0].proposalId,
          })
        )

      const votes = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoProposalSingle/listVotes',
          args: params[0],
          id,
        })
      )
      if (votes) {
        return { votes }
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.listVotes(...params)
    },
})
export const proposalHooksSelector = selectorFamily<
  ProposalHooksResponse,
  QueryClientParams
>({
  key: 'cwProposalSingleV1ProposalHooks',
  get:
    (queryClientParams) =>
    async ({ get }) => {
      const client = get(queryClient(queryClientParams))
      return await client.proposalHooks()
    },
})
export const voteHooksSelector = selectorFamily<
  VoteHooksResponse,
  QueryClientParams
>({
  key: 'cwProposalSingleV1VoteHooks',
  get:
    (queryClientParams) =>
    async ({ get }) => {
      const client = get(queryClient(queryClientParams))
      return await client.voteHooks()
    },
})
export const infoSelector = contractInfoSelector
