import { useAppSelector } from './common';

export function useWalletAccount() {
	const { metaMaskAccount, metaMaskChainId } = useAppSelector(
		(state) => state.wallet
	);

	return {
		metaMaskAccount,
		metaMaskChainId,
	};
}
