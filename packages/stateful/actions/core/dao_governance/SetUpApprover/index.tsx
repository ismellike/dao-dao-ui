import { useCallback, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useRecoilValue } from 'recoil'

import {
  DaoCoreV2Selectors,
  DaoPreProposeApprovalSingleSelectors,
  DaoProposalSingleCommonSelectors,
} from '@dao-dao/state/recoil'
import { PersonRaisingHandEmoji, useCachedLoading } from '@dao-dao/stateless'
import { ChainId, ContractVersion, ModuleInstantiateInfo } from '@dao-dao/types'
import {
  ActionComponent,
  ActionContextType,
  ActionKey,
  ActionMaker,
  UseDecodedCosmosMsg,
  UseDefaults,
  UseTransformToCosmos,
} from '@dao-dao/types/actions'
import { InstantiateMsg as DaoProposalSingleInstantiateMsg } from '@dao-dao/types/contracts/DaoProposalSingle.v2'
import {
  DaoProposalSingleAdapterId,
  encodeMessageAsBase64,
  makeWasmMessage,
  objectMatchesStructure,
  parseEncodedMessage,
} from '@dao-dao/utils'

import { EntityDisplay } from '../../../../components/EntityDisplay'
import { DaoProposalSingleAdapter } from '../../../../proposal-module-adapter/adapters/DaoProposalSingle'
import { useActionOptions } from '../../../react'
import {
  SetUpApproverData,
  SetUpApproverComponent as StatelessComponent,
} from './Component'

const useDefaults: UseDefaults<SetUpApproverData> = () => ({
  address: '',
})

const useDecodedCosmosMsg: UseDecodedCosmosMsg<SetUpApproverData> = (
  msg: Record<string, any>
) => {
  if (
    !objectMatchesStructure(msg, {
      wasm: {
        execute: {
          contract_addr: {},
          funds: {},
          msg: {
            update_proposal_modules: {
              to_add: {},
            },
          },
        },
      },
    }) ||
    msg.wasm.execute.msg.update_proposal_modules.to_add.length !== 1
  ) {
    return {
      match: false,
    }
  }

  const info = msg.wasm.execute.msg.update_proposal_modules.to_add[0]
  if (
    !objectMatchesStructure(info, {
      admin: {},
      code_id: {},
      label: {},
      msg: {},
    })
  ) {
    return {
      match: false,
    }
  }

  const parsedMsg = parseEncodedMessage(info.msg)
  if (
    !info.label.endsWith(`${DaoProposalSingleAdapterId}_approver`) ||
    !objectMatchesStructure(parsedMsg, {
      pre_propose_info: {
        module_may_propose: {
          info: {
            msg: {},
          },
        },
      },
    }) ||
    !parsedMsg.pre_propose_info.module_may_propose.info.label.includes(
      'approver'
    )
  ) {
    return {
      match: false,
    }
  }

  const parsedPreProposeMsg = parseEncodedMessage(
    parsedMsg.pre_propose_info.module_may_propose.info.msg
  )
  if (
    !objectMatchesStructure(parsedPreProposeMsg, {
      pre_propose_approval_contract: {},
    })
  ) {
    return {
      match: false,
    }
  }

  return {
    match: true,
    data: {
      address: parsedPreProposeMsg.pre_propose_approval_contract,
    },
  }
}

const Component: ActionComponent = (props) => {
  const {
    address,
    chain: { chain_id: chainId },
  } = useActionOptions()

  const { watch, setValue } = useFormContext<SetUpApproverData>()
  const preProposeApprovalSingle = watch(
    (props.fieldNamePrefix + 'address') as 'address'
  )
  // When creating, load DAO address from pre-propose module address.
  const dao = useCachedLoading(
    !props.isCreating && preProposeApprovalSingle
      ? DaoPreProposeApprovalSingleSelectors.daoSelector({
          chainId,
          contractAddress: preProposeApprovalSingle,
          params: [],
        })
      : undefined,
    undefined
  )
  useEffect(() => {
    if (!props.isCreating && !dao.loading && dao.data) {
      setValue((props.fieldNamePrefix + 'dao') as 'dao', dao.data)
    }
  }, [dao, props.fieldNamePrefix, props.isCreating, setValue])

  const options = useCachedLoading(
    DaoCoreV2Selectors.approvalDaosSelector({
      chainId,
      contractAddress: address,
    }),
    []
  )

  return (
    <StatelessComponent
      {...props}
      options={{
        options,
        EntityDisplay,
      }}
    />
  )
}

export const makeSetUpApproverAction: ActionMaker<SetUpApproverData> = ({
  t,
  address,
  context,
  chain: { chain_id: chainId },
  chainContext: {
    config: { codeIds },
  },
}) => {
  // Only show for v2 DAOs.
  if (
    context.type !== ActionContextType.Dao ||
    context.info.coreVersion === ContractVersion.V1
  ) {
    return null
  }

  const useTransformToCosmos: UseTransformToCosmos<SetUpApproverData> = () => {
    const singleChoiceProposal = context.info.proposalModules.find(
      ({ contractName }) =>
        DaoProposalSingleAdapter.contractNames.some((name) =>
          contractName.includes(name)
        )
    )
    if (!singleChoiceProposal) {
      throw new Error('No single choice proposal module found')
    }

    const config = useRecoilValue(
      DaoProposalSingleCommonSelectors.configSelector({
        contractAddress: singleChoiceProposal.address,
        chainId,
      })
    )

    return useCallback(
      ({ address: preProposeApprovalContract }) => {
        const info: ModuleInstantiateInfo = {
          admin: { core_module: {} },
          code_id: codeIds.DaoProposalSingle,
          label: `DAO_${context.info.name.trim()}_${DaoProposalSingleAdapterId}_approver`,
          msg: encodeMessageAsBase64({
            threshold: config.threshold,
            allow_revoting: config.allow_revoting,
            close_proposal_on_execution_failure: true,
            max_voting_period: config.max_voting_period,
            only_members_execute: config.only_members_execute,
            pre_propose_info: {
              module_may_propose: {
                info: {
                  admin: { core_module: {} },
                  code_id: codeIds.DaoPreProposeApprover,
                  label: `DAO_${context.info.name.trim()}_pre-propose${DaoProposalSingleAdapterId}_approver`,
                  msg: encodeMessageAsBase64({
                    pre_propose_approval_contract: preProposeApprovalContract,
                  }),
                  // TODO(neutron-2.3.0): add back in here and in instantiate schema.
                  ...(chainId !== ChainId.NeutronMainnet && {
                    funds: [],
                  }),
                },
              },
            },
          } as DaoProposalSingleInstantiateMsg),
          // TODO(neutron-2.3.0): add back in here and in instantiate schema.
          ...(chainId !== ChainId.NeutronMainnet && {
            funds: [],
          }),
        }

        return makeWasmMessage({
          wasm: {
            execute: {
              contract_addr: address,
              funds: [],
              msg: {
                update_proposal_modules: {
                  to_add: [info],
                  to_disable: [],
                },
              },
            },
          },
        })
      },
      [config]
    )
  }

  return {
    key: ActionKey.SetUpApprover,
    Icon: PersonRaisingHandEmoji,
    label: t('title.setUpApprover'),
    description: t('info.setUpApproverDescription'),
    Component,
    useDefaults,
    useTransformToCosmos,
    useDecodedCosmosMsg,
  }
}
