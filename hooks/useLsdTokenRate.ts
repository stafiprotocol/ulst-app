import { useEffect } from 'react';
import { updateLsdTokenRate } from 'redux/reducers/LsdTokenSlice';
import { useAppDispatch, useAppSelector } from './common';
import { useAppSlice } from './selector';

export function useLsdTokenRate() {
	const dispatch = useAppDispatch();
	const { updateFlag } = useAppSlice();

	const { rate } = useAppSelector((state) => state.lsdToken);

	useEffect(() => {
		dispatch(updateLsdTokenRate());
	}, [dispatch, updateFlag]);

	return rate;
}
