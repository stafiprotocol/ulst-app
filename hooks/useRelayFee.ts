import { getStakeManagerAbi, getStakeManagerAddress } from 'config/contract';
import { useMemo } from 'react';
import { useReadContract } from 'wagmi';

export function useRelayFee(type: 'stake' | 'unstake') {
	const result = useReadContract({
		abi: getStakeManagerAbi(),
		address: getStakeManagerAddress() as `0x${string}`,
		functionName:
			type === 'stake' ? 'getStakeRelayerFee' : 'getUnstakeRelayerFee',
	});

	const relayFee = useMemo(() => {
		console.log(result);
		return result.data;
	}, [result]);
}
