import { Chain } from 'viem';
import { getEvmChainId, getEvmChainName, getEvmRpc, isDev } from './env';
import { getExplorerUrl } from './explorer';

export const customChain = {
	id: getEvmChainId(),
	name: getEvmChainName(),
	nativeCurrency: {
		name: 'ETH',
		symbol: 'ETH',
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: [getEvmRpc()],
		},
	},
	blockExplorers: {
		default: {
			name: 'Explorer',
			url: getExplorerUrl(),
		},
	},
	testnet: isDev(),
} as const satisfies Chain;
