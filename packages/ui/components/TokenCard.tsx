import { PlusIcon } from '@heroicons/react/outline'
import { ExpandCircleDownOutlined } from '@mui/icons-material'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EdamameCrown } from '@dao-dao/icons'

import { Button } from './Button'
import { SpendEmoji, StakeEmoji } from './emoji'
import { IconButton } from './IconButton'
import { ButtonPopup, ButtonPopupSection } from './popup'
import { Tooltip } from './Tooltip'
import { UnstakingTask } from './UnstakingLine'
import { UnstakingModal } from './UnstakingModal'
import { UnstakingTaskStatus } from './UnstakingStatus'

export interface TokenStake {
  amount: number
  validator: string
  rewards: number
}

export interface TokenCardProps {
  crown?: boolean
  tokenSymbol: string
  subtitle?: string
  imageUrl: string
  totalBalance: number
  unstakedBalance: number
  unstakingTasks: UnstakingTask[]
  tokenDecimals: number
  usdcUnitPrice: number
  unstakingDuration: string
  stakes?: TokenStake[]
  onAddToken?: () => void
  onProposeStakeUnstake: () => void
  onProposeClaim: () => void
}

export const TokenCard = ({
  crown,
  tokenSymbol,
  subtitle,
  imageUrl,
  totalBalance,
  unstakedBalance,
  unstakingTasks,
  tokenDecimals,
  usdcUnitPrice,
  unstakingDuration,
  stakes,
  onAddToken,
  onProposeStakeUnstake,
  onProposeClaim,
}: TokenCardProps) => {
  const { t } = useTranslation()

  const totalStaked = useMemo(
    () => stakes?.reduce((acc, stake) => acc + stake.amount, 0) ?? 0,
    [stakes]
  )
  const pendingRewards = useMemo(
    () => stakes?.reduce((acc, stake) => acc + stake.rewards, 0) ?? 0,
    [stakes]
  )
  const unstakingBalance = useMemo(
    () =>
      unstakingTasks.reduce(
        (acc, task) =>
          acc +
          // Only include balance of unstaking tasks.
          (task.status === UnstakingTaskStatus.Unstaking ? task.amount : 0),
        0
      ) ?? 0,
    [unstakingTasks]
  )

  const [showUnstakingTokens, setShowUnstakingTokens] = useState(false)

  const buttonPopupSections: ButtonPopupSection[] = useMemo(
    () => [
      ...(onAddToken
        ? [
            {
              label: t('title.token'),
              buttons: [
                {
                  Icon: PlusIcon,
                  label: t('button.addToKeplr'),
                  onClick: onAddToken,
                },
              ],
            },
          ]
        : []),
      {
        label: t('title.newProposalTo'),
        buttons: [
          {
            Icon: StakeEmoji,
            label: t('button.stakeOrUnstake'),
            onClick: onProposeStakeUnstake,
          },
          {
            Icon: SpendEmoji,
            label: t('button.claim'),
            onClick: onProposeClaim,
          },
        ],
      },
    ],
    [onAddToken, onProposeClaim, onProposeStakeUnstake, t]
  )

  return (
    <>
      <div className="bg-background-tertiary rounded-lg">
        <div className="relative p-5">
          <div className="flex flex-row gap-4">
            <div className="relative">
              {/* Image */}
              <div
                className="w-10 h-10 bg-center rounded-full bg-fill"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                }}
              ></div>

              {/* Crown */}
              {!!crown && (
                <EdamameCrown
                  className="absolute -top-4 -left-6 text-secondary stroke-2"
                  height="32px"
                  width="32px"
                />
              )}
            </div>

            {/* Titles */}
            <div className="flex flex-col gap-1">
              <p className="title-text">${tokenSymbol}</p>
              <p className="caption-text">{subtitle}</p>
            </div>
          </div>

          <div className="absolute top-3 right-3">
            <ButtonPopup
              Trigger={({ open, ...props }) => (
                <IconButton
                  Icon={ExpandCircleDownOutlined}
                  className="!text-icon-secondary"
                  focused={open}
                  variant="ghost"
                  {...props}
                />
              )}
              popupClassName="w-[16rem]"
              position="left"
              sections={buttonPopupSections}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 py-4 px-6 border-t border-inactive">
          <div className="flex flex-row gap-8 justify-between items-start">
            <p className="link-text">{t('info.totalHoldings')}</p>
            {/* leading-5 to match link-text's line-height. */}
            <div className="flex flex-col gap-1 items-end font-mono text-right caption-text">
              <p className="leading-5 text-text-body">
                {totalBalance.toLocaleString(undefined, {
                  maximumFractionDigits: tokenDecimals,
                })}{' '}
                ${tokenSymbol}
              </p>
              <p>
                {t('format.token', {
                  val: totalBalance * usdcUnitPrice,
                  tokenSymbol: 'USDC',
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-row gap-8 justify-between items-start">
            <p className="link-text">{t('info.availableBalance')}</p>
            {/* leading-5 to match link-text's line-height. */}
            <div className="flex flex-col gap-1 items-end font-mono text-right caption-text">
              <p className="leading-5 text-text-body">
                {unstakedBalance.toLocaleString(undefined, {
                  maximumFractionDigits: tokenDecimals,
                })}{' '}
                ${tokenSymbol}
              </p>
              <p>
                {t('format.token', {
                  val: unstakedBalance * usdcUnitPrice,
                  tokenSymbol: 'USDC',
                })}
              </p>
            </div>
          </div>
        </div>

        {!!stakes?.length && (
          <div className="flex flex-col gap-2 px-6 pt-4 pb-6 border-t border-inactive">
            <p className="mb-1 link-text">{t('info.stakes')}</p>

            <div className="flex flex-row gap-8 justify-between items-center">
              <p className="secondary-text">{t('info.staked')}</p>

              <p className="font-mono text-right text-text-body caption-text">
                {totalStaked.toLocaleString(undefined, {
                  maximumFractionDigits: tokenDecimals,
                })}{' '}
                ${tokenSymbol}
              </p>
            </div>

            <div className="flex flex-row gap-8 justify-between items-center">
              <p className="secondary-text">{t('info.stakedTo')}</p>

              <p className="font-mono text-right text-text-body caption-text">
                {stakes[0].validator}
                {stakes.length > 1 && (
                  <>
                    ,{' '}
                    <Tooltip
                      title={
                        <>
                          {stakes.slice(1).map(({ validator }, index) => (
                            <p key={index}>{validator}</p>
                          ))}
                        </>
                      }
                    >
                      <span className="underline underline-offset-2 cursor-pointer">
                        {t('info.andNumMore', { count: stakes.length - 1 })}
                      </span>
                    </Tooltip>
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-row gap-8 justify-between items-center">
              <p className="secondary-text">{t('title.unstakingTokens')}</p>

              <Button
                className={clsx(
                  'font-mono text-right underline-offset-2 caption-text',
                  unstakingBalance > 0 && 'text-text-body'
                )}
                onClick={() => setShowUnstakingTokens(true)}
                variant="underline"
              >
                {unstakingBalance.toLocaleString(undefined, {
                  maximumFractionDigits: tokenDecimals,
                })}{' '}
                ${tokenSymbol}
              </Button>
            </div>

            <div className="flex flex-row gap-8 justify-between items-center">
              <p className="secondary-text">{t('info.pendingRewards')}</p>

              <p className="font-mono text-right text-text-body caption-text">
                {pendingRewards.toLocaleString(undefined, {
                  maximumFractionDigits: tokenDecimals,
                })}{' '}
                ${tokenSymbol}
              </p>
            </div>
          </div>
        )}
      </div>

      {showUnstakingTokens && (
        <UnstakingModal
          onClaim={onProposeClaim}
          onClose={() => setShowUnstakingTokens(false)}
          tasks={unstakingTasks}
          unstakingDuration={unstakingDuration}
        />
      )}
    </>
  )
}
