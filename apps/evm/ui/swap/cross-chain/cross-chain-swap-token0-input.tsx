'use client'

import { Chain } from '@sushiswap/chain'
import { STARGATE_SUPPORTED_CHAIN_IDS, StargateChainId } from '@sushiswap/stargate'
import { Button, Label, NetworkIcon, NetworkSelector, SelectIcon } from '@sushiswap/ui'
import { Collapsible } from '@sushiswap/ui/components/animation/Collapsible'
import { Web3Input } from '@sushiswap/wagmi/future/components/Web3Input'

import { useDerivedStateCrossChainSwap } from './derivedstate-cross-chain-swap-provider'

export const CrossChainSwapToken0Input = () => {
  const {
    state: { swapAmountString, chainId0, token0 },
    mutate: { setSwapAmount, setToken0, setChainId0 },
    isToken0Loading: isLoading,
  } = useDerivedStateCrossChainSwap()

  return (
    <div className="border border-accent flex flex-col bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
      <Collapsible open={true}>
        <div className="p-3 border-b border-accent flex gap-2 items-center">
          <Label className="text-xs tracking-tighter text-muted-foreground">From</Label>
          <NetworkSelector
            networks={STARGATE_SUPPORTED_CHAIN_IDS}
            selected={chainId0 as StargateChainId}
            onSelect={(chainId, close) => {
              setChainId0(chainId)
              close()
            }}
          >
            <Button variant="secondary" size="xs">
              <NetworkIcon chainId={chainId0} width={16} height={16} />
              {Chain.from(chainId0).name}
              <SelectIcon />
            </Button>
          </NetworkSelector>
        </div>
      </Collapsible>
      <Web3Input.Currency
        id="swap-from"
        type="INPUT"
        className="p-3 bg-white dark:bg-slate-800"
        chainId={chainId0}
        onSelect={setToken0}
        value={swapAmountString}
        onChange={setSwapAmount}
        currency={token0}
        loading={isLoading}
        currencyLoading={isLoading}
      />
    </div>
  )
}
