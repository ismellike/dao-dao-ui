import { FlagOutlined, Timelapse } from '@mui/icons-material'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useRecoilCallback, useRecoilValue } from 'recoil'

import { DaoCoreV2Selectors, blocksPerYearSelector } from '@dao-dao/state'
import {
  useCachedLoadable,
  useChain,
  useDaoInfoContext,
} from '@dao-dao/stateless'
import {
  BaseNewProposalProps,
  IProposalModuleAdapterCommonOptions,
} from '@dao-dao/types'
import {
  convertExpirationToDate,
  dateToWdhms,
  processError,
} from '@dao-dao/utils'

import { useLoadedActionsAndCategories } from '../../../../../../actions'
import { EntityDisplay } from '../../../../../../components/EntityDisplay'
import { SuspenseLoader } from '../../../../../../components/SuspenseLoader'
import { useMembership, useWallet } from '../../../../../../hooks'
import { proposalSelector } from '../../../contracts/DaoProposalMultiple.recoil'
import { makeGetProposalInfo } from '../../../functions'
import {
  NewProposalData,
  NewProposalForm,
  UsePublishProposal,
} from '../../../types'
import { useProcessQ } from '../../hooks'
import { NewProposal as StatelessNewProposal } from './NewProposal'

export type NewProposalProps = BaseNewProposalProps<NewProposalForm> & {
  options: IProposalModuleAdapterCommonOptions
  usePublishProposal: UsePublishProposal
}

export const NewProposal = ({
  onCreateSuccess,
  options,
  usePublishProposal,
  ...props
}: NewProposalProps) => {
  const { t } = useTranslation()
  const { chain_id: chainId } = useChain()
  const {
    name: daoName,
    imageUrl: daoImageUrl,
    coreAddress,
    isActive,
    activeThreshold,
  } = useDaoInfoContext()
  const { isWalletConnected, getStargateClient } = useWallet()

  const { loadedActions, categories } = useLoadedActionsAndCategories()

  const { isMember = false, loading: membershipLoading } = useMembership({
    coreAddress,
  })

  const [loading, setLoading] = useState(false)

  // Info about if the DAO is paused. This selector depends on blockHeight,
  // which is refreshed periodically, so use a loadable to avoid unnecessary
  // re-renders.
  const pauseInfo = useCachedLoadable(
    DaoCoreV2Selectors.pauseInfoSelector({
      chainId,
      contractAddress: coreAddress,
      params: [],
    })
  )
  const isPaused =
    pauseInfo.state === 'hasValue' &&
    ('paused' in pauseInfo.contents || 'Paused' in pauseInfo.contents)

  const processQ = useProcessQ()

  const blocksPerYear = useRecoilValue(
    blocksPerYearSelector({
      chainId,
    })
  )

  const {
    publishProposal,
    anyoneCanPropose,
    depositUnsatisfied,
    simulationBypassExpiration,
  } = usePublishProposal()

  const createProposal = useRecoilCallback(
    ({ snapshot }) =>
      async (newProposalData: NewProposalData) => {
        if (!isWalletConnected) {
          toast.error(t('error.logInToContinue'))
          return
        }

        setLoading(true)
        try {
          const { proposalNumber, proposalId } = await publishProposal(
            newProposalData,
            {
              // On failed simulation, allow the user to bypass the simulation
              // and create the proposal anyway for 3 seconds.
              failedSimulationBypassSeconds: 3,
            }
          )

          const proposalInfo = await makeGetProposalInfo({
            ...options,
            proposalNumber,
            proposalId,
            isPreProposeProposal: false,
          })()
          const expirationDate =
            proposalInfo &&
            convertExpirationToDate(
              blocksPerYear,
              proposalInfo.expiration,
              (await (await getStargateClient()).getBlock()).header.height
            )

          const proposal = (
            await snapshot.getPromise(
              proposalSelector({
                chainId,
                contractAddress: options.proposalModule.address,
                params: [
                  {
                    proposalId: proposalNumber,
                  },
                ],
              })
            )
          ).proposal

          const { quorum } = processQ(proposal.voting_strategy)

          onCreateSuccess(
            proposalInfo
              ? {
                  id: proposalId,
                  title: newProposalData.title,
                  description: newProposalData.description,
                  info: [
                    {
                      Icon: FlagOutlined,
                      label: `${t('title.quorum')}: ${quorum.display}`,
                    },
                    ...(expirationDate
                      ? [
                          {
                            Icon: Timelapse,
                            label: dateToWdhms(expirationDate),
                          },
                        ]
                      : []),
                  ],
                  dao: {
                    type: 'dao',
                    name: daoName,
                    coreAddressOrId: coreAddress,
                    imageUrl: daoImageUrl,
                  },
                }
              : {
                  id: proposalId,
                  title: newProposalData.title,
                  description: newProposalData.description,
                  info: [],
                  dao: {
                    type: 'dao',
                    name: daoName,
                    coreAddressOrId: coreAddress,
                    imageUrl: daoImageUrl,
                  },
                }
          )
          // Don't stop loading indicator on success since we are navigating.
        } catch (err) {
          console.error(err)
          toast.error(processError(err))
          setLoading(false)
        }
      },
    [
      isWalletConnected,
      t,
      publishProposal,
      options,
      blocksPerYear,
      getStargateClient,
      chainId,
      processQ,
      onCreateSuccess,
      daoName,
      coreAddress,
      daoImageUrl,
    ]
  )

  return (
    <StatelessNewProposal
      EntityDisplay={EntityDisplay}
      SuspenseLoader={SuspenseLoader}
      activeThreshold={activeThreshold}
      anyoneCanPropose={anyoneCanPropose}
      categories={categories}
      connected={isWalletConnected}
      createProposal={createProposal}
      depositUnsatisfied={depositUnsatisfied}
      isActive={isActive}
      isMember={
        membershipLoading
          ? { loading: true }
          : { loading: false, data: isMember }
      }
      isPaused={isPaused}
      loadedActions={loadedActions}
      loading={loading}
      simulationBypassExpiration={simulationBypassExpiration}
      {...props}
    />
  )
}
