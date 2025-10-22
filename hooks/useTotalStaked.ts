import { getErc20Abi, getLsdTokenAddress } from 'config/contract';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from 'connectors/walletConnect';
import { fromChainAmount } from 'utils/numberUtils';
import { useQuery } from '@tanstack/react-query';

export const useTotalStaked = () => {
	const fetchData = async () => {
		try {
			const result = await readContract(wagmiConfig, {
				address: getLsdTokenAddress() as `0x${string}`,
				abi: getErc20Abi(),
				functionName: 'totalSupply',
			});
			return fromChainAmount((result as bigint).toString(), 6);
		} catch (err: any) {
			console.log(err);
			return null;
		}
	};

	const result = useQuery<number | null>({
		queryKey: ['getTotalStake'],
		queryFn: fetchData,
	});

	return result.data;
};
