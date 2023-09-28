import type {} from '@sushiswap/database'
import type { getSteerVaults as _getSteerVaults } from '@sushiswap/steer-vault-api/lib/api/index.js'
import { SteerVaultsApiSchema } from '@sushiswap/steer-vault-api/lib/schemas/index.js'
import useSWR from 'swr'

import { STEER_VAULT_API } from '../../constants.js'
import { parseArgs } from '../../functions.js'
import type { GetApiInputFromOutput, SWRHookConfig } from '../../types.js'

export { SteerVaultsApiSchema }
export type SteerVaults = Awaited<ReturnType<typeof _getSteerVaults>>
export type GetSteerVaultsArgs =
  | GetApiInputFromOutput<(typeof SteerVaultsApiSchema)['_input'], (typeof SteerVaultsApiSchema)['_output']>
  | undefined

export const getSteerVaultsUrl = (args: GetSteerVaultsArgs) => {
  return `${STEER_VAULT_API}/api/v0${parseArgs(args)}`
}

export const getSteerVaults = async (args: GetSteerVaultsArgs): Promise<SteerVaults> => {
  return fetch(getSteerVaultsUrl(args)).then((data) => data.json())
}

export const useSteerVaults = ({ args, shouldFetch }: SWRHookConfig<GetSteerVaultsArgs>) => {
  return useSWR<SteerVaults>(shouldFetch !== false ? getSteerVaultsUrl(args) : null, async (url) =>
    fetch(url).then((data) => data.json())
  )
}
