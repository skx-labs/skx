import { SteerStrategy } from '@sushiswap/database'
import { useConcentratedLiquidityPoolStats } from '@sushiswap/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from '@sushiswap/ui'
import { SushiSwapV3ChainId } from '@sushiswap/v3-sdk'
import { useAccount } from '@sushiswap/wagmi'
import { unwrapToken } from 'lib/functions'
import React, { FC, useMemo, useState } from 'react'
import { ConcentratedLiquidityWidget } from 'ui/pool/ConcentratedLiquidityWidget'

import { SelectPricesWidget } from './SelectPricesWidget'

export const SteerStrategies = {
  [SteerStrategy.ClassicRebalance]: <></>,
  [SteerStrategy.DeltaNeutralStables]: <></>,
  [SteerStrategy.ElasticExpansion]: <></>,
  [SteerStrategy.HighLowChannel]: <></>,
  [SteerStrategy.MovingVolatilityChannelMedium]: <></>,
  [SteerStrategy.StaticStable]: <></>,
} as const satisfies Record<SteerStrategy, unknown>

interface ManualProps {
  address: string
  chainId: SushiSwapV3ChainId
}

export const SteerManual: FC<ManualProps> = ({ address, chainId }) => {
  const { address: account } = useAccount()

  const [invertTokens, setInvertTokens] = useState(false)

  const { data: poolStats } = useConcentratedLiquidityPoolStats({ chainId, address })
  const [_token0, _token1] = useMemo(() => {
    const tokens = [
      poolStats?.token0 ? unwrapToken(poolStats.token0) : undefined,
      poolStats?.token1 ? unwrapToken(poolStats.token1) : undefined,
    ]

    return invertTokens ? tokens.reverse() : tokens
  }, [invertTokens, poolStats?.token0, poolStats?.token1])

  return (
    <Card>
      <CardHeader>
        <CardTitle>New position</CardTitle>
        <CardDescription>Create a new concentrated liquidity position</CardDescription>
      </CardHeader>
      <div className="px-6">
        <Separator />
      </div>
      <CardContent>
        <SelectPricesWidget
          chainId={chainId}
          token0={_token0}
          token1={_token1}
          feeAmount={poolStats?.feeAmount}
          tokenId={undefined}
          switchTokens={() => setInvertTokens((prev) => !prev)}
        />
        <ConcentratedLiquidityWidget
          chainId={chainId}
          account={account}
          token0={_token0}
          token1={_token1}
          feeAmount={poolStats?.feeAmount}
          tokensLoading={false}
          existingPosition={undefined}
          tokenId={undefined}
          successLink={`/pools/${chainId}:${address}?activeTab=myPositions`}
        />
      </CardContent>
    </Card>
  )
}
