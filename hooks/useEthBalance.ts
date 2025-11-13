import { useAccount } from 'wagmi';
import { getBalance } from '@wagmi/core';
import { wagmiConfig } from 'connectors/walletConnect';
import { toBN } from 'web3-utils';
import { useQuery } from '@tanstack/react-query';

export function useEthBalance() {
  const { address, isConnected } = useAccount();

  const fetchData = async () => {
    if (!isConnected || !address) return;
    try {
      const balance = await getBalance(wagmiConfig, {
        address,
      });
      const { value, decimals } = balance;
      return Number(value) / 10 ** decimals;
    } catch (err: any) {
      console.log(err);
      return;
    }
  };

  const result = useQuery<number | undefined>({
    queryKey: ['getEthBalance', address],
    enabled: isConnected && !!address,
    queryFn: fetchData,
  });

  return result.data;
}
