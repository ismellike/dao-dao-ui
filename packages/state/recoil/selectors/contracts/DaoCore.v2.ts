import { selectorFamily, waitForAll, waitForAny } from 'recoil'

import {
  GenericTokenBalance,
  PolytoneProxies,
  TokenType,
  WithChainId,
} from '@dao-dao/types'
import { TokenInfoResponse } from '@dao-dao/types/contracts/Cw20Base'
import { ContractInfoResponse } from '@dao-dao/types/contracts/Cw721Base'
import {
  ActiveProposalModulesResponse,
  AdminNominationResponse,
  AdminResponse,
  ConfigResponse,
  Cw20BalancesResponse,
  Cw20TokenListResponse,
  Cw721TokenListResponse,
  DaoURIResponse,
  DumpStateResponse,
  GetItemResponse,
  ListItemsResponse,
  ListSubDaosResponse,
  PauseInfoResponse,
  ProposalModulesResponse,
  TotalPowerAtHeightResponse,
  VotingModuleResponse,
  VotingPowerAtHeightResponse,
} from '@dao-dao/types/contracts/DaoCore.v2'
import {
  CW721_WORKAROUND_ITEM_KEY_PREFIX,
  POLYTONE_CW721_ITEM_KEY_PREFIX,
  getSupportedChainConfig,
  polytoneNoteProxyMapToChainIdMap,
} from '@dao-dao/utils'

import {
  CommonNftSelectors,
  DaoVotingCw20StakedSelectors,
  PolytoneNoteSelectors,
} from '.'
import {
  DaoCoreV2Client,
  DaoCoreV2QueryClient,
} from '../../../contracts/DaoCore.v2'
import {
  refreshDaoVotingPowerAtom,
  refreshWalletBalancesIdAtom,
  signingCosmWasmClientAtom,
} from '../../atoms'
import { cosmWasmClientForChainSelector } from '../chain'
import { contractInfoSelector } from '../contract'
import { queryContractIndexerSelector } from '../indexer'
import { genericTokenSelector } from '../token'
import * as Cw20BaseSelectors from './Cw20Base'

type QueryClientParams = WithChainId<{
  contractAddress: string
}>

export const queryClient = selectorFamily<
  DaoCoreV2QueryClient,
  QueryClientParams
>({
  key: 'daoCoreV2QueryClient',
  get:
    ({ contractAddress, chainId }) =>
    ({ get }) => {
      const client = get(cosmWasmClientForChainSelector(chainId))
      return new DaoCoreV2QueryClient(client, contractAddress)
    },
  dangerouslyAllowMutability: true,
})

export type ExecuteClientParams = WithChainId<{
  contractAddress: string
  sender: string
}>

export const executeClient = selectorFamily<
  DaoCoreV2Client | undefined,
  ExecuteClientParams
>({
  key: 'daoCoreV2ExecuteClient',
  get:
    ({ chainId, contractAddress, sender }) =>
    ({ get }) => {
      const client = get(signingCosmWasmClientAtom({ chainId }))
      if (!client) return

      return new DaoCoreV2Client(client, sender, contractAddress)
    },
  dangerouslyAllowMutability: true,
})

export const adminSelector = selectorFamily<
  AdminResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['admin']>
  }
>({
  key: 'daoCoreV2Admin',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const admin = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/admin',
        })
      )
      // Null when indexer fails. Undefined if no admin.
      if (admin !== null) {
        return admin || null
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.admin(...params)
    },
})
export const adminNominationSelector = selectorFamily<
  AdminNominationResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['adminNomination']>
  }
>({
  key: 'daoCoreV2AdminNomination',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const nomination = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/adminNomination',
        })
      )
      // Null when indexer fails. Undefined if no nomination.
      if (nomination !== null) {
        return { nomination: nomination || null }
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.adminNomination(...params)
    },
})
export const configSelector = selectorFamily<
  ConfigResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['config']>
  }
