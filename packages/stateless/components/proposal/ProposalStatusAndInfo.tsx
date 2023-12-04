import { AnalyticsOutlined, Key, ThumbDown } from '@mui/icons-material'
import clsx from 'clsx'
import { ComponentType, Fragment, ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ProposalVoteOption } from '@dao-dao/types'

import { Button } from '../buttons'
import { InfoCard } from '../InfoCard'
import { WarningCard } from '../WarningCard'
import { ProposalVoteButton } from './ProposalVoteButton'

export interface ProposalStatusAndInfoProps<Vote extends unknown = unknown> {
  status?: string
  info: {
    Icon: ComponentType<{ className: string }>
    label: string
    Value: ComponentType<{ className: string }>
  }[]
  inline?: boolean
  action?: {
    header?: ReactNode
    label: string
    description?: string
    Icon: ComponentType<{ className: string }>
    loading: boolean
    doAction: () => void
  }
  // Present if can vote.
  vote?: {
    loading: boolean
    currentVote?: Vote
    onCastVote: (vote: Vote) => void | Promise<void>
    options: ProposalVoteOption<Vote>[]
    // Whether or not the proposal is still open. If not, and voting is still
    // allowed, explain that the user can vote up until expiration.
    proposalOpen: boolean
  }
  // Present if can veto.
  vetoOrEarlyExecute?: {
    loading: 'veto' | 'earlyExecute' | false
    onVeto: () => void | Promise<void>
    // If defined, the vetoer is allowed to execute instead of veto.
    onEarlyExecute?: () => void | Promise<void>
    // Whether or not the vetoer is a DAO and the current user is a member of
    // that vetoer DAO.
    isVetoerDaoMember: boolean
  }
  footer?: ReactNode
  // Whether or not the user has viewed all action pages. If they haven't, they
  // can't vote.
  seenAllActionPages?: boolean
  className?: string
}

