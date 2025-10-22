import { useAppSelector } from './common';

export function useApr() {
	const { apr } = useAppSelector((state) => state.lsdToken);

	return apr;
}