>({
  key: 'daoCoreV2Config',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const config = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/config',
        })
      )
      if (config) {
        return config
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.config(...params)
    },
})
// Use allCw20TokensWithBalancesSelector as it uses the indexer and implements
// pagination for chain queries.
export const _cw20BalancesSelector = selectorFamily<
  Cw20BalancesResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['cw20Balances']>
  }
>({
  key: 'daoCoreV2_Cw20Balances',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const client = get(queryClient(queryClientParams))
      get(refreshWalletBalancesIdAtom(undefined))
      get(refreshWalletBalancesIdAtom(queryClientParams.contractAddress))
      return await client.cw20Balances(...params)
    },
})
// Use allCw20TokenListSelector as it uses the indexer and implements pagination
// for chain queries.
export const _cw20TokenListSelector = selectorFamily<
  Cw20TokenListResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['cw20TokenList']>
  }
>({
  key: 'daoCoreV2_Cw20TokenList',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const client = get(queryClient(queryClientParams))
      return await client.cw20TokenList(...params)
    },
})
// Use allNativeCw721TokenListSelector as it uses the indexer and implements
// pagination for chain queries.
export const _cw721TokenListSelector = selectorFamily<
  Cw721TokenListResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['cw721TokenList']>
  }
>({
  key: 'daoCoreV2_Cw721TokenList',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const client = get(queryClient(queryClientParams))
      return await client.cw721TokenList(...params)
    },
})
// Reduced to only the necessary subset which can be provided by both the
// indexer and chain.
export const dumpStateSelector = selectorFamily<
  DumpStateResponse | undefined,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['dumpState']>
  }
>({
  key: 'daoCoreV2DumpState',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const state = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/dumpState',
          required: true,
        })
      )
      if (state) {
        return state
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      try {
        return await client.dumpState(...params)
      } catch (err) {
        // Ignore errors. An undefined response is sometimes used to indicate
        // that this contract is not a DAO.
        console.error(err)
      }
    },
})
export const getItemSelector = selectorFamily<
  GetItemResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['getItem']>
  }
>({
  key: 'daoCoreV2GetItem',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const item = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/item',
          args: params[0],
        })
      )
      // Null when indexer fails. Undefined if no item.
      if (item !== null) {
        return { item: item || null }
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.getItem(...params)
    },
})
// Use listAllItemsSelector as it uses the indexer and implements pagination for
// chain queries.
export const _listItemsSelector = selectorFamily<
  ListItemsResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['listItems']>
  }
>({
  key: 'daoCoreV2_ListItems',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const client = get(queryClient(queryClientParams))
      return await client.listItems(...params)
    },
})
export const proposalModulesSelector = selectorFamily<
  ProposalModulesResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['proposalModules']>
  }
>({
  key: 'daoCoreV2ProposalModules',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const proposalModules = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/proposalModules',
        })
      )
      if (proposalModules) {
        return proposalModules
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.proposalModules(...params)
    },
})
export const activeProposalModulesSelector = selectorFamily<
  ActiveProposalModulesResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['activeProposalModules']>
  }
>({
  key: 'daoCoreV2ActiveProposalModules',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const activeProposalModules = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/activeProposalModules',
        })
      )
      if (activeProposalModules) {
        return activeProposalModules
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.activeProposalModules(...params)
    },
})
export const pauseInfoSelector = selectorFamily<
  PauseInfoResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['pauseInfo']>
  }
>({
  key: 'daoCoreV2PauseInfo',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const paused = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/paused',
        })
      )
      if (paused) {
        return paused
      }

      // If indexer fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.pauseInfo(...params)
    },
})
export const votingModuleSelector = selectorFamily<
  VotingModuleResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['votingModule']>
  }
>({
  key: 'daoCoreV2VotingModule',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const votingModule = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/votingModule',
        })
      )
      if (votingModule) {
        return votingModule
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.votingModule(...params)
    },
})
// Use listAllSubDaosSelector as it uses the indexer and implements pagination
// for chain queries.
export const _listSubDaosSelector = selectorFamily<
  ListSubDaosResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['listSubDaos']>
  }
