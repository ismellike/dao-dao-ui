import { coins } from '@cosmjs/stargate'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { constSelector, useRecoilValue, useSetRecoilState } from 'recoil'

import {
  Cw20BaseSelectors,
  nativeDenomBalanceSelector,
  refreshWalletBalancesIdAtom,
} from '@dao-dao/state'
import { useCachedLoadable } from '@dao-dao/stateless'
import { ContractVersion } from '@dao-dao/types'
import {
  CHAIN_GAS_MULTIPLIER,
  ContractName,
  expirationExpired,
  findWasmAttributeValue,
  processError,
} from '@dao-dao/utils'

import {
  Cw20BaseHooks,
  useAwaitNextBlock,
  useMembership,
  useSimulateCosmosMsgs,
  useWallet,
} from '../../../../../hooks'
import { usePropose as useProposeV1 } from '../../contracts/CwProposalSingle.v1.hooks'
import { usePropose as useProposePrePropose } from '../../contracts/DaoPreProposeSingle.hooks'
import { usePropose as useProposeV2 } from '../../contracts/DaoProposalSingle.v2.hooks'
import {
  MakeUsePublishProposalOptions,
  NewProposalData,
  PublishProposal,
  UsePublishProposal,
} from '../../types'
import { anyoneCanProposeSelector } from '../selectors'

