import { useCallback } from 'react'
import { useSetRecoilState, waitForAll } from 'recoil'

import { refreshOpenProposalsAtom } from '@dao-dao/state/recoil'
import {
  VetoableProposals as Renderer,
  VetoableProposalsProps,
  useCachedLoadable,
} from '@dao-dao/stateless'
import { FeedSource, StatefulProposalLineProps } from '@dao-dao/types'
import { getSupportedChains, webSocketChannelNameForDao } from '@dao-dao/utils'

import { useOnWebSocketMessage, useWallet } from '../../../hooks'
import { followingDaosSelector } from '../../../recoil'
import { feedVetoableProposalsSelector } from './state'

export const VetoableProposals: FeedSource<
  VetoableProposalsProps<StatefulProposalLineProps>
> = {
  id: 'vetoable_proposals',
  Renderer,
  useData: (filter) => {
    const { address, hexPublicKey } = useWallet({
      loadAccount: true,
    })

    const setRefresh = useSetRecoilState(refreshOpenProposalsAtom)
    const refresh = useCallback(() => setRefresh((id) => id + 1), [setRefresh])

    const chains = getSupportedChains().filter(
      ({ chain: { chain_id: chainId } }) =>
        !filter?.chainId || chainId === filter.chainId
    )

    const daosWithItemsLoadable = useCachedLoadable(
      address && !hexPublicKey.loading
        ? waitForAll(
            chains.map(({ chain }) =>
              feedVetoableProposalsSelector({
                chainId: chain.chain_id,
                hexPublicKey: hexPublicKey.data,
              })
            )
          )
        : undefined
    )

    const followingDaosLoadable = useCachedLoadable(
      hexPublicKey.loading
        ? undefined
        : waitForAll(
            chains.map(({ chain }) =>
              followingDaosSelector({
                chainId: chain.chain_id,
                walletPublicKey: hexPublicKey.data,
              })
            )
          )
    )

    // Refresh when any proposal or vote is updated for any of the followed
    // DAOs.
    useOnWebSocketMessage(
      followingDaosLoadable.state === 'hasValue'
        ? chains.flatMap(({ chain: { chain_id: chainId } }, index) =>
            followingDaosLoadable.contents[index].map((coreAddress) =>
              webSocketChannelNameForDao({
                coreAddress,
                chainId,
              })
            )
          )
        : [],
      ['proposal', 'vote'],
      refresh
    )

    return {
      loading: daosWithItemsLoadable.state === 'loading',
      refreshing:
        daosWithItemsLoadable.state === 'hasValue' &&
        daosWithItemsLoadable.updating,
      daosWithItems:
        daosWithItemsLoadable.state === 'hasValue'
          ? daosWithItemsLoadable.contents.flat()
          : [],
      refresh,
    }
  },
}