>({
  key: 'daoCoreV2_ListSubDaos',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const client = get(queryClient(queryClientParams))
      return await client.listSubDaos(...params)
    },
})
export const daoURISelector = selectorFamily<
  DaoURIResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['daoURI']>
  }
>({
  key: 'daoCoreV2DaoURI',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const daoUri = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/daoUri',
        })
      )
      // Null when indexer fails. Undefined if no URI.
      if (daoUri !== null) {
        return daoUri || null
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.daoURI(...params)
    },
})
export const votingPowerAtHeightSelector = selectorFamily<
  VotingPowerAtHeightResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['votingPowerAtHeight']>
  }
>({
  key: 'daoCoreV2VotingPowerAtHeight',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const id = get(
        refreshDaoVotingPowerAtom(queryClientParams.contractAddress)
      )

      const votingPower = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/votingPower',
          args: {
            address: params[0].address,
          },
          block: params[0].height ? { height: params[0].height } : undefined,
          id,
        })
      )
      if (votingPower && !isNaN(votingPower)) {
        return {
          power: votingPower,
          height: params[0].height,
        }
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.votingPowerAtHeight(...params)
    },
})
export const totalPowerAtHeightSelector = selectorFamily<
  TotalPowerAtHeightResponse,
  QueryClientParams & {
    params: Parameters<DaoCoreV2QueryClient['totalPowerAtHeight']>
  }
>({
  key: 'daoCoreV2TotalPowerAtHeight',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const id = get(
        refreshDaoVotingPowerAtom(queryClientParams.contractAddress)
      )

      const totalPower = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/totalPower',
          block: params[0].height ? { height: params[0].height } : undefined,
          id,
        })
      )
      if (totalPower && !isNaN(totalPower)) {
        return {
          power: totalPower,
          height: params[0].height,
        }
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.totalPowerAtHeight(...params)
    },
})

export const infoSelector = contractInfoSelector

///! Custom selectors

const CW20_TOKEN_LIST_LIMIT = 30
export const allCw20TokenListSelector = selectorFamily<
  Cw20TokenListResponse,
  QueryClientParams
>({
  key: 'daoCoreV2AllCw20TokenList',
  get:
    (queryClientParams) =>
    async ({ get }) => {
      const list = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/cw20List',
        })
      )
      if (list) {
        return list
      }

      // If indexer query fails, fallback to contract query.

      const tokenList: Cw20TokenListResponse = []
      while (true) {
        const response = await get(
          _cw20TokenListSelector({
            ...queryClientParams,
            params: [
              {
                startAfter: tokenList[tokenList.length - 1],
                limit: CW20_TOKEN_LIST_LIMIT,
              },
            ],
          })
        )
        if (!response.length) break

        tokenList.push(...response)

        // If we have less than the limit of items, we've exhausted them.
        if (response.length < CW20_TOKEN_LIST_LIMIT) {
          break
        }
      }

      return tokenList
    },
})

export const allCw20InfosSelector = selectorFamily<
  {
    address: string
    info: TokenInfoResponse
  }[],
  QueryClientParams & {
    governanceTokenAddress?: string
  }
>({
  key: 'daoCoreV2AllCw20Infos',
  get:
    ({ governanceTokenAddress, ...queryClientParams }) =>
    async ({ get }) => {
      //! Get all addresses.
      const addresses = [...get(allCw20TokenListSelector(queryClientParams))]

      //! Add governance token balance if exists but missing from list.
      if (
        governanceTokenAddress &&
        !addresses.includes(governanceTokenAddress)
      ) {
        // Add to beginning of list.
        addresses.splice(0, 0, governanceTokenAddress)
      }

      const infos = get(
        waitForAll(
          addresses.map((contractAddress) =>
            Cw20BaseSelectors.tokenInfoSelector({
              // Copies over chainId and any future additions to client params.
              ...queryClientParams,

              contractAddress,
              params: [],
            })
          )
        )
      )

      return addresses.map((address, index) => ({
        address,
        info: infos[index],
      }))
    },
})

