import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import { getStakeManagerAddress, getStakeManagerAbi } from 'config/contract';
import { wagmiConfig } from 'connectors/walletConnect';
import { fromChainAmount } from 'utils/numberUtils';

export const useMinStakeAmount = () => {
	const fetchData = async () => {
		try {
			const minStakeAmount = await readContract(wagmiConfig, {
				address: getStakeManagerAddress() as `0x${string}`,
				abi: getStakeManagerAbi(),
				functionName: 'minStakeAmount',
			});
			return fromChainAmount(minStakeAmount + '', 6).toString();
		} catch (err: any) {
			console.log(err);
			return null;
		}
	};

	const result = useQuery<string | null>({
		queryKey: ['getMinStakeAmount'],
		queryFn: fetchData,
	});

	return result.data;
};
