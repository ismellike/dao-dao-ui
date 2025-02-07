import { AssetList } from '@chain-registry/types'
import { State, WalletModalProps, convertChain } from '@cosmos-kit/core'
import { useManager } from '@cosmos-kit/react-lite'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useRecoilValue } from 'recoil'

import { walletChainIdAtom } from '@dao-dao/state'
import { Modal, WarningCard } from '@dao-dao/stateless'
import {
  getConfiguredChains,
  maybeGetAssetListForChainId,
  maybeGetChainForChainId,
  processError,
} from '@dao-dao/utils'

import { WalletUiConnected } from './WalletUiConnected'
import { WalletUiConnectQr } from './WalletUiConnectQr'
import { WalletUiWalletList } from './WalletUiWalletList'

export const WalletUi = (props: WalletModalProps) => {
  const { t } = useTranslation()

  const [qrState, setQRState] = useState<State>(State.Init)
  const [qrErrorMessage, setQRErrorMessage] = useState<string>()

  // Chain of main wallet connection.
  const { getWalletRepo } = useManager()
  const mainWalletChainId = useRecoilValue(walletChainIdAtom)

  const { isOpen, setOpen, walletRepo } = props
  if (!walletRepo) {
    return <></>
  }

  // Get main wallet repo.
  const mainWalletRepo = getWalletRepo(
    maybeGetChainForChainId(mainWalletChainId)?.chain_name ||
      walletRepo.chainName
  )

  const { current } = walletRepo
  const {
    isWalletConnecting = false,
    isWalletConnected = false,
    isWalletError = false,
    message: errorMessage,
  } = current || {}

  // Set QR URL update actions so this component refreshes when QR state
  // changes.
  if (
    current?.client &&
    'qrUrl' in current.client &&
    'setActions' in current.client
  ) {
    ;(current.client as any).setActions?.({
      qrUrl: {
        state: setQRState,
        message: setQRErrorMessage,
      },
    })
  }

  const showWalletConnectQr = isWalletConnecting && qrState === State.Done
  const title = isWalletConnecting
    ? showWalletConnectQr
      ? t('title.scanQrCode')
      : current?.walletName.startsWith('web3auth_')
      ? t('title.loggingInToService', { service: current.walletPrettyName })
      : t('title.connectingToWallet', { wallet: current?.walletPrettyName })
    : isWalletConnected
    ? t('title.loggedIn')
    : t('title.logInWith')

  return (
    <Modal
      backdropClassName="z-[41]"
      containerClassName="!w-[24rem] !max-w-[90dvw]"
      footerContent={
        isWalletError && errorMessage ? (
          <WarningCard
            content={
              errorMessage === "key doesn't exist"
                ? t('info.configureWalletModalExplanation')
                : processError(errorMessage, { forceCapture: false })
            }
          />
        ) : qrState === State.Error && qrErrorMessage ? (
          <WarningCard content={qrErrorMessage} />
        ) : undefined
      }
      header={{
        title,
      }}
      onClose={() => {
        // If not connected, disconnect, to interrupt active connection.
        if (!isWalletConnected && walletRepo && walletRepo.current) {
          walletRepo.disconnect(undefined, true)
        }

        // Close modal if not showing QR. If showing QR, the disconnect above
        // will go back to the wallet list.
        if (!showWalletConnectQr) {
          setOpen(false)
        }
      }}
      visible={isOpen}
    >
      {showWalletConnectQr ? (
        <WalletUiConnectQr walletRepo={walletRepo} />
      ) : isWalletConnected ? (
        <WalletUiConnected walletRepo={walletRepo} />
      ) : (
        <WalletUiWalletList
          connect={async (wallet) => {
            // Reset QR State before next connection.
            setQRState(State.Init)
            setQRErrorMessage(undefined)

            // Connect to wallet.
            try {
              // Ensure supported chains are added before connecting.
              const configuredChains = getConfiguredChains().map(({ chain }) =>
                convertChain(
                  chain,
                  [maybeGetAssetListForChainId(chain.chain_id)].filter(
                    (al): al is AssetList => !!al
                  )
                )
              )

              await Promise.allSettled(
                configuredChains.map(
                  async (chainRecord) =>
                    await wallet?.mainWallet?.client
                      ?.addChain?.(chainRecord)
                      .catch(console.error)
                )
              )

              await Promise.all([
                // If main wallet repo not connected or is the same chain,
                // connect it too.
                ...(mainWalletRepo.isWalletConnected ||
                mainWalletChainId === wallet.chainId
                  ? []
                  : [mainWalletRepo.connect(wallet.walletName)]),
                // Connect selected wallet for chain.
                wallet.connect(),
              ])
            } catch (err) {
              console.error(err)
              toast.error(err instanceof Error ? err.message : `${err}`)
            }
          }}
          walletRepo={walletRepo}
        />
      )}
    </Modal>
  )
}