const CW20_BALANCES_LIMIT = 10
export const allCw20TokensWithBalancesSelector = selectorFamily<
  GenericTokenBalance[],
  QueryClientParams & {
    governanceTokenAddress?: string
  }
>({
  key: 'daoCoreV2AllCw20TokensWithBalances',
  get:
    ({ governanceTokenAddress, ...queryClientParams }) =>
    async ({ get }) => {
      const generalId = get(refreshWalletBalancesIdAtom(undefined))
      const specificId = get(
        refreshWalletBalancesIdAtom(queryClientParams.contractAddress)
      )

      const governanceTokenBalance = governanceTokenAddress
        ? get(
            Cw20BaseSelectors.balanceSelector({
              // Copies over chainId and any future additions to client params.
              ...queryClientParams,

              contractAddress: governanceTokenAddress,
              params: [{ address: queryClientParams.contractAddress }],
            })
          ).balance
        : undefined

      let balances: Cw20BalancesResponse | null = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/cw20Balances',
          // Update each time one of these changes.
          id: generalId + specificId,
        })
      )
      if (balances) {
        // Copy to new array so we can mutate it below.
        balances = [...balances]
        // If indexer query fails, fallback to contract query.
      } else {
        balances = []
        while (true) {
          const response = await get(
            _cw20BalancesSelector({
              ...queryClientParams,
              params: [
                {
                  startAfter: balances[balances.length - 1]?.addr,
                  limit: CW20_BALANCES_LIMIT,
                },
              ],
            })
          )
          if (!response.length) break

          balances.push(...response)

          // If we have less than the limit of items, we've exhausted them.
          if (response.length < CW20_BALANCES_LIMIT) {
            break
          }
        }
      }

      //! Add governance token balance if exists but missing from list.
      if (
        governanceTokenAddress &&
        governanceTokenBalance &&
        !balances.some(({ addr }) => addr === governanceTokenAddress)
      ) {
        // Add to beginning of list.
        balances.splice(0, 0, {
          addr: governanceTokenAddress,
          balance: governanceTokenBalance,
        })
      }

      const tokens = get(
        waitForAll(
          balances.map(({ addr }) =>
            genericTokenSelector({
              type: TokenType.Cw20,
              denomOrAddress: addr,
              chainId: queryClientParams.chainId,
            })
          )
        )
      )

      return tokens.map((token, index) => ({
        token,
        balance: balances![index].balance,
        isGovernanceToken:
          !!governanceTokenAddress &&
          governanceTokenAddress === token.denomOrAddress,
      }))
    },
})

const CW721_TOKEN_LIST_LIMIT = 30
export const allNativeCw721TokenListSelector = selectorFamily<
  Cw721TokenListResponse,
  QueryClientParams & {
    governanceCollectionAddress?: string
  }
>({
  key: 'daoCoreV2AllNativeCw721TokenList',
  get:
    ({ governanceCollectionAddress, ...queryClientParams }) =>
    async ({ get }) => {
      // Load workaround CW721s from storage items.
      const workaroundContracts = get(
        listAllItemsWithPrefixSelector({
          ...queryClientParams,
          prefix: CW721_WORKAROUND_ITEM_KEY_PREFIX,
        })
      ).map(([key]) => key.substring(CW721_WORKAROUND_ITEM_KEY_PREFIX.length))

      let list = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/cw721List',
        })
      )
      if (list && Array.isArray(list)) {
        // Copy to new array so we can mutate it below.
        list = [...workaroundContracts, ...list]
        // Add governance collection to beginning of list if not present.
        if (
          governanceCollectionAddress &&
          !list.includes(governanceCollectionAddress)
        ) {
          list.splice(0, 0, governanceCollectionAddress)
        }

        return list
      }

      // If indexer query fails, fallback to contract query.

      const tokenList: Cw721TokenListResponse = [...workaroundContracts]
      while (true) {
        const response = await get(
          _cw721TokenListSelector({
            ...queryClientParams,
            params: [
              {
                startAfter: tokenList[tokenList.length - 1],
                limit: CW721_TOKEN_LIST_LIMIT,
              },
            ],
          })
        )
        if (!response?.length) break

        tokenList.push(...response)

        // If we have less than the limit of items, we've exhausted them.
        if (response.length < CW721_TOKEN_LIST_LIMIT) {
          break
        }
      }

      // Add governance collection to beginning of list if not present.
      if (
        governanceCollectionAddress &&
        !tokenList.includes(governanceCollectionAddress)
      ) {
        tokenList.splice(0, 0, governanceCollectionAddress)
      }

      return tokenList
    },
})

