import { PeopleAltOutlined } from '@mui/icons-material'

import {
  ActionCategoryKey,
  DaoTabId,
  VotingModuleAdapter,
} from '@dao-dao/types'
import {
  DAO_VOTING_CW20_STAKED_CONTRACT_NAMES,
  DaoVotingCw20StakedAdapterId,
} from '@dao-dao/utils'

import { makeMintAction } from './actions'
import { MembersTab, ProfileCardMemberInfo, StakingModal } from './components'
import {
  useCommonGovernanceTokenInfo,
  useDaoInfoBarItems,
  useProfileNewProposalCardAddresses,
} from './hooks'

export const DaoVotingCw20StakedAdapter: VotingModuleAdapter = {
  id: DaoVotingCw20StakedAdapterId,
  contractNames: DAO_VOTING_CW20_STAKED_CONTRACT_NAMES,

  load: () => ({
    // Hooks
    hooks: {
      useDaoInfoBarItems,
      useProfileNewProposalCardAddresses,
      useCommonGovernanceTokenInfo,
    },

    // Components
    components: {
      ProfileCardMemberInfo,
      StakingModal,

      extraTabs: [
        {
          id: DaoTabId.Members,
          labelI18nKey: 'title.members',
          Component: MembersTab,
          Icon: PeopleAltOutlined,
        },
      ],
    },

    // Functions
    fields: {
      actionCategoryMakers: [
        () => ({
          // Add to DAO Governance category.
          key: ActionCategoryKey.DaoGovernance,
          actionMakers: [makeMintAction],
        }),
      ],
    },
  }),
}
