import { Chain } from '@chain-registry/types'
import { CSSProperties, ComponentType, ReactNode } from 'react'
import { FieldPath, FieldValues } from 'react-hook-form'
import { RecoilValueReadOnly } from 'recoil'

import { ActionCategoryMaker, CategorizedAction } from './actions'
import { Expiration } from './contracts'
import { CheckedDepositInfo } from './contracts/common'
import {
  DaoCreationGetInstantiateInfo,
  DaoCreationVotingConfigItem,
  PreProposeModule,
  ProposalDraft,
  ProposalModule,
} from './dao'
import { ContractVersion } from './features'
import { ProposalCreatedCardProps } from './proposal'
import {
  LinkWrapperProps,
  LoadingData,
  SelfRelayExecuteModalProps,
} from './stateless'

export type IProposalModuleAdapterCommon<FormData extends FieldValues = any> = {
  // Fields
  fields: {
    // Make this a function so it doesn't return the same instance of the form
    // data each time.
    makeDefaultNewProposalForm: () => FormData
    newProposalFormTitleKey: FieldPath<FormData>
    actionCategoryMakers: ActionCategoryMaker[]
  }

  // Selectors
  selectors: {
    reverseProposalInfos: ReverseProposalInfosSelector
    reversePreProposePendingProposalInfos?: ReversePreProposePendingProposalInfosSelector
    reversePreProposeCompletedProposalInfos?: ReversePreProposeCompletedProposalInfosSelector
    depositInfo: DepositInfoSelector
  }

  // Hooks
  hooks: {
    useProfileNewProposalCardInfoLines: () => ProfileNewProposalCardInfoLine[]
  }

  // Components
  components: {
    NewProposal: ComponentType<BaseNewProposalProps>
  }
}

export type IProposalModuleAdapter<Vote extends unknown = any> = {
  // Functions
  functions: {
    getProposalInfo: () => Promise<CommonProposalInfo | undefined>
  }

  // Hooks
  hooks: {
    useProposalRefreshers: () => ProposalRefreshers
    useLoadingProposalExecutionTxHash: () => LoadingData<string | undefined>
    useLoadingVoteOptions: () => LoadingData<ProposalVoteOption<Vote>[]>
    // Return when no wallet connected.
    useLoadingWalletVoteInfo: () =>
      | undefined
      | LoadingData<WalletVoteInfo<Vote>>
    useCastVote: (onSuccess?: () => void | Promise<void>) => {
      castVote: (vote: Vote) => Promise<void>
      castingVote: boolean
    }
    useLoadingPreProposeApprovalProposer: () => LoadingData<string | undefined>
  }

  // Components
  components: {
    ProposalStatusAndInfo: ComponentType<BaseProposalStatusAndInfoProps>
    ProposalInnerContentDisplay: ComponentType<BaseProposalInnerContentDisplayProps>
    PreProposeApprovalInnerContentDisplay: ComponentType<BasePreProposeApprovalInnerContentDisplayProps>
    ProposalWalletVote: ComponentType<BaseProposalWalletVoteProps<Vote>>
    ProposalVotes: ComponentType
    ProposalVoteTally: ComponentType
    PreProposeProposalLine?: ComponentType<BaseProposalLineProps>
    ProposalLine: ComponentType<BaseProposalLineProps>
  }
}

export type ProposalModuleAdapter<
  DaoCreationExtraVotingConfig extends FieldValues = any,
  Vote extends unknown = any,
  FormData extends FieldValues = any
> = {
  id: string
  contractNames: string[]

  loadCommon: (
    options: IProposalModuleAdapterCommonOptions
  ) => IProposalModuleAdapterCommon<FormData>

  load: (options: IProposalModuleAdapterOptions) => IProposalModuleAdapter<Vote>

  queries: {
    proposalCount: {
      indexerFormula?: string
      cosmWasmQuery: Record<string, unknown>
    }
  }

  functions: {
    fetchPrePropose?: FetchPreProposeFunction
  }

  daoCreation: {
    // Voting config added to the common voting config.
    extraVotingConfig?: {
      default: DaoCreationExtraVotingConfig
      items?: DaoCreationVotingConfigItem[]
      advancedItems?: DaoCreationVotingConfigItem[]
      advancedWarningI18nKeys?: string[]
    }

    getInstantiateInfo: DaoCreationGetInstantiateInfo<DaoCreationExtraVotingConfig>
  }
}

export type IProposalModuleAdapterCommonOptions = {
  chain: Chain
  coreAddress: string
  proposalModule: ProposalModule
}

export type IProposalModuleAdapterCommonInitialOptions = Omit<
  IProposalModuleAdapterCommonOptions,
  'proposalModule'
>

