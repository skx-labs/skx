import { getSteerVaultCount as _getSteerVaultCount } from '@sushiswap/steer-vault-api/lib/api/index.js'
import { SteerVaultCountApiSchema } from '@sushiswap/steer-vault-api/lib/schemas/count.js'
import { fetch } from '@whatwg-node/fetch'
import useSWR from 'swr'

import { STEER_VAULT_API } from '../../constants.js'
import { parseArgs } from '../../functions.js'
import type { GetApiInputFromOutput, SWRHookConfig } from '../../types.js'

export { SteerVaultCountApiSchema }
export type SteerVaultCount = Awaited<ReturnType<typeof _getSteerVaultCount>>
export type GetSteerVaultCountArgs =
  | GetApiInputFromOutput<(typeof SteerVaultCountApiSchema)['_input'], (typeof SteerVaultCountApiSchema)['_output']>
  | undefined

export const getSteerVaultCountUrl = (args: GetSteerVaultCountArgs) => {
  return `${STEER_VAULT_API}/api/v0/count${parseArgs(args)}`
}

export const getSteerVaultCount = async (args: GetSteerVaultCountArgs): Promise<SteerVaultCount> => {
  return fetch(getSteerVaultCountUrl(args)).then((data) => data.json())
}

export const useSteerVaultCount = ({ args, shouldFetch }: SWRHookConfig<GetSteerVaultCountArgs>) => {
  return useSWR<SteerVaultCount>(shouldFetch !== false ? getSteerVaultCountUrl(args) : null, async (url) =>
    fetch(url).then((data) => data.json())
  )
}
