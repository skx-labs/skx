'use client'

import { ChainId } from '@sushiswap/chain'
import { getPool } from '@sushiswap/client'
import { formatUSD } from '@sushiswap/format'
import { useConcentratedLiquidityPoolStats } from '@sushiswap/react-query'
import { CardLabel, classNames, Separator, SkeletonText } from '@sushiswap/ui'
import {
  Card,
  CardContent,
  CardCurrencyAmountItem,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sushiswap/ui/components/card'
import { Toggle } from '@sushiswap/ui/components/toggle'
import { SushiSwapV3ChainId } from '@sushiswap/v3-sdk'
import { useConcentratedLiquidityPool, useConcentratedLiquidityPoolReserves } from '@sushiswap/wagmi/future/hooks'
import { useTokenAmountDollarValues } from 'lib/hooks'
import React, { FC, useMemo, useState } from 'react'

import { ConcentratedLiquidityProvider } from './ConcentratedLiquidityProvider'
import { ConcentratedPositionsTable } from './ConcentratedPositionsTable'
import { PoolRewardDistributionsCard } from './PoolRewardDistributionsCard'
import { PoolsFiltersProvider } from './PoolsFiltersProvider'
import { PoolTransactionsV3 } from './PoolTransactionsV3'
import { StatisticsCharts } from './StatisticsChart'

enum Granularity {
  Day,
  Week,
}

const PoolPageV3: FC<{ pool: Awaited<ReturnType<typeof getPool>> }> = ({ pool }) => {
  return (
    <ConcentratedLiquidityProvider>
      <Pool pool={pool} />
    </ConcentratedLiquidityProvider>
  )
}

const Pool: FC<{ pool: Awaited<ReturnType<typeof getPool>> }> = ({ pool }) => {
  const { id } = pool
  const [_chainId, address] = id.split(':')
  const chainId = +_chainId as SushiSwapV3ChainId
  const [granularity, setGranularity] = useState<Granularity>(Granularity.Day)

  const { data: poolStats } = useConcentratedLiquidityPoolStats({ chainId, address })
  const { data: cPool } = useConcentratedLiquidityPool({
    chainId,
    token0: poolStats?.token0,
    token1: poolStats?.token1,
    feeAmount: poolStats?.feeAmount,
  })

  const { data: reserves, isLoading: isReservesLoading } = useConcentratedLiquidityPoolReserves({
    pool: cPool,
    chainId,
  })
  const fiatValues = useTokenAmountDollarValues({ chainId, amounts: reserves })
  const incentiveAmounts = useMemo(() => poolStats?.incentives.map((el) => el.reward), [poolStats?.incentives])
  const fiatValuesIncentives = useTokenAmountDollarValues({ chainId, amounts: incentiveAmounts })

  return (
    <div className="flex flex-col gap-6">
      <PoolsFiltersProvider>
        <ConcentratedPositionsTable chainId={pool.chainId as ChainId} poolId={pool.address} />
      </PoolsFiltersProvider>
      <div className="py-4">
        <Separator />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[auto_400px] gap-6">
        <StatisticsCharts address={address} chainId={chainId} />
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pool Liquidity</CardTitle>
              <CardDescription>{formatUSD(fiatValues[0] + fiatValues[1])}</CardDescription>
            </CardHeader>
            <CardContent>
              <CardCurrencyAmountItem
                isLoading={isReservesLoading}
                amount={reserves?.[0]}
                fiatValue={formatUSD(fiatValues[0])}
              />
              <CardCurrencyAmountItem
                isLoading={isReservesLoading}
                amount={reserves?.[1]}
                fiatValue={formatUSD(fiatValues[1])}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex flex-col md:flex-row justify-between gap-y-4">
                  Statistics
                  <div className="flex items-center gap-1">
                    <Toggle
                      variant="outline"
                      size="xs"
                      pressed={granularity === Granularity.Day}
                      onClick={() => setGranularity(Granularity.Day)}
                    >
                      24H
                    </Toggle>
                    <Toggle
                      variant="outline"
                      size="xs"
                      pressed={granularity === Granularity.Week}
                      onClick={() => setGranularity(Granularity.Week)}
                    >
                      1W
                    </Toggle>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <CardLabel>Volume</CardLabel>
                  {poolStats ? (
                    <div className="text-xl font-semibold">
                      {formatUSD(granularity === Granularity.Week ? poolStats.volume1w : poolStats.volume1d ?? 0)}{' '}
                      <span
                        className={classNames(
                          'text-xs',
                          poolStats[granularity === Granularity.Week ? 'volumeChange1w' : 'volumeChange1d'] > 0
                            ? 'text-green'
                            : 'text-red'
                        )}
                      >
                        ({poolStats[granularity === Granularity.Week ? 'volumeChange1w' : 'volumeChange1d'].toFixed(2)}
                        %)
                      </span>
                    </div>
                  ) : (
                    <SkeletonText />
                  )}
                </div>
                <div>
                  <CardLabel>Fees</CardLabel>
                  {poolStats ? (
                    <div className="text-xl font-semibold">
                      {formatUSD(granularity === Granularity.Week ? poolStats.fees1w : poolStats.fees1d ?? 0)}{' '}
                      <span
                        className={classNames(
                          'text-xs',
                          poolStats[granularity === Granularity.Week ? 'feesChange1w' : 'feesChange1d'] > 0
                            ? 'text-green'
                            : 'text-red'
                        )}
                      >
                        ({poolStats[granularity === Granularity.Week ? 'feesChange1w' : 'feesChange1d'].toFixed(2)}
                        %)
                      </span>
                    </div>
                  ) : (
                    <SkeletonText />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="py-4">
        <Separator />
      </div>
      <PoolRewardDistributionsCard pool={pool} />
      <PoolTransactionsV3 pool={pool} poolId={pool.address} />
    </div>
  )
}

export { PoolPageV3 }
