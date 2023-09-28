'use client'

import { parseArgs, Protocol } from '@sushiswap/client'
import { SUPPORTED_CHAIN_IDS } from 'config'
import { useRouter } from 'next/navigation'
import { createContext, Dispatch, FC, ReactNode, SetStateAction, useContext, useMemo } from 'react'
import { z } from 'zod'

import { useTypedSearchParams } from '../../lib/hooks'
import { POOL_TYPES } from './TableFiltersPoolType'

type FilterContext = z.TypeOf<typeof poolFiltersSchema>

const FilterContext = createContext<FilterContext | undefined>(undefined)

export type PoolFilters = Omit<FilterContext, 'setFilters'>

interface PoolsFiltersProvider {
  children?: ReactNode
  passedFilters?: Partial<PoolFilters>
}

export const poolFiltersSchema = z.object({
  tokenSymbols: z.coerce.string().transform((symbols) => {
    return symbols.split(',')
  }),
  chainIds: z.coerce
    .string()
    .default(SUPPORTED_CHAIN_IDS.join(','))
    .transform((chainIds) =>
      chainIds !== null && chainIds !== ','
        ? chainIds.split(',').map((chainId) => Number(chainId))
        : SUPPORTED_CHAIN_IDS
    ),
  protocols: z
    .string()
    .transform((protocols) => (protocols !== null && protocols !== ',' ? (protocols.split(',') as Protocol[]) : [])),
  farmsOnly: z.string().transform((bool) => (bool ? bool === 'true' : undefined)),
})

export const PoolsFiltersProvider: FC<PoolsFiltersProvider> = ({ children }) => {
  const urlFilters = useTypedSearchParams(poolFiltersSchema.partial())
  const { tokenSymbols, chainIds, protocols, farmsOnly } = urlFilters

  return (
    <FilterContext.Provider
      value={useMemo(
        () => ({
          tokenSymbols: tokenSymbols ? tokenSymbols : [],
          chainIds: chainIds ? chainIds : SUPPORTED_CHAIN_IDS,
          protocols: protocols ? protocols : POOL_TYPES,
          farmsOnly: farmsOnly ? farmsOnly : false,
        }),
        [chainIds, farmsOnly, protocols, tokenSymbols]
      )}
    >
      {children}
    </FilterContext.Provider>
  )
}

export const usePoolFilters = () => {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('Hook can only be used inside Filter Context')
  }

  return context
}

export const useSetPoolFilters = () => {
  const { push } = useRouter()
  const urlFilters = useTypedSearchParams(poolFiltersSchema.partial())

  const setFilters: Dispatch<SetStateAction<typeof urlFilters>> = (filters) => {
    if (typeof filters === 'function') {
      void push(parseArgs(filters(urlFilters)))
    } else {
      void push(parseArgs(filters))
    }
  }

  return setFilters
}
