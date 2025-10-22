import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import { getLsdTokenAbi, getLsdTokenAddress } from 'config/contract';
import { wagmiConfig } from 'connectors/walletConnect';
import { fromChainAmount } from 'utils/numberUtils';
import { useAccount } from 'wagmi';

export function useLsdBalance() {
	const { address, isConnected } = useAccount();

	const fetchData = async () => {
		if (!isConnected || !address) return null;
		try {
			const balance = await readContract(wagmiConfig, {
				address: getLsdTokenAddress() as `0x${string}`,
				abi: getLsdTokenAbi(),
				functionName: 'balanceOf',
				args: [address],
			});
			return fromChainAmount((balance as bigint).toString(), 6);
		} catch (err: any) {
			console.log(err);
			return null;
		}
	};

	const result = useQuery<number | null>({
		queryKey: ['getLsdBalance', address],
		enabled: isConnected && !!address,
		queryFn: fetchData,
	});

	return {
		lsdBalance: result.data,
		refetchLsdBalance: result.refetch,
	};
}
