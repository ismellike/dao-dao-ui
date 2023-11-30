import { PolytoneConnection } from './chain'
import { CosmosMsgFor_Empty } from './contracts'
import { ProposalStatusKey as PreProposeApprovalProposalStatus } from './contracts/DaoPreProposeApprovalSingle'
import { ProposalCardProps } from './stateless/ProposalCard'

export type ProposalCreatedCardProps = Omit<
  ProposalCardProps,
  'className' | 'onMouseOver' | 'onMouseLeave' | 'LinkWrapper'
>

export type ProposalPolytoneState = {
  // Whether or not there are any polytone messages.
  hasPolytoneMessages: boolean
  // Whether or not there are polytone messages that have not been relayed.
  anyUnrelayed: boolean
  // Whether or not there are polytone messages that need to be self-relayed.
  // Most chains have relayers set up, so no need to self-relay on those chains.
  // After a few minutes if there are still messages that need to be relayed,
  // they can be self-relayed. This will be true when unrelayed messages exist
  // on a chain with no relayers or when there are still unrelayed messages
  // after a few minutes.
  needsSelfRelay: boolean
  // Opens the execute and self-relay modal.
  openPolytoneRelay: () => void
}

export type DecodedPolytoneMsgMatch = {
  match: true
  chainId: string
  polytoneConnection: PolytoneConnection
  // The first message, or empty object if none.
  msg: Record<string, any>
  // The first message, or undefined if none.
  cosmosMsg: CosmosMsgFor_Empty | undefined
  // All messages.
  msgs: Record<string, any>[]
  cosmosMsgs: CosmosMsgFor_Empty[]
  initiatorMsg: string
}

export type DecodedPolytoneMsgNoMatch = {
  match: false
}

export type DecodedPolytoneMsg =
  | DecodedPolytoneMsgNoMatch
  | DecodedPolytoneMsgMatch

export enum ProcessedTQType {
  Majority,
  Absolute,
  Percent,
}

export type ProcessedTQ = { display: string } & (
  | { type: ProcessedTQType.Majority }
  | { type: ProcessedTQType.Absolute | ProcessedTQType.Percent; value: number }
)

export type ProcessedThresholdQuorum = {
  threshold: ProcessedTQ
  quorum?: ProcessedTQ
}

export type ProcessedQuorum = {
  quorum: ProcessedTQ
}

export enum ApprovalProposalContextType {
  Approval = 'approval',
  Approver = 'approver',
}

export type ApprovalProposalContext =
  | {
      type: ApprovalProposalContextType.Approval
      status: PreProposeApprovalProposalStatus
    }
  | {
      type: ApprovalProposalContextType.Approver
    }
