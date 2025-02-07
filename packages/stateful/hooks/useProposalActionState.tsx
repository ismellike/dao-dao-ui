import { ExecuteResult } from '@cosmjs/cosmwasm-stargate'
import { CancelOutlined, Key, Send } from '@mui/icons-material'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useRecoilValue } from 'recoil'

import { DaoProposalSingleCommonSelectors } from '@dao-dao/state'
import {
  ProposalCrossChainRelayStatus,
  ProposalStatusAndInfoProps,
  useConfiguredChainContext,
  useDaoInfoContext,
} from '@dao-dao/stateless'
import {
  LoadingData,
  ProposalStatusEnum,
  ProposalStatusKey,
} from '@dao-dao/types'
import { processError } from '@dao-dao/utils'

import { useProposalModuleAdapterOptions } from '../proposal-module-adapter'
import { useMembership } from './useMembership'
import { UseProposalPolytoneStateReturn } from './useProposalPolytoneState'
import { useWallet } from './useWallet'

export type UseProposalActionStateOptions = {
  polytoneState: UseProposalPolytoneStateReturn
  statusKey: ProposalStatusKey
  loadingExecutionTxHash: LoadingData<string | undefined>
  executeProposal: (options: { proposalId: number }) => Promise<ExecuteResult>
  closeProposal: (options: { proposalId: number }) => Promise<ExecuteResult>
  onExecuteSuccess: () => void | Promise<void>
  onCloseSuccess: () => void | Promise<void>
}

export type UseProposalActionStateReturn = Pick<
  ProposalStatusAndInfoProps,
  'action' | 'footer'
>

/**
 * This hook determines the action and footer to show on a proposal based on its
 * status. It is used in the proposal module adapters' ProposalStatusAndInfo
 * components.
 */
export const useProposalActionState = ({
  polytoneState,
  statusKey,
  loadingExecutionTxHash,
  executeProposal,
  closeProposal,
  onExecuteSuccess,
  onCloseSuccess,
}: UseProposalActionStateOptions): UseProposalActionStateReturn => {
  const { t } = useTranslation()
  const {
    chain: { chain_id: chainId },
  } = useConfiguredChainContext()
  const { coreAddress } = useDaoInfoContext()
  const { proposalModule, proposalNumber } = useProposalModuleAdapterOptions()
  const { isWalletConnected } = useWallet()
  const { isMember = false } = useMembership({
    coreAddress,
  })

  const config = useRecoilValue(
    DaoProposalSingleCommonSelectors.configSelector({
      chainId,
      contractAddress: proposalModule.address,
    })
  )

  const [actionLoading, setActionLoading] = useState(false)
  // On proposal status update, stop loading. This ensures the action button
  // doesn't stop loading too early, before the status has refreshed.
  useEffect(() => {
    setActionLoading(false)
  }, [statusKey])

  const onExecute = useCallback(async () => {
    if (!isWalletConnected) {
      return
    }

    setActionLoading(true)
    try {
      await executeProposal({
        proposalId: proposalNumber,
      })

      await onExecuteSuccess()
    } catch (err) {
      console.error(err)
      toast.error(processError(err))

      // Stop loading if errored.
      setActionLoading(false)
    }

    // Loading will stop on success when status refreshes.
  }, [isWalletConnected, executeProposal, proposalNumber, onExecuteSuccess])

  const onClose = useCallback(async () => {
    if (!isWalletConnected) {
      return
    }

    setActionLoading(true)

    try {
      await closeProposal({
        proposalId: proposalNumber,
      })

      await onCloseSuccess()
    } catch (err) {
      console.error(err)
      toast.error(processError(err))

      // Stop loading if errored.
      setActionLoading(false)
    }

    // Loading will stop on success when status refreshes.
  }, [isWalletConnected, closeProposal, proposalNumber, onCloseSuccess])

  return {
    action:
      statusKey === ProposalStatusEnum.Passed &&
      // Show if anyone can execute OR if the wallet is a member, once
      // polytone messages that need relaying are done loading.
      (!config.only_members_execute || isMember) &&
      !polytoneState.loading
        ? {
            label: t('button.execute'),
            Icon: Key,
            loading: actionLoading,
            doAction: polytoneState.data.needsSelfRelay
              ? polytoneState.data.openPolytoneRelay
              : onExecute,
          }
        : statusKey === ProposalStatusEnum.Rejected
        ? {
            label: t('button.close'),
            Icon: CancelOutlined,
            loading: actionLoading,
            doAction: onClose,
          }
        : // If executed and has polytone messages that need relaying...
        statusKey === ProposalStatusEnum.Executed &&
          !polytoneState.loading &&
          polytoneState.data.needsSelfRelay &&
          !loadingExecutionTxHash.loading &&
          loadingExecutionTxHash.data
        ? {
            label: t('button.relay'),
            Icon: Send,
            loading: actionLoading,
            doAction: polytoneState.data.openPolytoneRelay,
            description: t('error.polytoneExecutedNoRelay'),
          }
        : undefined,
    footer: !polytoneState.loading &&
      statusKey === ProposalStatusEnum.Executed &&
      polytoneState.data.hasPolytoneMessages && (
        <ProposalCrossChainRelayStatus state={polytoneState.data} />
      ),
  }
}
