import { constSelector, useRecoilValue } from 'recoil'

import {
  DaoVotingTokenStakedSelectors,
  genericTokenSelector,
  isContractSelector,
  nativeDenomBalanceSelector,
  nativeSupplySelector,
  usdPriceSelector,
} from '@dao-dao/state'
import { useCachedLoading } from '@dao-dao/stateless'
import { TokenType } from '@dao-dao/types'
import { TokenInfoResponse } from '@dao-dao/types/contracts/Cw20Base'
import { ContractName } from '@dao-dao/utils'

import { useWallet } from '../../../../hooks/useWallet'
import { useVotingModuleAdapterOptions } from '../../../react/context'
import {
  UseGovernanceTokenInfoOptions,
  UseGovernanceTokenInfoResponse,
} from '../types'

export const useGovernanceTokenInfo = ({
  fetchWalletBalance = false,
  fetchTreasuryBalance = false,
  fetchUsdcPrice = false,
}: UseGovernanceTokenInfoOptions = {}): UseGovernanceTokenInfoResponse => {
  const { chainId, coreAddress, votingModuleAddress } =
    useVotingModuleAdapterOptions()
  const { address: walletAddress } = useWallet({
    chainId,
  })

  const { denom } = useRecoilValue(
    DaoVotingTokenStakedSelectors.denomSelector({
      chainId,
      contractAddress: votingModuleAddress,
      params: [],
    })
  )

  const token = useRecoilValue(
    genericTokenSelector({
      chainId,
      type: TokenType.Native,
      denomOrAddress: denom,
    })
  )
  const supply = useRecoilValue(
    nativeSupplySelector({
      chainId,
      denom,
    })
  )
  const governanceTokenInfo: TokenInfoResponse = {
    decimals: token.decimals,
    name: token.symbol,
    symbol: token.symbol,
    total_supply: supply.toString(),
  }

  // Token factory issuer
  const isFactory = denom.startsWith('factory/')
  const tfIssuer = useRecoilValue(
    isFactory
      ? DaoVotingTokenStakedSelectors.tokenContractSelector({
          contractAddress: votingModuleAddress,
          chainId,
          params: [],
        })
      : constSelector(undefined)
  )
  const isTfIssuer = useRecoilValue(
    tfIssuer
      ? isContractSelector({
          contractAddress: tfIssuer,
          chainId,
          name: ContractName.CwTokenfactoryIssuer,
        })
      : constSelector(false)
  )

  /// Optional

  // Wallet balance
  const loadingWalletBalance = useCachedLoading(
    fetchWalletBalance && walletAddress
      ? nativeDenomBalanceSelector({
          chainId,
          walletAddress,
          denom,
        })
      : constSelector(undefined),
    undefined
  )

  // Treasury balance
  const loadingTreasuryBalance = useCachedLoading(
    fetchTreasuryBalance
      ? nativeDenomBalanceSelector({
          chainId,
          walletAddress: coreAddress,
          denom,
        })
      : constSelector(undefined),
    undefined
  )

  // Price info
  const loadingPrice = useCachedLoading(
    fetchUsdcPrice && governanceTokenInfo
      ? usdPriceSelector({
          type: TokenType.Native,
          chainId,
          denomOrAddress: denom,
        })
      : constSelector(undefined),
    undefined
  )

  return {
    stakingContractAddress: '',
    governanceTokenAddress: denom,
    governanceTokenInfo,
    isFactory,
    tokenFactoryIssuerAddress: tfIssuer && isTfIssuer ? tfIssuer : undefined,
    token,
    /// Optional
    // Wallet balance
    loadingWalletBalance: loadingWalletBalance.loading
      ? { loading: true }
      : !loadingWalletBalance.data
      ? undefined
      : {
          loading: false,
          data: Number(loadingWalletBalance.data.amount),
        },
    // Treasury balance
    loadingTreasuryBalance: loadingTreasuryBalance.loading
      ? { loading: true }
      : !loadingTreasuryBalance.data
      ? undefined
      : {
          loading: false,
          data: Number(loadingTreasuryBalance.data.amount),
        },
    // Price
    loadingPrice: loadingPrice.loading
      ? { loading: true }
      : !loadingPrice.data
      ? undefined
      : {
          loading: false,
          data: loadingPrice.data,
        },
  }
}
