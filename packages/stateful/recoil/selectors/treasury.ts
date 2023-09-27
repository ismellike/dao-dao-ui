import { noWait, selectorFamily, waitForAll, waitForNone } from 'recoil'

import {
  DaoCoreV2Selectors,
  OsmosisHistoricalPriceChartPrecision,
  allDaoBalancesSelector,
  historicalNativeBalancesByDenomSelector,
  historicalNativeBalancesSelector,
  historicalUsdPriceSelector,
  nativeBalancesSelector,
  nativeDelegatedBalanceSelector,
  osmosisPrecisionToMinutes,
  usdPriceSelector,
} from '@dao-dao/state'
import {
  DaoAccount,
  LoadingTokens,
  TokenCardInfo,
  TokenType,
  WithChainId,
} from '@dao-dao/types'
import {
  convertMicroDenomToDenomWithDecimals,
  deserializeTokenSource,
  getNativeTokenForChainId,
  serializeTokenSource,
} from '@dao-dao/utils'

// lazyInfo must be loaded in the component separately, since it refreshes on a
// timer and we don't want this whole selector to reevaluate and load when that
// refreshes. Use `tokenCardLazyInfoSelector`.
export const treasuryTokenCardInfosForDaoSelector = selectorFamily<
  // Map chain ID to DAO-owned tokens on that chain.
  LoadingTokens,
  WithChainId<{
    coreAddress: string
    cw20GovernanceTokenAddress?: string
    nativeGovernanceTokenDenom?: string
  }>
>({
  key: 'treasuryTokenCardInfosForDao',
  get:
    ({
      chainId: nativeChainId,
      coreAddress,
      cw20GovernanceTokenAddress,
      nativeGovernanceTokenDenom,
    }) =>
    ({ get }) => {
      const allAccounts = get(
        DaoCoreV2Selectors.allAccountsSelector({
          chainId: nativeChainId,
          contractAddress: coreAddress,
        })
      )

      const uniqueChainIds = [
        ...new Set(allAccounts.map((account) => account.chainId)),
      ]

      return uniqueChainIds.reduce((acc, chainId) => {
        const accounts = allAccounts.filter(
          (account) => account.chainId === chainId
        )

        const nativeBalancesLoadables = get(
          waitForNone(
            accounts.map(({ address }) =>
              nativeBalancesSelector({
                chainId,
                address,
              })
            )
          )
        )
        const nativeBalances = nativeBalancesLoadables.flatMap(
          (loadable, index) =>
            loadable.state === 'hasValue'
              ? {
                  account: accounts[index],
                  balances: loadable.contents,
                }
              : []
        )

        const cw20sLoadable =
          // Only load cw20s on native chain.
          chainId === nativeChainId
            ? get(
                waitForNone([
                  DaoCoreV2Selectors.allCw20TokensWithBalancesSelector({
                    contractAddress: coreAddress,
                    chainId,
                    governanceTokenAddress: cw20GovernanceTokenAddress,
                  }),
                ])
              )
            : []
        const cw20s = cw20sLoadable.flatMap((loadable) =>
          loadable.state === 'hasValue'
            ? {
                account: {
                  type: 'native',
                  chainId,
                  address: coreAddress,
                } as DaoAccount,
                balances: loadable.contents,
              }
            : []
        )

        // Collect loadables so we can check loading status below.
        const loadables = [...nativeBalancesLoadables, ...cw20sLoadable]
        // Updating if any loadables are still loading. If none are loading but
        // a native token is still waiting for staking info, this is updated
        // below.
        let updating = loadables.some(
          (loadable) => loadable.state === 'loading'
        )

        // Get token card infos for loaded tokens.
        const infos: TokenCardInfo[] = [
          ...nativeBalances.flatMap(
            ({ account: { address, type }, balances }) =>
              balances.flatMap(({ token, balance }): TokenCardInfo | [] => {
                const unstakedBalance = convertMicroDenomToDenomWithDecimals(
                  balance,
                  token.decimals
                )

                let hasStakingInfo = false
                // Staking info only exists for native token.
                if (
                  token.denomOrAddress ===
                  getNativeTokenForChainId(chainId).denomOrAddress
                ) {
                  // Check if anything staked.
                  const stakedBalance = get(
                    noWait(
                      nativeDelegatedBalanceSelector({
                        chainId,
                        address,
                      })
                    )
                  )

                  // Ignore this token until staking info loads.
                  if (stakedBalance.state === 'loading') {
                    // Make sure updating is true if waiting on staking info.
                    updating = true

                    return []
                  }

                  hasStakingInfo =
                    stakedBalance.state === 'hasValue' &&
                    stakedBalance.contents.amount !== '0'
                }

                return {
                  owner: address,
                  daoOwnerType: type,
                  token,
                  // True if native token DAO and using this denom.
                  isGovernanceToken:
                    nativeGovernanceTokenDenom === token.denomOrAddress,
                  unstakedBalance,
                  hasStakingInfo,

                  lazyInfo: { loading: true },
                }
              })
          ),
          ...cw20s.flatMap(({ account: { address, type }, balances }) =>
            balances.map(
              ({ token, balance, isGovernanceToken }): TokenCardInfo => {
                const unstakedBalance = convertMicroDenomToDenomWithDecimals(
                  balance,
                  token.decimals
                )

                return {
                  owner: address,
                  daoOwnerType: type,
                  token,
                  isGovernanceToken: isGovernanceToken ?? false,
                  unstakedBalance,
                  // No staking info for CW20.
                  hasStakingInfo: false,

                  lazyInfo: { loading: true },
                }
              }
            )
          ),
        ]

        return {
          ...acc,
          [chainId]:
            accounts.length > 0 &&
            loadables.every((loadable) => loadable.state === 'loading')
              ? {
                  loading: true,
                  errored: false,
                }
              : {
                  loading: false,
                  errored: false,
                  updating,
                  data: infos,
                },
        }
      }, {} as LoadingTokens)
    },
})

