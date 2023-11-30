import { ComponentType, ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { DaoTabId } from '@dao-dao/types'

import { PageHeaderContent, RightSidebarContent } from '../components'

export type ProposalProps = {
  id: string
  voteTally: ReactNode
  votesCast: ReactNode
  ProposalStatusAndInfo: ComponentType<{ inline?: boolean }>
  contentDisplay: ReactNode
  rightSidebarContent: ReactNode
}

export const Proposal = ({
  id,
  voteTally,
  votesCast,
  ProposalStatusAndInfo,
  contentDisplay,
  rightSidebarContent,
}: ProposalProps) => {
  const { t } = useTranslation()

  // Scroll to hash manually if available since this component and thus the
  // desired target anchor text won't be ready right when the page renders.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      // Ignore the '#' character at the beginning.
      const element = document.getElementById(window.location.hash.slice(1))
      if (!element) {
        return
      }

      // 24px offset so the element isn't touching the edge of the browser.
      const top = element.getBoundingClientRect().top + window.scrollY - 24
      window.scrollTo({
        top,
        behavior: 'smooth',
      })
    }
  }, [])

  return (
    <>
      <RightSidebarContent>{rightSidebarContent}</RightSidebarContent>
      <PageHeaderContent
        breadcrumbs={{
          homeTab: {
            id: DaoTabId.Proposals,
            sdaLabel: t('title.proposals'),
          },
          current: `${t('title.proposal')} ${id}`,
        }}
        className="mx-auto max-w-5xl"
      />

      {/* Undo container (in AppLayout) pt-10 on the top and pb-6 on the bottom so we can add those to our scrollable view instead. Also set height to full height of parent and some overflow to account for extended margins. */}
      <div className="relative mx-auto -mt-10 -mb-6 h-[calc(100%+4rem)] max-w-5xl">
        <div className="absolute top-10 left-0 z-[2] hidden w-[18rem] mdlg:block">
          <ProposalStatusAndInfo inline={false} />
        </div>

        {/* Make entire pane scrollable, even space around and under status and info card on the side. */}
        <div className="no-scrollbar absolute top-0 right-0 bottom-0 left-0 z-[1] h-full overflow-y-auto pt-10 pb-6 mdlg:pl-[21rem]">
          <div className="mb-9">{contentDisplay}</div>

          <div className="mdlg:hidden">
            <ProposalStatusAndInfo inline />
          </div>

          <div className="mt-3">{voteTally}</div>

          <div className="mt-10 mb-12">{votesCast}</div>
        </div>
      </div>
    </>
  )
}
