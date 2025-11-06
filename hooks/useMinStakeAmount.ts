import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import {
  getStakeManagerAddress,
  getLsdTokenAddress,
  getLsdTokenAbi,
  getAaveStakeManagerAbi,
} from 'config/contract';
import { wagmiConfig } from 'connectors/walletConnect';
import { fromChainAmount } from 'utils/numberUtils';
import { useAppDispatch, useAppSelector } from './common';
import { setDecimalsStore } from 'redux/reducers/TokenSlice';

export const useMinStakeAmount = () => {
  const dispatch = useAppDispatch();
  const { decimalsStore } = useAppSelector((state) => state.token);

  const fetchData = async () => {
    try {
      const minStakeAmount = await readContract(wagmiConfig, {
        address: getStakeManagerAddress() as `0x${string}`,
        abi: getAaveStakeManagerAbi(),
        functionName: 'minStakeAmount',
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

      return fromChainAmount(minStakeAmount + '', decimals).toString();
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