export const daoTreasuryValueHistorySelector = selectorFamily<
  {
    timestamps: Date[]
    tokens: {
      symbol: string
      // Value at each timestamp.
      values: (number | null)[]
      // Current value.
      currentValue: number
    }[]
    total: {
      // Total value at each timestamp.
      values: (number | null)[]
      // Current total.
      currentValue: number
    }
  },
  WithChainId<{
    coreAddress: string
    precision: OsmosisHistoricalPriceChartPrecision
    startSecondsAgo: number
    // Filter by any of the account properties.
    filter?: Partial<DaoAccount>
  }>
>({
  key: 'daoTreasuryValueHistory',
  get:
    ({
      chainId: nativeChainId,
      coreAddress,
      precision,
      startSecondsAgo,
      filter,
    }) =>
    ({ get }) => {
      let allAccounts = get(
        DaoCoreV2Selectors.allAccountsSelector({
          chainId: nativeChainId,
          contractAddress: coreAddress,
        })
      )

      // Filter accounts.
      if (filter) {
        allAccounts = allAccounts.filter((account) =>
          Object.entries(filter).every(([key, value]) => {
            return account[key as keyof DaoAccount] === value
          })
        )
      }

      const startTimeUnixMs = -startSecondsAgo * 1000
      // minutes to milliseconds
      const intervalMs = osmosisPrecisionToMinutes[precision] * 60 * 1000

      // Historical balances.
      const historicalBalancesByTimestamp = get(
        waitForAll(
          allAccounts.map(({ chainId, address }) =>
            historicalNativeBalancesSelector({
              chainId,
              address,
              startTimeUnixMs,
              intervalMs,
            })
          )
        )
      ).flat()
      // Get all unique timestamps.
      let timestamps = [
        ...new Set(
          historicalBalancesByTimestamp.flatMap(({ timestamp }) =>
            timestamp.getTime()
          )
        ),
      ]
        .map((timestamp) => new Date(timestamp))
        .sort()
        // Remove last timestamp since we replace it with current balance.
        .slice(0, -1)

      const historicalBalancesByToken = get(
        waitForAll(
          allAccounts.map(({ chainId, address }) =>
            historicalNativeBalancesByDenomSelector({
              chainId,
              address,
              startTimeUnixMs,
              intervalMs,
            })
          )
        )
      ).flat()

      // Current native balances.
      const currentBalances = Object.values(
        get(
          allDaoBalancesSelector({
            chainId: nativeChainId,
            coreAddress,
          })
        )
      )
        .flat()
        .filter(({ token }) => token.type === TokenType.Native)

      const tokens = [
        ...historicalBalancesByToken.map(({ token }) => token),
        ...currentBalances.map(({ token }) => token),
      ]
        // Can only compute price if token decimals loaded correctly.
        .filter(({ decimals }) => decimals > 0)

      // Unique token sources.
      const uniqueTokenSources = [
        ...new Set(tokens.map(({ source }) => serializeTokenSource(source))),
      ]
      const tokenSources = uniqueTokenSources.map(deserializeTokenSource)

      // Get historical token prices for unique tokens.
      const allHistoricalUsdPrices = get(
        waitForAll(
          tokenSources.map(({ chainId, denomOrAddress: denom }) =>
            historicalUsdPriceSelector({
              chainId,
              denom,
              precision,
            })
          )
        )
      )
      // Get current token prices for unique tokens.
      const allCurrentUsdPrices = get(
        waitForAll(
          tokenSources.map(({ chainId, denomOrAddress }) =>
            usdPriceSelector({
              chainId,
              type: TokenType.Native,
              denomOrAddress,
            })
          )
        )
      )

      // Group tokens by unique ID and add balances at same timestamps.
      const tokensWithValues = uniqueTokenSources.reduce(
        (acc, source, index) => {
          const { symbol, decimals } =
            tokens.find(
              (token) =>
                serializeTokenSource(token.source) === source &&
                token.symbol &&
                token.decimals
            ) ?? {}
          const historicalUsdPrices = allHistoricalUsdPrices[index]
          const currentUsdPrice = allCurrentUsdPrices[index]
          // If no symbol, decimals, nor prices, skip.
          if (
            !symbol ||
            !decimals ||
            !historicalUsdPrices ||
            !currentUsdPrice
          ) {
            return acc
          }

          // Flattened list of historical balances across all accounts.
          // Timestamps will likely be duplicated.
          const historical = historicalBalancesByToken
            .filter(
              ({ token }) => serializeTokenSource(token.source) === source
            )
            .flatMap(({ balances }) => balances)

          // Sum up historical balances per timestamp.
          const values = timestamps.map((timestamp) => {
            const balances = historical.filter(
              ({ timestamp: balanceTimestamp }) =>
                balanceTimestamp.getTime() === timestamp.getTime()
            )

            // Sum up the balances for this timestamp, unless they are all
            // undefined, in which case return null. This is to indicate that
            // the indexer has no data on this timestamp from any account and
            // thus should not show up in the graph. If any have a balance,
            // show it.
            const totalBalance = balances.reduce(
              (acc, { balance }) =>
                acc === null && !balance
                  ? null
                  : (acc || 0n) + BigInt(balance || 0),
              null as bigint | null
            )

            // Find the first price after this timestamp.
            let firstPriceAfterIndex = historicalUsdPrices.findIndex(
              (historical) => historical.timestamp > timestamp
            )
            // If all prices are before this timestamp, use the last one if it's
            // within the last day.
            if (firstPriceAfterIndex === -1) {
              const lastPrice =
                historicalUsdPrices[historicalUsdPrices.length - 1]
              if (
                timestamp.getTime() - lastPrice.timestamp.getTime() <
                24 * 60 * 60 * 1000
              ) {
                firstPriceAfterIndex = historicalUsdPrices.length - 1
              }
            }
            // If all prices are after this timestamp, use the second one if
            // it's within the next day so we check the first two.
            if (firstPriceAfterIndex === 0) {
              const firstPrice = historicalUsdPrices[0]
              if (
                firstPrice.timestamp.getTime() - timestamp.getTime() <
                24 * 60 * 60 * 1000
              ) {
                firstPriceAfterIndex = 1
              }
            }
            // If price is not found or is still the first one, no value for
            // this timestamp.
            if (firstPriceAfterIndex <= 0) {
              return null
            }

            // Get the closest price for this timestamp by choosing the closer
            // price of the two surrounding it.
            const priceBefore = historicalUsdPrices[firstPriceAfterIndex - 1]
            const priceAfter = historicalUsdPrices[firstPriceAfterIndex]
            const usdPrice = (
              Math.abs(priceBefore.timestamp.getTime() - timestamp.getTime()) <
              Math.abs(priceAfter.timestamp.getTime() - timestamp.getTime())
                ? priceBefore
                : priceAfter
            ).amount

            return totalBalance === null
              ? null
              : usdPrice *
                  convertMicroDenomToDenomWithDecimals(
                    totalBalance.toString(),
                    decimals
                  )
          })

          // Sum up current balances.
          const currentBalance = currentBalances
            .filter(
              ({ token }) => serializeTokenSource(token.source) === source
            )
            .reduce((acc, { balance }) => acc + BigInt(balance), 0n)
          const currentValue =
            currentUsdPrice.amount *
            convertMicroDenomToDenomWithDecimals(
              currentBalance.toString(),
              decimals
            )

          return [
            ...acc,
            {
              symbol,
              values,
              currentValue,
            },
          ]
        },
        [] as {
          symbol: string
          // Value at each timestamp.
          values: (number | null)[]
          // Current value.
          currentValue: number
        }[]
      )

      // Sum up the values at each timestamp, unless they're all null, in which
      // case return null to indicate there is no data at this timestamp.
      let totalValues = timestamps.map((_, index) =>
        tokensWithValues.reduce(
          (acc, { values }) =>
            acc === null && values[index] === null
              ? null
              : (acc || 0) + (values[index] || 0),
          null as number | null
        )
      )

      // Sum up the current value of each token.
      const totalCurrentValue = tokensWithValues.reduce(
        (acc, { currentValue }) => acc + currentValue,
        0
      )

      // Remove timestamps at the front that have no data for any token.
      let firstNonNullTimestamp = totalValues.findIndex(
        (value) => value !== null
      )
      // If no non-null timestamps, remove all.
      if (firstNonNullTimestamp === -1) {
        firstNonNullTimestamp = totalValues.length
      }
      if (firstNonNullTimestamp > 0) {
        timestamps = timestamps.slice(firstNonNullTimestamp)
        tokensWithValues.forEach(
          (data) => (data.values = data.values.splice(firstNonNullTimestamp))
        )
        totalValues = totalValues.slice(firstNonNullTimestamp)
      }

      return {
        timestamps,
        tokens: tokensWithValues,
        total: {
          values: totalValues,
          currentValue: totalCurrentValue,
        },
      }
    },
})
