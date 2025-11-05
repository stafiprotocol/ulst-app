import {
  getErc20Abi,
  getLsdTokenAbi,
  getLsdTokenAddress,
} from 'config/contract';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from 'connectors/walletConnect';
import { fromChainAmount } from 'utils/numberUtils';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from './common';
import { setDecimalsStore } from 'redux/reducers/TokenSlice';

export const useTotalStaked = () => {
  const dispatch = useAppDispatch();
  const { decimalsStore } = useAppSelector((state) => state.token);

  const fetchData = async () => {
    try {
      const result = await readContract(wagmiConfig, {
        address: getLsdTokenAddress() as `0x${string}`,
        abi: getErc20Abi(),
        functionName: 'totalSupply',
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

      return fromChainAmount((result as bigint).toString(), decimals);
    } catch (err: any) {
      console.log(err);
      return null;
    }
  };

  const result = useQuery<number | null>({
    queryKey: ['getTotalStake'],
    queryFn: fetchData,
    refetchInterval: 10 * 1000,
  });

  return result.data;
};
