import clsx from 'clsx'

import { ProposalVoteOption } from '@dao-dao/types'

import { Button } from '../buttons'

export interface ProposalVoteButtonProps<Vote extends unknown> {
  option: ProposalVoteOption<Vote>
  onClick?: () => void
  pressed?: boolean
  disabled?: boolean
  loading?: boolean
  className?: string
}

export const ProposalVoteButton = <Vote extends unknown>({
  option: { label, Icon, color },
  onClick,
  pressed = false,
  disabled = false,
  loading = false,
  className,
}: ProposalVoteButtonProps<Vote>) => (
  <Button
    className={clsx(
      'border-2 border-transparent',
      {
        'border-border-primary': pressed,
      },
      className
    )}
    contentContainerClassName={clsx('justify-between text-sm', {
      'primary-text': !pressed,
    })}
    disabled={disabled}
    loading={loading}
    onClick={onClick}
    pressed={pressed}
    size="lg"
    variant="secondary"
  >
    <p className="text-left">{label}</p>
    <Icon className="!h-6 !w-6" style={{ color }} />
  </Button>
)
