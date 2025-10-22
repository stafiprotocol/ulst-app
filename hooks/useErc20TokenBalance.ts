import { getErc20Abi } from "config/contract";
import { getWeb3 } from "utils/web3Utils";
import { useWalletAccount } from "./useWalletAccount";
import { useQuery } from "@tanstack/react-query";

export function useErc20TokenBalance(address: string) {
  const { metaMaskAccount } = useWalletAccount();
  const fetchData = async () => {
    try {
      const web3 = getWeb3();
      const {
        utils: { toBN },
      } = web3;

      const contract = new web3.eth.Contract(getErc20Abi(), address);
      const balance = await contract.methods.balanceOf(metaMaskAccount).call();
      const decimals = await contract.methods.decimals().call();
      return toBN(balance)
        .div(toBN(10).pow(toBN(decimals)))
        .toString();
    } catch (err: any) {
      console.log(err);
      return null;
    }
  };

  const result = useQuery<string | null>({
    queryKey: ["erc20TokenBalance", address, metaMaskAccount],
    enabled: !!address && !!metaMaskAccount,
    refetchInterval: 6 * 1000,
    queryFn: fetchData,
  });

  return {
    stableCoinBalance: result.data,
    refetchStableCoinBalance: result.refetch,
  };
}
