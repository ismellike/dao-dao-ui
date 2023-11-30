import { DaoCreationCommonVotingConfigItems } from '@dao-dao/types'

import { makeAllowRevotingVotingConfigItem } from './AllowRevotingVotingConfigItem'
import { makeApproverVotingConfigItem } from './ApproverVotingConfigItem'
import { makeMultipleChoiceVotingConfigItem } from './MultipleChoiceVotingConfigItem'
import { makeProposalDepositVotingConfigItem } from './ProposalDepositVotingConfigItem'
import { makeProposalSubmissionPolicyVotingConfigItem } from './ProposalSubmissionPolicyVotingConfigItem'
import { makeQuorumVotingConfigItem } from './QuorumVotingConfigItem'
import { makeVotingDurationVotingConfigItem } from './VotingDurationVotingConfigItem'

export const loadCommonVotingConfigItems =
  (): DaoCreationCommonVotingConfigItems => ({
    items: [
      makeVotingDurationVotingConfigItem(),
      makeProposalDepositVotingConfigItem(),
    ],
    advancedItems: [
      makeQuorumVotingConfigItem(),
      makeMultipleChoiceVotingConfigItem(),
      makeAllowRevotingVotingConfigItem(),
      makeProposalSubmissionPolicyVotingConfigItem(),
      makeApproverVotingConfigItem(),
    ],
  })
