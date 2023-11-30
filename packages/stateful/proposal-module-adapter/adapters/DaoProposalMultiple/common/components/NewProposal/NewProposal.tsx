import {
  Add,
  Block,
  Circle,
  Close,
  GavelRounded,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'
import clsx from 'clsx'
import Fuse from 'fuse.js'
import { ComponentType, useCallback, useState } from 'react'
import {
  SubmitErrorHandler,
  SubmitHandler,
  useFieldArray,
  useFormContext,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import TimeAgo from 'react-timeago'

import {
  Button,
  FilterableItem,
  FilterableItemPopup,
  IconButton,
  InputErrorMessage,
  ProposalContentDisplay,
  TextAreaInput,
  TextInput,
  Tooltip,
} from '@dao-dao/stateless'
import {
  ActionCategoryWithLabel,
  ActiveThreshold,
  BaseNewProposalProps,
  LoadedActions,
  LoadingData,
  StatefulEntityDisplayProps,
  SuspenseLoaderProps,
} from '@dao-dao/types'
import { MultipleChoiceOptionType } from '@dao-dao/types/contracts/DaoProposalMultiple'
import {
  MAX_NUM_PROPOSAL_CHOICES,
  convertActionsToMessages,
  formatDateTime,
  formatPercentOf100,
  formatTime,
  processError,
  validateRequired,
} from '@dao-dao/utils'

import { useEntity, useWallet, useWalletInfo } from '../../../../../../hooks'
import {
  MULTIPLE_CHOICE_OPTION_COLORS,
  MultipleChoiceOptionEditor,
} from '../../../components/MultipleChoiceOptionEditor'
import { MultipleChoiceOptionViewer } from '../../../components/MultipleChoiceOptionViewer'
import { NewProposalData, NewProposalForm } from '../../../types'

enum ProposeSubmitValue {
  Preview = 'Preview',
  Submit = 'Submit',
}

export interface NewProposalProps
  extends Pick<
    BaseNewProposalProps<NewProposalForm>,
    | 'draft'
    | 'saveDraft'
    | 'drafts'
    | 'loadDraft'
    | 'unloadDraft'
    | 'draftSaving'
    | 'deleteDraft'
    | 'proposalModuleSelector'
  > {
  createProposal: (newProposalData: NewProposalData) => Promise<void>
  loading: boolean
  isPaused: boolean
  isActive: boolean
  activeThreshold: ActiveThreshold | null
  isMember: LoadingData<boolean>
  anyoneCanPropose: boolean
  depositUnsatisfied: boolean
  connected: boolean
  categories: ActionCategoryWithLabel[]
  loadedActions: LoadedActions
  simulationBypassExpiration?: Date
  SuspenseLoader: ComponentType<SuspenseLoaderProps>
  EntityDisplay: ComponentType<StatefulEntityDisplayProps>
}

export const NewProposal = ({
  createProposal,
  loading,
  isPaused,
  isActive,
  activeThreshold,
  isMember,
  anyoneCanPropose,
  depositUnsatisfied,
  connected,
  categories,
  loadedActions,
  draft,
  saveDraft,
  drafts,
  loadDraft,
  unloadDraft,
  draftSaving,
  deleteDraft,
  simulationBypassExpiration,
  proposalModuleSelector,
  SuspenseLoader,
  EntityDisplay,
}: NewProposalProps) => {
  const { t } = useTranslation()

  // Unpack here because we use these at the top level as well as inside of
  // nested components.
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useFormContext<NewProposalForm>()

  const [showPreview, setShowPreview] = useState(false)
  const [showSubmitErrorNote, setShowSubmitErrorNote] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const { isWalletConnecting } = useWallet()
  const { walletAddress = '' } = useWalletInfo()
  const entity = useEntity(walletAddress)

  const proposalDescription = watch('description')
  const proposalTitle = watch('title')

  const {
    fields: multipleChoiceFields,
    append: addOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: 'choices',
    shouldUnregister: true,
  })
  const choices = watch('choices') ?? []

  const onSubmitForm: SubmitHandler<NewProposalForm> = useCallback(
    ({ ...proposalFormData }, event) => {
      setShowSubmitErrorNote(false)
      setSubmitError('')

      const nativeEvent = event?.nativeEvent as SubmitEvent
      const submitterValue = (nativeEvent?.submitter as HTMLInputElement)?.value

      // Preview toggled in onClick handler.
      if (submitterValue === ProposeSubmitValue.Preview) {
        return
      }

      let options
      try {
        options = proposalFormData.choices.map((option) => ({
          title: option.title,
          description: option.description,
          msgs: convertActionsToMessages(loadedActions, option.actionData),
        }))
      } catch (err) {
        console.error(err)
        setSubmitError(
          processError(err, {
            forceCapture: false,
          })
        )
        return
      }

      createProposal({
        title: proposalFormData.title,
        description: proposalFormData.description,
        choices: { options },
      })
    },
    [createProposal, loadedActions]
  )

  const onSubmitError: SubmitErrorHandler<NewProposalForm> = useCallback(() => {
    setShowSubmitErrorNote(true)
    setSubmitError('')
  }, [setShowSubmitErrorNote])

  const proposalName = watch('title')

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmitForm, onSubmitError)}
    >
      <div className="rounded-lg bg-background-tertiary">
        <div className="flex flex-row items-center justify-between gap-6 border-b border-border-secondary py-4 px-6">
          <p className="primary-text text-text-body">
            {t('form.proposalsName')}
          </p>

          <div className="flex grow flex-col">
            <TextInput
              error={errors.title}
              fieldName="title"
              placeholder={t('form.proposalsNamePlaceholder')}
              register={register}
              validation={[validateRequired]}
            />
            <InputErrorMessage error={errors.title} />
          </div>
        </div>
        <div className="flex flex-col gap-4 p-6 pt-5">
          <p className="primary-text text-text-body">
            {t('form.description')}
            <span className="text-text-tertiary">
              {/* eslint-disable-next-line i18next/no-literal-string */}
              {' – '}
              {t('info.supportsMarkdownFormat')}
            </span>
          </p>

          <div className="flex flex-col">
            <TextAreaInput
              error={errors.description}
              fieldName="description"
              placeholder={t('form.proposalsDescriptionPlaceholder')}
              register={register}
              rows={5}
              validation={[validateRequired]}
            />
            <InputErrorMessage error={errors.description} />
          </div>
        </div>
      </div>

      {proposalModuleSelector}

      {choices.length > 0 && (
        <div className="flex flex-col items-stretch gap-6">
          {multipleChoiceFields.map(({ id }, index) => (
            <MultipleChoiceOptionEditor
              key={id}
              SuspenseLoader={SuspenseLoader}
              addOption={addOption}
              categories={categories}
              control={control}
              descriptionFieldName={`choices.${index}.description`}
              errorsOption={errors?.choices?.[index]}
              loadedActions={loadedActions}
              optionIndex={index}
              registerOption={register}
              removeOption={() => removeOption(index)}
              titleFieldName={`choices.${index}.title`}
            />
          ))}
        </div>
      )}

      <div>
        <div
          className="flex cursor-pointer flex-row items-center gap-2 border-t border-border-secondary py-10"
          onClick={() =>
            addOption({
              title: '',
              description: '',
              actionData: [],
            })
          }
        >
          <Add className="!h-6 !w-6 text-icon-primary" />

          <Circle
            className="!h-4 !w-4"
            style={{
              color:
                MULTIPLE_CHOICE_OPTION_COLORS[
                  choices.length % MULTIPLE_CHOICE_OPTION_COLORS.length
                ],
            }}
          />

          <p className="title-text">{t('button.addNewOption')}</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-border-secondary pt-10 pb-4">
          <div className="flex flex-row items-center gap-2">
            <div className="h-6 w-6"></div>

            <Block className="!h-4 !w-4 text-icon-primary" />

            <p className="title-text">{t('title.noneOfTheAbove')}</p>
          </div>

          <p className="caption-text ml-14">
            {t('info.cannotRemoveNoneOption')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-y border-border-secondary py-6">
        <div className="flex flex-row items-center justify-between gap-6">
          <p className="title-text text-text-body">
            {t('info.reviewYourProposal')}
          </p>

          <div className="flex flex-row items-center justify-end gap-2">
            <Button
              disabled={loading}
              onClick={() => setShowPreview((p) => !p)}
              type="submit"
              value={ProposeSubmitValue.Preview}
              variant="secondary"
            >
              {showPreview ? (
                <>
                  {t('button.hidePreview')}
                  <VisibilityOff className="!h-5 !w-5" />
                </>
              ) : (
                <>
                  {t('button.preview')}
                  <Visibility className="!h-5 !w-5" />
                </>
              )}
            </Button>

            <Tooltip
              title={
                !connected
                  ? t('error.logInToContinue')
                  : depositUnsatisfied
                  ? t('error.notEnoughForDeposit')
                  : isPaused
                  ? t('error.daoIsPaused')
                  : !isActive && activeThreshold
                  ? t('error.daoIsInactive', {
                      context:
                        'percentage' in activeThreshold
                          ? 'percent'
                          : 'absolute',
                      percent:
                        'percentage' in activeThreshold
                          ? formatPercentOf100(
                              Number(activeThreshold.percentage.percent) * 100
                            )
                          : undefined,
                      count:
                        'percentage' in activeThreshold
                          ? undefined
                          : Number(activeThreshold.absolute_count.count),
                    })
                  : choices.length < 2
                  ? t('error.tooFewChoices')
                  : choices.length > MAX_NUM_PROPOSAL_CHOICES
                  ? t('error.tooManyChoices', {
                      count: MAX_NUM_PROPOSAL_CHOICES,
                    })
                  : undefined
              }
            >
              <Button
                disabled={
                  !connected ||
                  (!anyoneCanPropose && !isMember.loading && !isMember.data) ||
                  depositUnsatisfied ||
                  isPaused ||
                  !isActive ||
                  choices.length < 2 ||
                  choices.length > MAX_NUM_PROPOSAL_CHOICES
                }
                loading={loading}
                type="submit"
                value={ProposeSubmitValue.Submit}
              >
                <p>
                  {simulationBypassExpiration ? (
                    // If bypassing simulation, change button label and show a
                    // countdown until simulation bypass expires.
                    <TimeAgo
                      date={simulationBypassExpiration}
                      formatter={(value, _, suffix) =>
                        suffix === 'from now'
                          ? t('button.publishAnywayWithCountdown', {
                              secondsRemaining: value,
                            })
                          : // In case the countdown expires before the re-render,
                            // just show the original button label.
                            t('button.publish')
                      }
                    />
                  ) : (
                    t('button.publish')
                  )}
                </p>
                <GavelRounded className="!h-4 !w-4" />
              </Button>
            </Tooltip>
          </div>
        </div>

        {!anyoneCanPropose &&
          !isMember.loading &&
          !isMember.data &&
          !isWalletConnecting && (
            <p className="secondary-text max-w-prose self-end text-right text-text-interactive-error">
              {t('error.mustBeMemberToCreateProposal')}
            </p>
          )}

        {simulationBypassExpiration && (
          <p className="secondary-text max-w-prose self-end text-right text-text-interactive-warning-body">
            {t('info.bypassSimulationExplanation')}
          </p>
        )}

        {showSubmitErrorNote && (
          <p className="secondary-text text-right text-text-interactive-error">
            {t('error.correctErrorsAbove')}
          </p>
        )}

        {!!submitError && (
          <p className="secondary-text self-end text-right text-text-interactive-error">
            {submitError}
          </p>
        )}

        {showPreview && (
          <div className="mt-4 rounded-md border border-border-secondary p-6">
            <ProposalContentDisplay
              EntityDisplay={EntityDisplay}
              approval={false}
              createdAt={new Date()}
              creator={{
                address: walletAddress,
                entity,
              }}
              description={proposalDescription}
              innerContentDisplay={
                <div>
                  <p className="title-text mb-2">{t('title.voteOptions')}</p>

                  {choices.map(({ title, description, actionData }, index) => (
                    <MultipleChoiceOptionViewer
                      key={index}
                      SuspenseLoader={SuspenseLoader}
                      data={{
                        choice: {
                          description,
                          index,
                          msgs: [],
                          title,
                          option_type: MultipleChoiceOptionType.Standard,
                          vote_count: '0',
                        },
                        actionData: [],
                        decodedMessages: convertActionsToMessages(
                          loadedActions,
                          actionData || [],
                          {
                            throwErrors: false,
                          }
                        ),
                        voteOption: {
                          Icon: Circle,
                          label: title,
                          value: { option_id: index },
                          color:
                            MULTIPLE_CHOICE_OPTION_COLORS[
                              index % MULTIPLE_CHOICE_OPTION_COLORS.length
                            ],
                        },
                      }}
                      forceRaw
                      lastOption={false}
                    />
                  ))}

                  {/* None of the above */}
                  <MultipleChoiceOptionViewer
                    SuspenseLoader={SuspenseLoader}
                    data={{
                      choice: {
                        description: '',
                        index: choices.length,
                        msgs: [],
                        title: '',
                        option_type: MultipleChoiceOptionType.None,
                        vote_count: '0',
                      },
                      actionData: [],
                      decodedMessages: [],
                      voteOption: {
                        Icon: Block,
                        label: '',
                        value: { option_id: choices.length },
                      },
                    }}
                    forceRaw
                    lastOption
                  />
                </div>
              }
              title={proposalTitle}
            />
          </div>
        )}
      </div>

      <div className="flex flex-row items-center justify-end gap-2">
        {draft ? (
          <>
            <p
              className={clsx(
                'caption-text italic',
                draftSaving && 'animate-pulse'
              )}
            >
              {draftSaving
                ? t('info.draftSaving')
                : t('info.draftSavedAtTime', {
                    time: formatTime(new Date(draft.lastUpdatedAt)),
                  })}
            </p>

            <Tooltip
              title={draftSaving ? undefined : t('info.draftStillSaved')}
            >
              <Button
                className="caption-text -ml-1"
                disabled={draftSaving}
                onClick={unloadDraft}
                variant="underline"
              >
                {t('button.resetQuestion')}
              </Button>
            </Tooltip>
          </>
        ) : (
          <>
            {drafts.length > 0 && !!loadDraft && (
              <FilterableItemPopup
                filterableItemKeys={FILTERABLE_KEYS}
                items={drafts.map(
                  ({ name, createdAt, lastUpdatedAt }, index) => ({
                    key: createdAt,
                    label: name,
                    description: (
                      <>
                        {t('title.created')}:{' '}
                        {formatDateTime(new Date(createdAt))}
                        <br />
                        {t('title.lastUpdated')}:{' '}
                        {formatDateTime(new Date(lastUpdatedAt))}
                      </>
                    ),
                    rightNode: (
                      <Tooltip title={t('button.deleteDraft')}>
                        <IconButton
                          Icon={Close}
                          onClick={(event) => {
                            // Don't click on item button.
                            event.stopPropagation()
                            deleteDraft(index)
                          }}
                          variant="ghost"
                        />
                      </Tooltip>
                    ),
                  })
                )}
                onSelect={(_, index) => loadDraft(index)}
                searchPlaceholder={t('info.searchDraftPlaceholder')}
                trigger={{
                  type: 'button',
                  props: {
                    variant: 'secondary',
                    children: t('button.loadDraft'),
                  },
                }}
              />
            )}

            <Tooltip
              title={
                proposalName ? undefined : t('info.enterNameBeforeSavingDraft')
              }
            >
              <Button
                disabled={!proposalName}
                onClick={saveDraft}
                variant="secondary"
              >
                {t('button.saveDraft')}
              </Button>
            </Tooltip>
          </>
        )}
      </div>
    </form>
  )
}

const FILTERABLE_KEYS: Fuse.FuseOptionKey<FilterableItem>[] = ['label']