// Get all cw721 collections stored in the items list for polytone proxies
// across all chains.
export const allPolytoneCw721CollectionsSelector = selectorFamily<
  Record<
    string,
    {
      proxy: string
      collectionAddresses: string[]
    }
  >,
  QueryClientParams
>({
  key: 'daoCoreV2AllPolytoneCw721Collections',
  get:
    (queryClientParams) =>
    ({ get }) => {
      const polytoneProxies = get(polytoneProxiesSelector(queryClientParams))
      const polytoneCw721Keys = get(
        listAllItemsWithPrefixSelector({
          ...queryClientParams,
          prefix: POLYTONE_CW721_ITEM_KEY_PREFIX,
        })
      )

      const collectionsByChain = polytoneCw721Keys.reduce(
        (acc, [key]) => {
          const [, chainId, collectionAddress] = key.split(':')
          // If no polytone proxy for this chain, skip it. This should only
          // happen if a key is manually set for a chain that does not have a
          // polytone proxy.
          if (!(chainId in polytoneProxies)) {
            return acc
          }

          if (!acc[chainId]) {
            acc[chainId] = {
              proxy: polytoneProxies[chainId],
              collectionAddresses: [],
            }
          }
          acc[chainId].collectionAddresses.push(collectionAddress)

          return acc
        },
        {} as Record<
          string,
          {
            proxy: string
            collectionAddresses: string[]
          }
        >
      )

      return collectionsByChain
    },
})

// Combine native and polytone NFT collections.
export const allCw721CollectionsSelector = selectorFamily<
  Record<
    string,
    {
      owner: string
      collectionAddresses: string[]
    }
  >,
  QueryClientParams & {
    governanceCollectionAddress?: string
  }
>({
  key: 'daoCoreV2AllCw721Collections',
  get:
    (queryClientParams) =>
    ({ get }) => {
      const nativeCw721TokenList = get(
        allNativeCw721TokenListSelector(queryClientParams)
      )
      const polytoneCw721Collections = get(
        allPolytoneCw721CollectionsSelector(queryClientParams)
      )

      // Start with native NFTs.
      let allNfts: Record<
        string,
        {
          owner: string
          collectionAddresses: string[]
        }
      > = {
        [queryClientParams.chainId]: {
          owner: queryClientParams.contractAddress,
          collectionAddresses: nativeCw721TokenList,
        },
      }

      // Add polytone NFTs.
      Object.entries(polytoneCw721Collections).forEach(
        ([chainId, { proxy, collectionAddresses }]) => {
          allNfts[chainId] = {
            owner: proxy,
            collectionAddresses,
          }
        }
      )

      return allNfts
    },
})

// Get all CW721 collections, filtered by the DAO being the minter.
export const allCw721CollectionsWithDaoAsMinterSelector = selectorFamily<
  ({
    address: string
    // DAO's address or polytone proxy that is the minter.
    minter: string
    chainId: string
  } & ContractInfoResponse)[],
  QueryClientParams
