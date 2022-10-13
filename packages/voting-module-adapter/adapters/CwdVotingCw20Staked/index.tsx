import { Pie } from '@dao-dao/icons'
import { DurationUnits } from '@dao-dao/tstypes'

import { VotingModuleAdapter } from '../../types'
import {
  ClaimsPendingList,
  DaoInfoAdditionalAddresses,
  DaoInfoVotingConfiguration,
  DaoTreasuryFooter,
  Membership,
  MembershipMobileTab,
  ProfileCardNotMemberInfo,
  ProfileMemberCardMembershipInfo,
  SdaMembershipPage,
  StakingModal,
  VoteHeroStats,
} from './components'
import {
  DisplayInfoIcon,
  GovernanceConfigurationInput,
  GovernanceConfigurationReview,
  UnstakingDurationVotingConfigItem,
  getInstantiateInfo,
} from './daoCreation'
import {
  useActions,
  useDaoInfoBarItems,
  useGovernanceTokenInfo,
  useProfileNewProposalCardAddresses,
  useStakingInfo,
} from './hooks'
import { DaoCreationConfig, GovernanceTokenType } from './types'

export const CwdVotingCw20StakedAdapter: VotingModuleAdapter<DaoCreationConfig> =
  {
    id: 'CwdVotingCw20Staked',
    contractNames: [
      // V1
      'cw20-staked-balance-voting',
      // V2
      'cwd-voting-cw20-staked',
    ],

    load: ({ t }) => ({
      // Fields
      fields: {
        membershipPageInfo: {
          renderIcon: (mobile) => (
            <Pie height={mobile ? 16 : 14} width={mobile ? 16 : 14} />
          ),
          label: t('title.stake'),
        },
      },

      // Hooks
      hooks: {
        useActions,
        useDaoInfoBarItems,
        useProfileNewProposalCardAddresses,
        useGovernanceTokenInfo,
        useStakingInfo,
      },

      // Components
      components: {
        Membership: {
          Desktop: (props) => <Membership {...props} />,
          MobileTab: MembershipMobileTab,
          Mobile: (props) => <Membership {...props} primaryText />,
        },
        DaoTreasuryFooter,
        DaoInfoAdditionalAddresses,
        DaoInfoVotingConfiguration,
        VoteHeroStats,
        SdaMembershipPage,
        ProfileMemberCardMembershipInfo,
        ProfileCardNotMemberInfo,

        StakingModal,
        ClaimsPendingList,
      },
    }),

    daoCreation: {
      displayInfo: {
        Icon: DisplayInfoIcon,
        nameI18nKey: 'daoCreationAdapter.CwdVotingCw20Staked.name',
        descriptionI18nKey:
          'daoCreationAdapter.CwdVotingCw20Staked.description',
        suppliesI18nKey: 'daoCreationAdapter.CwdVotingCw20Staked.supplies',
        membershipI18nKey: 'daoCreationAdapter.CwdVotingCw20Staked.membership',
      },
      defaultConfig: {
        tiers: [
          {
            name: '',
            weight: 10,
            members: [
              {
                address: '',
              },
            ],
          },
        ],
        tokenType: GovernanceTokenType.New,
        newInfo: {
          initialSupply: 10000000,
          initialTreasuryPercent: 90,
          symbol: '',
          name: '',
        },
        existingGovernanceTokenAddress: '',
        unstakingDuration: {
          value: 2,
          units: DurationUnits.Weeks,
        },
      },
      governanceConfig: {
        Input: GovernanceConfigurationInput,
        Review: GovernanceConfigurationReview,
      },
      votingConfig: {
        items: [UnstakingDurationVotingConfigItem],
      },
      getInstantiateInfo,
    },
  }