export type IProposalModuleAdapterOptions = {
  chain: Chain
  coreAddress: string
  proposalModule: ProposalModule
  proposalId: string
  proposalNumber: number
  // Whether or not this refers to a pre-propose proposal. If this is true, the
  // proposal ID should contain an asterisk (*) between the proposal module
  // prefix and proposal number.
  isPreProposeProposal: boolean
}

export type IProposalModuleAdapterInitialOptions = Omit<
  IProposalModuleAdapterOptions,
  'proposalModule' | 'proposalId' | 'proposalNumber' | 'isPreProposeProposal'
>

export type IProposalModuleContext = {
  id: string
  options: IProposalModuleAdapterOptions
  adapter: IProposalModuleAdapter
  common: IProposalModuleAdapterCommon
}

// Internal Adapter Types

export type FetchPreProposeFunction = (
  chainId: string,
  proposalModuleAddress: string,
  version: ContractVersion | null
) => Promise<PreProposeModule | null>

export type ReverseProposalInfosSelector = (data: {
  startBefore: number | undefined
  limit: number | undefined
}) => RecoilValueReadOnly<CommonProposalListInfo[]>

export type ReversePreProposePendingProposalInfosSelector = (data: {
  startBefore: number | undefined
  limit: number | undefined
}) => RecoilValueReadOnly<CommonProposalListInfo[]>

export type ReversePreProposeCompletedProposalInfosSelector = (data: {
  startBefore: number | undefined
  limit: number | undefined
}) => RecoilValueReadOnly<CommonProposalListInfo[]>

export type DepositInfoSelector = RecoilValueReadOnly<
  CheckedDepositInfo | undefined
>

export type CommonProposalListInfo = {
  id: string
  proposalNumber: number
  timestamp: Date | undefined
  isOpen: boolean
  // If true, will be not be shown in the proposal list. This is used for
  // example to hide completed pre-propose proposals that were approved, since
  // those show up as normal proposals. No need to double count.
  hideFromList?: boolean
}

export type CommonProposalInfo = {
  id: string
  title: string
  description: string
  expiration: Expiration
  createdAtEpoch: number | null
  createdByAddress: string
}

export type BaseProposalStatusAndInfoProps = {
  inline?: boolean
  // Open self-relay modal to execute a proposal and relay polytone IBC packets.
  openSelfRelayExecute: (
    props: Pick<
      SelfRelayExecuteModalProps,
      'uniqueId' | 'chainIds' | 'transaction'
    >
  ) => void
  onVoteSuccess: () => void | Promise<void>
  onExecuteSuccess: () => void | Promise<void>
  onCloseSuccess: () => void | Promise<void>
  // Whether or not the user has viewed all action pages. If they haven't, they
  // can't vote.
  seenAllActionPages: boolean
}

export type BaseProposalInnerContentDisplayProps<
  FormData extends FieldValues = any
> = {
  setDuplicateFormData: (data: FormData) => void
  actionsForMatching: CategorizedAction[]
  // Called when the user has viewed all action pages.
  setSeenAllActionPages?: () => void
}

export type BasePreProposeApprovalInnerContentDisplayProps = Omit<
  BaseProposalInnerContentDisplayProps,
  'setDuplicateFormData'
>

export type BaseProposalWalletVoteProps<T> = {
  vote: T | undefined
  fallback: 'pending' | 'hasNoVote'
}

export type BaseProposalLineProps = {
  href: string
  LinkWrapper: ComponentType<LinkWrapperProps>
}

export type BaseNewProposalProps<FormData extends FieldValues = any> = {
  onCreateSuccess: (props: ProposalCreatedCardProps) => void
  draft?: ProposalDraft<FormData>
  saveDraft: () => void
  drafts: ProposalDraft[]
  loadDraft?: (index: number) => void
  unloadDraft: () => void
  draftSaving: boolean
  deleteDraft: (index: number) => void
  proposalModuleSelector: ReactNode
  // If true, will display actions as read only. This is useful when prompting a
  // proposal to be created from preset actions. Default: false.
  actionsReadOnlyMode?: boolean
}

export type WalletVoteInfo<T> = {
  // Present if voted.
  vote: T | undefined
  couldVote: boolean
  canVote: boolean
  votingPowerPercent: number
}

export type ProposalRefreshers = {
  refreshProposal: () => void
  refreshProposalAndAll: () => void
  refreshing: boolean
}

export type ProposalVoteOption<Vote> = {
  Icon: ComponentType<{ className: string; style?: CSSProperties }>
  label: string
  value: Vote
  color?: string
}

export type ProfileNewProposalCardInfoLine = {
  Icon: ComponentType<{ className: string }>
  label: string
  value: string
  valueClassName?: string
}

export type PercentOrMajorityValue = {
  majority: boolean
  // Will be used when `majority` is false.
  value: number
}