export const ProposalStatusAndInfo = <Vote extends unknown = unknown>({
  status,
  info,
  inline = false,
  action,
  vote,
  vetoOrEarlyExecute,
  footer,
  // If undefined, assume the user has seen all action pages.
  seenAllActionPages = true,
  className,
}: ProposalStatusAndInfoProps<Vote>) => {
  const { t } = useTranslation()

  const [selectedVote, setSelectedVote] = useState<Vote | undefined>(
    vote?.currentVote
  )

  const currentVote = vote?.currentVote
    ? vote.options.find((option) => option.value === vote.currentVote)
    : undefined
  // If the wallet's current vote is the selected vote. This means revoting is
  // allowed, and the current vote selected is the same vote as before.
  const currentVoteSelected =
    !!currentVote && selectedVote === currentVote.value

  // Give actions a few seconds to render before showing unseen action pages
  // warning. Actions take a moment to load state, match, and group accordingly,
  // so the pages are not immediately available.
  const [showUnseenActionPagesWarning, setShowUnseenActionPagesWarning] =
    useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowUnseenActionPagesWarning(true)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div
      className={clsx(
        'flex flex-col items-stretch',
        inline &&
          'rounded-lg border border-border-secondary bg-background-tertiary',
        className
      )}
    >
      {!!status && (
        <div
          className={clsx(
            'flex flex-col gap-4 border-b border-border-secondary',
            inline ? 'p-6' : 'pb-10'
          )}
        >
          <div className="flex flex-row items-center gap-3">
            <AnalyticsOutlined className="h-6 w-6 text-icon-secondary" />
            <p className="secondary-text">{t('title.status')}</p>
          </div>

          <p className="body-text text-text-secondary">{status}</p>
        </div>
      )}

      <div
        className={clsx(
          'grid grid-cols-2 items-center gap-3',
          inline ? 'p-6' : action || footer ? 'pt-8 pb-6' : 'py-8'
        )}
      >
        {info.map(({ Icon, label, Value }, index) => (
          <Fragment key={index}>
            <div className="flex flex-row items-center gap-3">
              <Icon className="h-6 w-6 text-icon-secondary" />
              <p className="secondary-text">{label}</p>
            </div>

            <Value className="text-left !font-mono !text-base !font-medium !leading-5 !text-text-body" />
          </Fragment>
        ))}
      </div>

      {action && (
        <div
          className={clsx(
            'flex animate-fade-in flex-col gap-4',
            inline ? 'm-6 mt-0' : 'mb-8'
          )}
        >
          {action.header}

          <Button
            center
            loading={action.loading}
            onClick={action.doAction}
            size="lg"
            variant={
              // If voting is not displaying, or voting is displaying but they
              // already voted (i.e. they can revote), show primary variant to
              // draw attention to this action. Otherwise, show dimmer secondary
              // variant to encourage them to vote first.
              !vote || vote.currentVote ? 'primary' : 'secondary'
            }
          >
            <action.Icon className="!h-5 !w-5" /> {action.label}
          </Button>

          {action.description && <InfoCard content={action.description} />}
        </div>
      )}

      {vote && (
        <div
          className={clsx(
            'flex flex-col gap-4 border-t border-border-secondary',
            inline ? 'p-6' : footer ? 'pt-8 pb-6' : 'py-8'
          )}
        >
          {/* If has not seen all action pages, and has not yet cast a vote, show warning. */}
          {showUnseenActionPagesWarning &&
            !seenAllActionPages &&
            !vote.currentVote && (
              <WarningCard
                className="animate-fade-in"
                content={t('info.mustViewAllActionPagesBeforeVoting')}
              />
            )}

          {/* If proposal no longer open but voting is allowed, explain why. */}
          {!vote.proposalOpen && (
            <InfoCard content={t('info.voteUntilExpirationExplanation')} />
          )}

          <div className="flex flex-col gap-1">
            {vote.options.map((option, index) => (
              <ProposalVoteButton
                key={index}
                disabled={vote.loading}
                onClick={() => setSelectedVote(option.value)}
                option={option}
                pressed={option.value === selectedVote}
              />
            ))}
          </div>

          <Button
            center
            disabled={
              // Disable when...
              //
              // ...no vote selected,
              !selectedVote ||
              // ...selected vote is already the current vote (possible when
              // revoting is allowed),
              currentVoteSelected ||
              // ...or the user has not seen all action pages and has not yet
              // voted.
              (!seenAllActionPages && !vote.currentVote)
            }
            loading={vote.loading}
            onClick={() => selectedVote && vote.onCastVote(selectedVote)}
            size="lg"
            variant={
              // If already voted, show dimmer secondary variant. If needs to
              // vote, show primary to draw attention to it.
              vote.currentVote ? 'secondary' : 'primary'
            }
          >
            {vote.currentVote
              ? t('button.changeYourVote')
              : t('button.castYourVote')}
          </Button>
        </div>
      )}

      {vetoOrEarlyExecute && (
        <div
          className={clsx(
            'flex flex-col gap-4 border-t border-border-secondary',
            inline ? 'p-6' : footer ? 'pt-8 pb-6' : 'py-8'
          )}
        >
          {vetoOrEarlyExecute.isVetoerDaoMember && (
            <InfoCard
              content={t('info.vetoActionDaoMemberExplanation', {
                context: vetoOrEarlyExecute.onEarlyExecute
                  ? 'withEarlyExecute'
                  : 'withoutEarlyExecute',
              })}
            />
          )}

          <div className="flex flex-col gap-1">
            <ProposalVoteButton
              disabled={vetoOrEarlyExecute.loading === 'veto'}
              onClick={vetoOrEarlyExecute.onVeto}
              option={{
                Icon: ThumbDown,
                value: 'veto',
                label: t('button.veto'),
              }}
            />

            {vetoOrEarlyExecute.onEarlyExecute && (
              <ProposalVoteButton
                disabled={vetoOrEarlyExecute.loading === 'earlyExecute'}
                onClick={vetoOrEarlyExecute.onEarlyExecute}
                option={{
                  Icon: Key,
                  value: 'execute',
                  label: t('button.execute'),
                }}
              />
            )}
          </div>

          {vetoOrEarlyExecute.onEarlyExecute && (
            <InfoCard content={t('info.vetoEarlyExecuteExplanation')} />
          )}
        </div>
      )}

      {footer && (
        <div
          className={clsx(
            'animate-fade-in',
            inline && 'border-t border-border-secondary p-6'
          )}
        >
          {footer}
        </div>
      )}
    </div>
  )
}
