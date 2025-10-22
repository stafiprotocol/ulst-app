import { http } from 'viem';
import { createConfig } from 'wagmi';
import { customChain } from 'config/chain';
import { getEvmChainId, getEvmRpc } from 'config/env';
import { injected, metaMask } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
	chains: [customChain],
	connectors: [injected(), metaMask()],
	transports: {
		[getEvmChainId()]: http(getEvmRpc()),
	},
	ssr: true,
});