>({
  key: 'daoCoreV2AllCw721CollectionsWithDaoAsMinter',
  get:
    (queryClientParams) =>
    ({ get }) => {
      // Flatten dictionary of chainId -> { owner, collectionAddresses } into
      // list of each collection.
      const collections = Object.entries(
        get(allCw721CollectionsSelector(queryClientParams))
      ).flatMap(([chainId, { owner, collectionAddresses }]) =>
        collectionAddresses.map((collectionAddress) => ({
          owner,
          collectionAddress,
          chainId,
        }))
      )

      // Get the minter for each collection.
      const minterResponses = get(
        waitForAny(
          collections.map(({ chainId, collectionAddress }) =>
            CommonNftSelectors.minterSelector({
              contractAddress: collectionAddress,
              chainId,
              params: [],
            })
          )
        )
      )
      // Filter out collections that don't have the DAO as the minter.
      const collectionsWithDaoAsMinter = collections.filter(
        ({ owner }, idx) =>
          minterResponses[idx].state === 'hasValue' &&
          minterResponses[idx].contents.minter === owner
      )

      const collectionInfos = get(
        waitForAny(
          collectionsWithDaoAsMinter.map(({ chainId, collectionAddress }) =>
            CommonNftSelectors.contractInfoSelector({
              contractAddress: collectionAddress,
              chainId,
              params: [],
            })
          )
        )
      )

      return collectionsWithDaoAsMinter.flatMap(
        ({ chainId, owner, collectionAddress }, idx) =>
          collectionInfos[idx].state === 'hasValue'
            ? [
                {
                  chainId,
                  minter: owner,
                  address: collectionAddress,
                  ...collectionInfos[idx].contents!,
                },
              ]
            : []
      )
    },
})

const SUBDAO_LIST_LIMIT = 30
export const listAllSubDaosSelector = selectorFamily<
  ListSubDaosResponse,
  QueryClientParams
>({
  key: 'daoCoreV2ListAllSubDaos',
  get:
    (queryClientParams) =>
    async ({ get }) => {
      const list = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/listSubDaos',
        })
      )
      if (list) {
        return list
      }

      // If indexer query fails, fallback to contract query.

      const subdaos: ListSubDaosResponse = []

      while (true) {
        const response = await get(
          _listSubDaosSelector({
            ...queryClientParams,
            params: [
              {
                startAfter: subdaos[subdaos.length - 1]?.addr,
                limit: SUBDAO_LIST_LIMIT,
              },
            ],
          })
        )
        if (!response?.length) break

        subdaos.push(...response)

        // If we have less than the limit of items, we've exhausted them.
        if (response.length < SUBDAO_LIST_LIMIT) {
          break
        }
      }

      return subdaos
    },
})

export const allSubDaoConfigsSelector = selectorFamily<
  ({ address: string } & ConfigResponse)[],
  QueryClientParams
>({
  key: 'daoCoreV2AllSubDaoConfigs',
  get:
    (queryClientParams) =>
    async ({ get }) => {
      const subDaos = get(listAllSubDaosSelector(queryClientParams))
      const subDaoConfigs = get(
        waitForAll(
          subDaos.map(({ addr }) =>
            configSelector({
              // Copies over chainId and any future additions to client params.
              ...queryClientParams,

              contractAddress: addr,
              params: [],
            })
          )
        )
      )

      return subDaos.map(({ addr }, index) => ({
        address: addr,
        ...subDaoConfigs[index],
      }))
    },
})

// Will fail if cannot fetch governance token address.
export const tryFetchGovernanceTokenAddressSelector = selectorFamily<
  string,
  QueryClientParams
>({
  key: 'daoCoreV2TryFetchGovernanceTokenAddress',
  get:
    (queryClientParams) =>
    async ({ get }) => {
      const votingModuleAddress = get(
        votingModuleSelector({ ...queryClientParams, params: [] })
      )
      const governanceTokenAddress = get(
        DaoVotingCw20StakedSelectors.tokenContractSelector({
          ...queryClientParams,
          contractAddress: votingModuleAddress,
          params: [],
        })
      )
      return governanceTokenAddress
    },
})

const ITEM_LIST_LIMIT = 30
export const listAllItemsSelector = selectorFamily<
  ListItemsResponse,
  QueryClientParams
