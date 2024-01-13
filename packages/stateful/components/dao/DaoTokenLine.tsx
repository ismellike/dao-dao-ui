import {
  TokenLine as StatelessTokenLine,
  useCachedLoading,
} from '@dao-dao/stateless'
import { TokenCardInfo, TokenLineProps } from '@dao-dao/types'
import { getDisplayNameForChainId } from '@dao-dao/utils'

import { tokenCardLazyInfoSelector } from '../../recoil'
import { DaoTokenCard } from './DaoTokenCard'

export const DaoTokenLine = <T extends TokenCardInfo>(
  props: Omit<TokenLineProps<T>, 'TokenCard'>
) => {
  const lazyInfo = useCachedLoading(
    tokenCardLazyInfoSelector({
      owner: props.owner.address,
      token: props.token,
      unstakedBalance: props.unstakedBalance,
    }),
    {
      usdUnitPrice: undefined,
      stakingInfo: undefined,
      totalBalance: props.unstakedBalance,
    }
  )

  return (
    <StatelessTokenLine
      {...props}
      TokenCard={DaoTokenCard}
      lazyInfo={lazyInfo}
      subtitle={getDisplayNameForChainId(props.token.chainId)}
    />
  )
}