export const makeUsePublishProposal =
  ({
    options: {
      chain: { chain_id: chainId },
      coreAddress,
      proposalModule,
    },
    depositInfoSelector,
  }: MakeUsePublishProposalOptions): UsePublishProposal =>
  () => {
    const { t } = useTranslation()
    const {
      isWalletConnected,
      address: walletAddress,
      getStargateClient,
    } = useWallet()
    const { isMember = false } = useMembership({
      coreAddress,
    })

    const anyoneCanPropose = useRecoilValue(
      anyoneCanProposeSelector({
        chainId: chainId,
        preProposeAddress: proposalModule.prePropose?.address ?? null,
      })
    )

    const depositInfo = useRecoilValue(depositInfoSelector)
    const depositInfoCw20TokenAddress =
      depositInfo?.denom && 'cw20' in depositInfo.denom
        ? depositInfo.denom.cw20
        : undefined
    const depositInfoNativeTokenDenom =
      depositInfo?.denom && 'native' in depositInfo.denom
        ? depositInfo.denom.native
        : undefined

    const requiredProposalDeposit = Number(depositInfo?.amount ?? '0')

    // For checking allowance and increasing if necessary.
    const cw20DepositTokenAllowanceResponseLoadable = useCachedLoadable(
      depositInfoCw20TokenAddress && requiredProposalDeposit && walletAddress
        ? Cw20BaseSelectors.allowanceSelector({
            chainId,
            contractAddress: depositInfoCw20TokenAddress,
            params: [
              {
                owner: walletAddress,
                // If pre-propose address set, give that one deposit allowance
                // instead of proposal module.
                spender:
                  proposalModule.prePropose?.address || proposalModule.address,
              },
            ],
          })
        : constSelector(undefined)
    )
    const cw20DepositTokenAllowanceResponse =
      cw20DepositTokenAllowanceResponseLoadable.state === 'hasValue'
        ? cw20DepositTokenAllowanceResponseLoadable.contents
        : undefined

    const cw20DepositTokenBalanceLoadable = useCachedLoadable(
      requiredProposalDeposit && walletAddress && depositInfoCw20TokenAddress
        ? Cw20BaseSelectors.balanceSelector({
            chainId,
            contractAddress: depositInfoCw20TokenAddress,
            params: [{ address: walletAddress }],
          })
        : constSelector(undefined)
    )
    const cw20DepositTokenBalance =
      cw20DepositTokenBalanceLoadable.state === 'hasValue'
        ? cw20DepositTokenBalanceLoadable.contents
        : undefined

    const nativeDepositTokenBalanceLoadable = useCachedLoadable(
      requiredProposalDeposit && walletAddress && depositInfoNativeTokenDenom
        ? nativeDenomBalanceSelector({
            chainId,
            walletAddress,
            denom: depositInfoNativeTokenDenom,
          })
        : constSelector(undefined)
    )
    const nativeDepositTokenBalance =
      nativeDepositTokenBalanceLoadable.state === 'hasValue'
        ? nativeDepositTokenBalanceLoadable.contents
        : undefined

    // True if deposit is needed and cannot be paid.
    const depositUnsatisfied =
      // Requires deposit.
      requiredProposalDeposit > 0 &&
      // Has cw20 deposit and insufficient balance.
      ((!!depositInfoCw20TokenAddress &&
        (!cw20DepositTokenBalance ||
          Number(cw20DepositTokenBalance.balance) < requiredProposalDeposit)) ||
        // Has native deposit and insufficient balance.
        (!!depositInfoNativeTokenDenom &&
          (!nativeDepositTokenBalance ||
            Number(nativeDepositTokenBalance.amount) <
              requiredProposalDeposit)))

    const setRefreshWalletBalancesId = useSetRecoilState(
      refreshWalletBalancesIdAtom(walletAddress ?? '')
    )
    const refreshBalances = useCallback(
      () => setRefreshWalletBalancesId((id) => id + 1),
      [setRefreshWalletBalancesId]
    )

    const increaseCw20DepositAllowance = Cw20BaseHooks.useIncreaseAllowance({
      contractAddress: depositInfoCw20TokenAddress ?? '',
      sender: walletAddress ?? '',
    })
    const doProposeV1 = useProposeV1({
      contractAddress: proposalModule.address,
      sender: walletAddress ?? '',
    })
    const doProposeV2 = useProposeV2({
      contractAddress: proposalModule.address,
      sender: walletAddress ?? '',
    })
    const doProposePrePropose = useProposePrePropose({
      contractAddress: proposalModule.prePropose?.address ?? '',
      sender: walletAddress ?? '',
    })

    const awaitNextBlock = useAwaitNextBlock()
    const simulateMsgs = useSimulateCosmosMsgs(coreAddress)

    // If simulation fails and `failedSimulationBypassDuration` is defined,
    // allow bypassing for a period of time by setting this to a date in the
    // future.
    const [simulationBypassExpiration, setSimulationBypassExpiration] =
      useState<Date>()
    // Clear bypass expiration when it expires to trigger re-renders.
    useEffect(() => {
      if (simulationBypassExpiration) {
        const timeout = setTimeout(
          () => setSimulationBypassExpiration(undefined),
          simulationBypassExpiration.getTime() - Date.now()
        )
        return () => clearTimeout(timeout)
      }
    }, [simulationBypassExpiration])

    const publishProposal: PublishProposal = useCallback(
      async (
        { title, description, msgs },
        { failedSimulationBypassSeconds = 0 } = {}
      ) => {
        if (!isWalletConnected) {
          throw new Error(t('error.logInToContinue'))
        }
        if (!anyoneCanPropose && !isMember) {
          throw new Error(t('error.mustBeMemberToCreateProposal'))
        }
        if (depositUnsatisfied) {
          throw new Error(t('error.notEnoughForDeposit'))
        }

        // Only simulate messages if any exist. Allow proposals without
        // messages. Also allow bypassing simulation check for a period of time.
        if (
          msgs.length > 0 &&
          (!simulationBypassExpiration ||
            simulationBypassExpiration < new Date())
        ) {
          try {
            // Throws error if simulation fails, indicating invalid message.
            await simulateMsgs(msgs)
          } catch (err) {
            // If failed simulation bypass duration is set, allow bypassing
            // simulation check for a period of time.
            if (failedSimulationBypassSeconds > 0) {
              setSimulationBypassExpiration(
                new Date(Date.now() + failedSimulationBypassSeconds * 1000)
              )
            }

            console.error(err)
            throw new Error(
              `${t('error.simulationFailedInvalidProposalActions')} ${
                // Don't send to Sentry, but still format SDK errors nicely.
                processError(err, { forceCapture: false })
              }`
            )
          }
        }

        // Increase CW20 deposit token allowance if necessary.
        if (requiredProposalDeposit && depositInfoCw20TokenAddress) {
          // CW20 allowance response must be checked.
          if (!cw20DepositTokenAllowanceResponse) {
            throw new Error(t('error.loadingData'))
          }

          const remainingAllowanceNeeded =
            requiredProposalDeposit -
            // If allowance expired, none.
            (expirationExpired(
              cw20DepositTokenAllowanceResponse.expires,
              (await (await getStargateClient()).getBlock()).header.height
            )
              ? 0
              : Number(cw20DepositTokenAllowanceResponse.allowance))

          // Request to increase the contract's allowance for the proposal
          // deposit if needed.
          if (remainingAllowanceNeeded) {
            try {
              await increaseCw20DepositAllowance({
                amount: remainingAllowanceNeeded.toString(),
                spender:
                  // If pre-propose address set, give that one deposit allowance
                  // instead of proposal module.
                  proposalModule.prePropose?.address || proposalModule.address,
              })

              // Allowances will not update until the next block has been added.
              awaitNextBlock().then(refreshBalances)
            } catch (err) {
              throw new Error(
                `Failed to increase allowance to pay proposal deposit: ${processError(
                  err,
                  // Don't send to Sentry, but still format SDK errors nicely.
                  { forceCapture: false }
                )}`
              )
            }
          }
        }

        // Native token deposit if exists.
        const proposeFunds =
          requiredProposalDeposit && depositInfoNativeTokenDenom
            ? coins(
                BigInt(requiredProposalDeposit).toString(),
                depositInfoNativeTokenDenom
              )
            : undefined

        // Recreate form data with just the expected fields to remove any fields
        // added by other proposal module forms.
        const proposalData: NewProposalData = {
          title,
          description,
          msgs,
        }

        let response
        let isPreProposeApprovalProposal = false
        // V1 does not support pre-propose
        if (proposalModule.version === ContractVersion.V1) {
          response = await doProposeV1(
            proposalData,
            CHAIN_GAS_MULTIPLIER,
            undefined,
            proposeFunds
          )
          // Every other version supports pre-propose.
        } else {
          isPreProposeApprovalProposal =
            proposalModule.prePropose?.contractName ===
            ContractName.PreProposeApprovalSingle
          response = proposalModule.prePropose
            ? await doProposePrePropose(
                {
                  msg: {
                    propose: proposalData,
                  },
                },
                CHAIN_GAS_MULTIPLIER,
                undefined,
                proposeFunds
              )
            : await doProposeV2(
                proposalData,
                CHAIN_GAS_MULTIPLIER,
                undefined,
                proposeFunds
              )
        }

        if (proposeFunds?.length) {
          refreshBalances()
        }

        const proposalNumber = Number(
          (isPreProposeApprovalProposal && proposalModule.prePropose
            ? findWasmAttributeValue(
                response.logs,
                proposalModule.prePropose.address,
                'id'
              )
            : findWasmAttributeValue(
                response.logs,
                proposalModule.address,
                'proposal_id'
              )) ?? -1
        )
        if (proposalNumber === -1) {
          throw new Error(t('error.proposalIdNotFound'))
        }
        const proposalId = `${proposalModule.prefix}${
          isPreProposeApprovalProposal ? '*' : ''
        }${proposalNumber}`

        return {
          proposalNumber,
          proposalId,
          isPreProposeApprovalProposal,
        }
      },
      [
        isWalletConnected,
        anyoneCanPropose,
        isMember,
        depositUnsatisfied,
        simulationBypassExpiration,
        requiredProposalDeposit,
        depositInfoCw20TokenAddress,
        depositInfoNativeTokenDenom,
        t,
        simulateMsgs,
        cw20DepositTokenAllowanceResponse,
        getStargateClient,
        increaseCw20DepositAllowance,
        awaitNextBlock,
        refreshBalances,
        doProposeV1,
        doProposePrePropose,
        doProposeV2,
      ]
    )

    return {
      publishProposal,
      anyoneCanPropose,
      depositUnsatisfied,
      simulationBypassExpiration,
    }
  }