>({
  key: 'daoCoreV2ListAllItems',
  get:
    (queryClientParams) =>
    async ({ get }) => {
      const list = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/listItems',
        })
      )
      if (list) {
        return list
      }

      // If indexer query fails, fallback to contract query.

      const items: ListItemsResponse = []

      while (true) {
        const response = await get(
          _listItemsSelector({
            ...queryClientParams,
            params: [
              {
                startAfter: items[items.length - 1]?.[0],
                limit: ITEM_LIST_LIMIT,
              },
            ],
          })
        )
        if (!response?.length) break

        items.push(...response)

        // If we have less than the limit of items, we've exhausted them.
        if (response.length < ITEM_LIST_LIMIT) {
          break
        }
      }

      return items
    },
})

export const listAllItemsWithPrefixSelector = selectorFamily<
  ListItemsResponse,
  QueryClientParams & { prefix: string }
>({
  key: 'daoCoreV2ListAllItemsWithPrefix',
  get:
    ({ prefix, ...queryClientParams }) =>
    async ({ get }) => {
      const items = get(listAllItemsSelector(queryClientParams))
      return items.filter(([key]) => key.startsWith(prefix))
    },
})

export const polytoneProxiesSelector = selectorFamily<
  PolytoneProxies,
  QueryClientParams
>({
  key: 'daoCoreV2PolytoneProxies',
  get:
    (queryClientParams) =>
    async ({ get }) => {
      // Mapping from polytone note contract to remote proxy address.
      const noteToRemoteProxy: Record<string, string> = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoCore/polytoneProxies',
        })
      )
      if (noteToRemoteProxy) {
        return polytoneNoteProxyMapToChainIdMap(
          queryClientParams.chainId,
          noteToRemoteProxy
        )
      }

      // Get polytone notes on this chain.
      const polytoneConnections =
        getSupportedChainConfig(queryClientParams.chainId)?.polytone || {}

      // Fallback to contract query if indexer fails.
      return Object.entries(polytoneConnections)
        .map(([chainId, { note }]) => ({
          chainId,
          proxy: get(
            PolytoneNoteSelectors.remoteAddressSelector({
              contractAddress: note,
              chainId: queryClientParams.chainId,
              params: [
                {
                  localAddress: queryClientParams.contractAddress,
                },
              ],
            })
          ),
        }))
        .reduce(
          (acc, { chainId, proxy }) => ({
            ...acc,
            ...(proxy
              ? {
                  [chainId]: proxy,
                }
              : {}),
          }),
          {} as PolytoneProxies
        )
    },
})

export const coreAddressForPolytoneProxySelector = selectorFamily<
  string | undefined,
  { chainId: string; voice: string; proxy: string }
>({
  key: 'daoCoreV2CoreAddressForPolytoneProxy',
  get:
    ({ chainId, voice, proxy }) =>
    ({ get }) =>
      get(
        queryContractIndexerSelector({
          chainId,
          contractAddress: voice,
          formula: 'polytone/voice/remoteController',
          args: {
            address: proxy,
          },
          required: true,
        })
      ),
})

export const approvalDaosSelector = selectorFamily<
  {
    dao: string
    preProposeAddress: string
  }[],
  QueryClientParams
>({
  key: 'daoCoreV2ApprovalDaos',
  get:
    ({ chainId, contractAddress }) =>
    ({ get }) =>
      get(
        queryContractIndexerSelector({
          chainId,
          contractAddress,
          formula: 'daoCore/approvalDaos',
          required: true,
        })
      ),
})

/**
 * DAOs which this DAO has veto power over.
 */
export const vetoDaosSelector = selectorFamily<
  {
    dao: string
    proposalModule: string
  }[],
  QueryClientParams
>({
  key: 'daoCoreV2VetoDaos',
  get:
    ({ chainId, contractAddress }) =>
    ({ get }) =>
      get(
        queryContractIndexerSelector({
          chainId,
          contractAddress,
          formula: 'daoCore/vetoerOf',
          required: true,
        })
      ),
})
