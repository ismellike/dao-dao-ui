import { ComponentMeta, ComponentStory } from '@storybook/react'

import { ProposalStatusEnum } from '@dao-dao/types'

import { LinkWrapper } from '../LinkWrapper'
import {
  DiscordNotifierConfigureModal,
  DiscordNotifierConfigureModalProps,
} from '../modals/DiscordNotifierConfigureModal'
import { Default as DiscordNotifierConfigureModalStory } from '../modals/DiscordNotifierConfigureModal.stories'
import { ProposalLine, ProposalLineProps } from './ProposalLine'
import { makeProps as makeProposalProps } from './ProposalLine.ProposalLine.stories'
import { ProposalList } from './ProposalList'

export default {
  title:
    'DAO DAO / packages / stateless / components / proposal / ProposalList',
  component: ProposalList,
} as ComponentMeta<typeof ProposalList>

const Template: ComponentStory<
  typeof ProposalList<ProposalLineProps & { proposalId: string }>
> = (args) => <ProposalList {...args} />

export const Default = Template.bind({})
Default.args = {
  // Generate between 1 and 3 proposals.
  openProposals: [...Array(Math.floor(Math.random() * 3) + 1)].map(
    (_, index) => ({ ...makeProposalProps(), proposalId: index.toString() })
  ),
  daosWithVetoableProposals: [],
  // Generate between 5 and 15 proposals.
  sections: [
    {
      title: 'History',
      proposals: [...Array(Math.floor(Math.random() * 11) + 5)].map(
        (_, index) => ({
          ...makeProposalProps(
            undefined,
            // Pick one at random.
            [ProposalStatusEnum.Passed, ProposalStatusEnum.Rejected][
              Math.floor(Math.random() * 2)
            ],
            // Pick one at random.
            ['Yes', 'No', 'Abstain'][Math.floor(Math.random() * 3)]
          ),
          proposalId: index.toString(),
        })
      ),
    },
  ],
  ProposalLine,
  LinkWrapper,
  createNewProposalHref: '#',
  canLoadMore: true,
  loadMore: () => alert('load more'),
  loadingMore: false,
  isMember: true,
  DiscordNotifierConfigureModal: () => (
    <DiscordNotifierConfigureModal
      {...(DiscordNotifierConfigureModalStory.args as DiscordNotifierConfigureModalProps)}
    />
  ),
}

export const None = Template.bind({})
None.args = {
  ...Default.args,
  openProposals: [],
  sections: [],
}

export const NoneNotMember = Template.bind({})
NoneNotMember.args = {
  ...None.args,
  isMember: false,
}

export const Loading = Template.bind({})
Loading.args = {
  ...Default.args,
  loadingMore: true,
}

export const LoadingNone = Template.bind({})
LoadingNone.args = {
  ...None.args,
  loadingMore: true,
}
