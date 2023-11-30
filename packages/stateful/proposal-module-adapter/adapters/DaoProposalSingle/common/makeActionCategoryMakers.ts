import {
  ActionCategoryKey,
  ActionCategoryMaker,
  IProposalModuleAdapterCommonOptions,
} from '@dao-dao/types'

import {
  makeUpdatePreProposeSingleConfigActionMaker,
  makeUpdateProposalConfigV1ActionMaker,
  makeUpdateProposalConfigV2ActionMaker,
} from './actions'

export const makeActionCategoryMakers = ({
  proposalModule,
}: IProposalModuleAdapterCommonOptions): ActionCategoryMaker[] => [
  () => ({
    // Add to DAO Governance category.
    key: ActionCategoryKey.DaoGovernance,
    actionMakers: [
      makeUpdateProposalConfigV1ActionMaker(proposalModule),
      makeUpdateProposalConfigV2ActionMaker(proposalModule),
      makeUpdatePreProposeSingleConfigActionMaker(proposalModule),
    ],
  }),
]
