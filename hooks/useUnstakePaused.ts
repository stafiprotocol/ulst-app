import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import { getStakeManagerAbi, getStakeManagerAddress } from 'config/contract';
import { wagmiConfig } from 'connectors/walletConnect';

export function useUnstakePaused() {
  const fetchData = async () => {
    try {
      const unstakePaused = await readContract(wagmiConfig, {
        address: getStakeManagerAddress() as `0x${string}`,
        abi: getStakeManagerAbi(),
        functionName: 'isUnstakePaused',
      });
      return unstakePaused as boolean;
    } catch (err: any) {
      console.log(err);
      return null;
    }
  };

  const result = useQuery<boolean | null>({
    queryKey: ['getUnstakePaused'],
    queryFn: fetchData,
    refetchInterval: 10 * 1000,
  });

  return result.data;
}
