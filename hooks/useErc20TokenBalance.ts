import { getErc20Abi } from 'config/contract';
import { getWeb3 } from 'utils/web3Utils';
import { useWalletAccount } from './useWalletAccount';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from './common';
import { setDecimalsStore } from 'redux/reducers/TokenSlice';

export function useErc20TokenBalance(address: string) {
  const { metaMaskAccount } = useWalletAccount();

  const dispatch = useAppDispatch();
  const { decimalsStore } = useAppSelector((state) => state.token);

  const fetchData = async () => {
    try {
      const web3 = getWeb3();
      const {
        utils: { toBN },
      } = web3;

      const contract = new web3.eth.Contract(getErc20Abi(), address);
      const balance = await contract.methods.balanceOf(metaMaskAccount).call();

      let decimals = decimalsStore[address];
      if (!decimals) {
        decimals = Number(await contract.methods.decimals().call());
        dispatch(
          setDecimalsStore({
            address,
            decimals: decimals,
          })
        );
      }

      return toBN(balance)
        .div(toBN(10).pow(toBN(decimals)))
        .toString();
    } catch (err: any) {
      console.log(err);
      return null;
    }
  };

  const result = useQuery<string | null>({
    queryKey: ['erc20TokenBalance', address, metaMaskAccount],
    enabled: !!address && !!metaMaskAccount,
    refetchInterval: 6 * 1000,
    queryFn: fetchData,
  });

  return {
    stableCoinBalance: result.data,
    refetchStableCoinBalance: result.refetch,
  };
}
