import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import TimeAgo from 'react-timeago'

import { blockHeightSelector, blocksPerYearSelector } from '@dao-dao/state'
import {
  useCachedLoadable,
  useCachedLoading,
  useTranslatedTimeDeltaFormatter,
} from '@dao-dao/stateless'
import { LoadingData, ProposalStatusEnum } from '@dao-dao/types'
import { convertExpirationToDate, formatDate } from '@dao-dao/utils'

import { useProposalModuleAdapterOptions } from '../../../react'
import { proposalSelector } from '../contracts/DaoProposalMultiple.recoil'
import { ProposalWithMetadata } from '../types'

// Returns a proposal wrapped in a LoadingData object to allow the UI to respond
// to its loading state.
export const useLoadingProposal = (): LoadingData<ProposalWithMetadata> => {
  const { t } = useTranslation()
  const {
    proposalModule: { address: proposalModuleAddress },
    proposalNumber,
    chain: { chain_id: chainId },
  } = useProposalModuleAdapterOptions()

  const loadingProposalResponse = useCachedLoading(
    proposalSelector({
      contractAddress: proposalModuleAddress,
      chainId,
      params: [
        {
          proposalId: proposalNumber,
        },
      ],
    }),
    undefined,
    // If proposal undefined (due to a selector error), an error will be thrown.
    () => {
      throw new Error(t('error.loadingData'))
    }
  )

  const timeAgoFormatter = useTranslatedTimeDeltaFormatter({ words: false })

  const blocksPerYearLoadable = useCachedLoadable(
    blocksPerYearSelector({
      chainId,
    })
  )
  const blockHeightLoadable = useCachedLoadable(
    blockHeightSelector({
      chainId,
    })
  )
  // Since an error will be thrown on a selector error, this .data check is just
  // a typecheck. It will not return loading forever if the selector fails.
  if (
    loadingProposalResponse.loading ||
    !loadingProposalResponse.data ||
    blocksPerYearLoadable.state !== 'hasValue' ||
    blockHeightLoadable.state !== 'hasValue'
  ) {
    return { loading: true }
  }

  // Indexer may provide dates.
  const { proposal, completedAt, executedAt, closedAt } =
    loadingProposalResponse.data

  const expirationDate = convertExpirationToDate(
    blocksPerYearLoadable.contents,
    proposal.expiration,
    blockHeightLoadable.contents
  )

  // Votes can be cast up to the expiration date, even if the decision has
  // finalized due to sufficient votes cast.
  const votingOpen =
    // `expirationDate` will be undefined if expiration is set to never, which
    // the contract does not allow, so this is just a typecheck.
    expirationDate
      ? expirationDate.getTime() > Date.now()
      : proposal.status === ProposalStatusEnum.Open

  const completionDate =
    typeof completedAt === 'string' && new Date(completedAt)
  const executionDate = typeof executedAt === 'string' && new Date(executedAt)
  const closeDate = typeof closedAt === 'string' && new Date(closedAt)

  const dateDisplay: { label: string; content: ReactNode } | undefined =
    votingOpen
      ? expirationDate && expirationDate.getTime() > Date.now()
        ? {
            label: t('title.timeLeft'),
            content: (
              <TimeAgo date={expirationDate} formatter={timeAgoFormatter} />
            ),
          }
        : undefined
      : executionDate
      ? {
          label: t('proposalStatusTitle.executed'),
          content: formatDate(executionDate),
        }
      : closeDate
      ? {
          label: t('proposalStatusTitle.closed'),
          content: formatDate(closeDate),
        }
      : completionDate
      ? {
          label: t('info.completed'),
          content: formatDate(completionDate),
        }
      : expirationDate
      ? {
          label:
            // If voting is closed, expiration should not be in the future, but
            // just in case...
            expirationDate.getTime() > Date.now()
              ? t('title.expires')
              : t('info.completed'),
          content: formatDate(expirationDate),
        }
      : undefined
  const timestampInfo = expirationDate && {
    display: dateDisplay,
    expirationDate,
  }

  return {
    loading: false,
    updating:
      !loadingProposalResponse.loading && loadingProposalResponse.updating,
    data: {
      ...proposal,
      timestampInfo,
      votingOpen,
      executedAt:
        typeof executedAt === 'string' ? new Date(executedAt) : undefined,
    },
  }
}
