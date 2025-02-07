import {
  PreProposeApprovalProposalStatus,
  ProposalLineLoader,
  ProposalLine as StatelessProposalLine,
} from '@dao-dao/stateless'
import {
  ApprovalProposalContextType,
  BaseProposalLineProps,
  PreProposeApprovalProposalWithMeteadata,
} from '@dao-dao/types'
import { keyFromPreProposeStatus } from '@dao-dao/utils'

import { SuspenseLoader } from '../../../../components'
import { useProposalModuleAdapterOptions } from '../../../react'
import { useLoadingPreProposeApprovalProposal } from '../hooks'

export const PreProposeApprovalProposalLine = (
  props: BaseProposalLineProps
) => {
  const loadingProposal = useLoadingPreProposeApprovalProposal()

  return (
    <SuspenseLoader
      fallback={<ProposalLineLoader />}
      forceFallback={loadingProposal.loading}
    >
      {!loadingProposal.loading && (
        <InnerPreProposeApprovalProposalLine
          {...props}
          proposal={loadingProposal.data}
        />
      )}
    </SuspenseLoader>
  )
}

const InnerPreProposeApprovalProposalLine = ({
  proposal,
  ...props
}: BaseProposalLineProps & {
  proposal: PreProposeApprovalProposalWithMeteadata
}) => {
  const {
    proposalModule: { prefix: proposalPrefix },
    proposalNumber,
  } = useProposalModuleAdapterOptions()

  return (
    <StatelessProposalLine
      Status={({ dimmed }) => (
        <PreProposeApprovalProposalStatus
          dimmed={dimmed}
          status={proposal.status}
        />
      )}
      approvalContext={{
        type: ApprovalProposalContextType.Approval,
        status: keyFromPreProposeStatus(proposal.status),
      }}
      proposalNumber={proposalNumber}
      proposalPrefix={proposalPrefix + '*'}
      timestampDisplay={proposal.timestampDisplay}
      title={proposal.msg.title}
      vote={undefined}
      votingOpen={false}
      {...props}
    />
  )
}
