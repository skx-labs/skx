import {getAddress} from '@ethersproject/address'
import {Token} from '@sushiswap/currency'
import {saveTokens} from "@sushiswap/dexie";
import {useQuery} from '@tanstack/react-query'

interface UseTokensParams {
    chainId: number
}

type Data = {
    id: string
    address: string
    name: string
    symbol: string
    decimals: number
}

export const fetchTokensQueryFn = async () => {
    const resp = await fetch("https://tokens.sushi.com/v0")
    if (resp.status === 200) {
        const data: Array<Data> = await resp.json()
        await saveTokens({
            tokens: data.map(({id, address, symbol, decimals, name}) => {
                const [chainId] = id.split(':')
                return ({id, address, symbol, decimals, name, status: 'APPROVED', chainId: +chainId})
            })
        })

        return data.reduce<Record<number, Record<string, Token>>>((acc, {id, name, symbol, decimals}) => {
            const [chainId, address] = id.split(':')

            acc[+chainId] = acc[+chainId] ?? {}
            acc[+chainId][getAddress(address)] = new Token({
                chainId,
                name,
                decimals,
                symbol,
                address,
            })

            return acc
        }, {})
    }

    throw new Error('Could not fetch tokens')
}

export const useTokens = ({chainId}: UseTokensParams) => {
    return useQuery({
        queryKey: ['tokens'],
        queryFn: fetchTokensQueryFn,
        select: (data) => data[chainId],
        keepPreviousData: true,
        staleTime: 900000, // 15 mins
        cacheTime: 86400000 // 24hs
    })
}
