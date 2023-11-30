import {
  BreadcrumbCrumb,
  ContractVersion,
  DaoParentInfo,
  DaoWebSocketChannelInfo,
  PolytoneProxies,
  ProposalStatus,
  ProposalStatusKey,
} from '@dao-dao/types'
import { InstantiateMsg as DaoCoreV2InstantiateMsg } from '@dao-dao/types/contracts/DaoCore.v2'

import { getSupportedChainConfig } from './chain'
import { getGovPath } from './url'

export const getParentDaoBreadcrumbs = (
  getDaoPath: (coreAddress: string) => string,
  parentDao: DaoParentInfo | null | undefined
): BreadcrumbCrumb[] =>
  parentDao
    ? [
        ...getParentDaoBreadcrumbs(getDaoPath, parentDao.parentDao),
        {
          href: (parentDao.coreVersion === ContractVersion.Gov
            ? getGovPath
            : getDaoPath)(parentDao.coreAddress),
          label: parentDao.name,
        },
      ]
    : []

export const webSocketChannelNameForDao = ({
  chainId,
  coreAddress,
}: DaoWebSocketChannelInfo) => `${chainId}_${coreAddress}`

export const polytoneNoteProxyMapToChainIdMap = (
  // Source chain
  chainId: string,
  // Map of polytone note on source chain to remote polytone proxies.
  polytoneNoteProxyMap: Record<string, string>
): PolytoneProxies => {
  // Convert to chain ID to proxy map based on polytone connections.
  return Object.entries(
    getSupportedChainConfig(chainId)?.polytone || {}
  ).reduce((acc, [chainId, { note }]) => {
    const proxy = polytoneNoteProxyMap[note]

    return {
      ...acc,
      ...(proxy
        ? {
            [chainId]: proxy,
          }
        : {}),
    }
  }, {} as PolytoneProxies)
}

export const getFundsFromDaoInstantiateMsg = ({
  voting_module_instantiate_info,
  proposal_modules_instantiate_info,
}: DaoCoreV2InstantiateMsg) => [
  // TODO(neutron-2.3.0): remove once non-optional
  ...(voting_module_instantiate_info.funds || []),
  // TODO(neutron-2.3.0): remove once non-optional
  ...proposal_modules_instantiate_info.flatMap(({ funds }) => funds || []),
]

/**
 * Returns the flattened key of the proposal status.
 *
 * @param {ProposalStatus} status - The proposal status.
 * @return {ProposalStatusKey} The flattened key of the proposal status.
 */
export const getProposalStatusKey = (
  status: ProposalStatus
): ProposalStatusKey =>
  typeof status === 'string'
    ? status
    : typeof status === 'object' && status
    ? (Object.keys(status)[0] as any)
    : (() => {
        throw new Error('Invalid proposal status.')
      })()
