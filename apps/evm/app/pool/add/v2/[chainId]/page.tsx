'use client'

import { PlusIcon } from '@heroicons/react-v1/solid'
import { SushiSwapV2Pool } from '@sushiswap/amm'
import { ChainId, TESTNET_CHAIN_IDS } from '@sushiswap/chain'
import { defaultQuoteCurrency, Native, tryParseAmount, Type } from '@sushiswap/currency'
import { ZERO } from '@sushiswap/math'
import { FormSection } from '@sushiswap/ui'
import { Button } from '@sushiswap/ui/components/button'
import { Loader } from '@sushiswap/ui/components/loader'
import {
  isSushiSwapV2ChainId,
  SUSHISWAP_V2_ROUTER_ADDRESS,
  SUSHISWAP_V2_SUPPORTED_CHAIN_IDS,
  SushiSwapV2ChainId,
} from '@sushiswap/v2-sdk'
import { PoolFinder, SushiSwapV2PoolState } from '@sushiswap/wagmi'
import { Web3Input } from '@sushiswap/wagmi/future/components/Web3Input'
import { Checker } from '@sushiswap/wagmi/future/systems'
import { CheckerProvider } from '@sushiswap/wagmi/future/systems/Checker/Provider'
import { DISABLED_CHAIN_IDS } from 'config'
import { APPROVE_TAG_ADD_LEGACY } from 'lib/constants'
import { isSushiSwapV2Pool } from 'lib/functions'
import { useRouter } from 'next/navigation'
import React, { Dispatch, FC, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { SWRConfig } from 'swr'

import { AddSectionReviewModalLegacy } from '../../../../../ui/pool/AddSectionReviewModalLegacy'
import { SelectNetworkWidget } from '../../../../../ui/pool/SelectNetworkWidget'
import { SelectTokensWidget } from '../../../../../ui/pool/SelectTokensWidget'

export default function Page({ params }: { params: { chainId: string } }) {
  const router = useRouter()
  const [chainId, setChainId] = useState(+params.chainId as SushiSwapV2ChainId)
  const [token0, setToken0] = useState<Type | undefined>(Native.onChain(chainId))
  const [token1, setToken1] = useState<Type | undefined>(
    defaultQuoteCurrency[chainId as keyof typeof defaultQuoteCurrency]
  )

  useEffect(() => {
    setToken0(Native.onChain(chainId))
    setToken1(defaultQuoteCurrency[chainId as keyof typeof defaultQuoteCurrency])
  }, [chainId])

  return (
    <SWRConfig>
      <PoolFinder
        components={
          <PoolFinder.Components>
            <PoolFinder.SushiSwapV2Pool
              chainId={chainId}
              token0={token0}
              token1={token1}
              enabled={isSushiSwapV2ChainId(chainId)}
            />
          </PoolFinder.Components>
        }
      >
        {({ pool: [poolState, pool] }) => {
          const title =
            !token0 || !token1 ? (
              'Select Tokens'
            ) : [SushiSwapV2PoolState.LOADING].includes(poolState as SushiSwapV2PoolState) ? (
              <div className="h-[20px] flex items-center justify-center">
                <Loader width={14} />
              </div>
            ) : [SushiSwapV2PoolState.EXISTS].includes(poolState as SushiSwapV2PoolState) ? (
              'Add Liquidity'
            ) : (
              'Create Pool'
            )

          return (
            <_Add
              chainId={chainId}
              setChainId={(chainId) => {
                if (!isSushiSwapV2ChainId(chainId)) return
                router.push(`/pool/add/v2/${chainId}`)
                setChainId(chainId)
              }}
              pool={pool as SushiSwapV2Pool | null}
              poolState={poolState as SushiSwapV2PoolState}
              title={title}
              token0={token0}
              token1={token1}
              setToken0={setToken0}
              setToken1={setToken1}
            />
          )
        }}
      </PoolFinder>
    </SWRConfig>
  )
}

interface AddProps {
  chainId: ChainId
  setChainId(chainId: ChainId): void
  pool: SushiSwapV2Pool | null
  poolState: SushiSwapV2PoolState
  title: ReactNode
  token0: Type | undefined
  token1: Type | undefined
  setToken0: Dispatch<SetStateAction<Type | undefined>>
  setToken1: Dispatch<SetStateAction<Type | undefined>>
}

const _Add: FC<AddProps> = ({ chainId, setChainId, pool, poolState, title, token0, token1, setToken0, setToken1 }) => {
  const [{ input0, input1 }, setTypedAmounts] = useState<{
    input0: string
    input1: string
  }>({ input0: '', input1: '' })

  const [parsedInput0, parsedInput1] = useMemo(() => {
    return [tryParseAmount(input0, token0), tryParseAmount(input1, token1)]
  }, [input0, input1, token0, token1])

  const noLiquidity = useMemo(() => {
    return pool?.reserve0.equalTo(ZERO) && pool.reserve1.equalTo(ZERO)
  }, [pool])

  const onChangeToken0TypedAmount = useCallback(
    (value: string) => {
      if (poolState === SushiSwapV2PoolState.NOT_EXISTS || noLiquidity) {
        setTypedAmounts((prev) => ({
          ...prev,
          input0: value,
        }))
      } else if (token0 && pool) {
        const parsedAmount = tryParseAmount(value, token0)
        setTypedAmounts({
          input0: value,
          input1: parsedAmount ? pool.priceOf(token0.wrapped).quote(parsedAmount.wrapped).toExact() : '',
        })
      }
    },
    [noLiquidity, pool, poolState, token0]
  )

  const onChangeToken1TypedAmount = useCallback(
    (value: string) => {
      if (poolState === SushiSwapV2PoolState.NOT_EXISTS || noLiquidity) {
        setTypedAmounts((prev) => ({
          ...prev,
          input1: value,
        }))
      } else if (token1 && pool) {
        const parsedAmount = tryParseAmount(value, token1)
        setTypedAmounts({
          input0: parsedAmount ? pool.priceOf(token1.wrapped).quote(parsedAmount.wrapped).toExact() : '',
          input1: value,
        })
      }
    },
    [noLiquidity, pool, poolState, token1]
  )

  useEffect(() => {
    if (pool) {
      onChangeToken0TypedAmount(input0)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChangeToken0TypedAmount])

  const networks = useMemo(
    () =>
      SUSHISWAP_V2_SUPPORTED_CHAIN_IDS.filter(
        (chainId) =>
          !TESTNET_CHAIN_IDS.includes(chainId as (typeof TESTNET_CHAIN_IDS)[number]) &&
          !DISABLED_CHAIN_IDS.includes(chainId as (typeof DISABLED_CHAIN_IDS)[number])
      ),
    []
  )

  return (
    <>
      <SelectNetworkWidget networks={networks} selectedNetwork={chainId} onSelect={setChainId} />
      <SelectTokensWidget
        chainId={chainId}
        token0={token0}
        token1={token1}
        setToken0={setToken0}
        setToken1={setToken1}
      />
      <FormSection title="Deposit" description="Select the amount of tokens you want to deposit">
        <div className="flex flex-col gap-4">
          <Web3Input.Currency
            id="add-liquidity-token0"
            type="INPUT"
            className="p-3 bg-white dark:bg-slate-800 rounded-xl"
            chainId={chainId}
            value={input0}
            onChange={onChangeToken0TypedAmount}
            onSelect={setToken0}
            currency={token0}
            disabled={
              !token0 || poolState === SushiSwapV2PoolState.LOADING || poolState === SushiSwapV2PoolState.INVALID
            }
            loading={poolState === SushiSwapV2PoolState.LOADING}
          />
          <div className="left-0 right-0 mt-[-24px] mb-[-24px] flex items-center justify-center">
            <button type="button" className="z-10 p-2 bg-gray-100 rounded-full dark:bg-slate-900">
              <PlusIcon strokeWidth={3} className="w-4 h-4 dark:text-slate-400 text-slate-600" />
            </button>
          </div>
          <Web3Input.Currency
            id="add-liquidity-token1"
            type="INPUT"
            className="p-3 bg-white dark:bg-slate-800 rounded-xl"
            chainId={chainId}
            value={input1}
            onChange={onChangeToken1TypedAmount}
            onSelect={setToken1}
            currency={token1}
            disabled={
              !token1 || poolState === SushiSwapV2PoolState.LOADING || poolState === SushiSwapV2PoolState.INVALID
            }
            loading={poolState === SushiSwapV2PoolState.LOADING}
          />
          <CheckerProvider>
            <Checker.Connect fullWidth>
              <Checker.Network fullWidth chainId={chainId}>
                <Checker.Amounts fullWidth chainId={chainId} amounts={[parsedInput0, parsedInput1]}>
                  {(!pool || isSushiSwapV2Pool(pool)) && isSushiSwapV2ChainId(chainId) && (
                    <>
                      <Checker.ApproveERC20
                        id="approve-token-0"
                        className="whitespace-nowrap"
                        fullWidth
                        amount={parsedInput0}
                        contract={SUSHISWAP_V2_ROUTER_ADDRESS[chainId]}
                      >
                        <Checker.ApproveERC20
                          id="approve-token-1"
                          className="whitespace-nowrap"
                          fullWidth
                          amount={parsedInput1}
                          contract={SUSHISWAP_V2_ROUTER_ADDRESS[chainId]}
                        >
                          <Checker.Success tag={APPROVE_TAG_ADD_LEGACY}>
                            <AddSectionReviewModalLegacy
                              poolAddress={pool?.liquidityToken.address}
                              poolState={poolState as SushiSwapV2PoolState}
                              chainId={chainId}
                              token0={token0}
                              token1={token1}
                              input0={parsedInput0}
                              input1={parsedInput1}
                              onSuccess={() => {
                                setTypedAmounts({ input0: '', input1: '' })
                              }}
                            >
                              <Button size="xl" fullWidth testId="add-liquidity">
                                {title}
                              </Button>
                            </AddSectionReviewModalLegacy>
                          </Checker.Success>
                        </Checker.ApproveERC20>
                      </Checker.ApproveERC20>
                    </>
                  )}
                </Checker.Amounts>
              </Checker.Network>
            </Checker.Connect>
          </CheckerProvider>
        </div>
      </FormSection>
    </>
  )
}
