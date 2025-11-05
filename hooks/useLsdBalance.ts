import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import { getLsdTokenAbi, getLsdTokenAddress } from 'config/contract';
import { wagmiConfig } from 'connectors/walletConnect';
import { fromChainAmount } from 'utils/numberUtils';
import { useAccount } from 'wagmi';
import { useAppDispatch, useAppSelector } from './common';
import { setDecimalsStore } from 'redux/reducers/TokenSlice';

export function useLsdBalance() {
  const { address, isConnected } = useAccount();

  const dispatch = useAppDispatch();
  const { decimalsStore } = useAppSelector((state) => state.token);

  const fetchData = async () => {
    if (!isConnected || !address) return null;
    try {
      const balance = await readContract(wagmiConfig, {
        address: getLsdTokenAddress() as `0x${string}`,
        abi: getLsdTokenAbi(),
        functionName: 'balanceOf',
        args: [address],
      });

      let decimals = decimalsStore[getLsdTokenAddress()];
      if (!decimals) {
        decimals = Number(
          await readContract(wagmiConfig, {
            address: getLsdTokenAddress() as `0x${string}`,
            abi: getLsdTokenAbi(),
            functionName: 'decimals',
          })
        );
        dispatch(
          setDecimalsStore({
            address: getLsdTokenAddress(),
            decimals: decimals,
          })
        );
      }
      return fromChainAmount((balance as bigint).toString(), decimals);
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
