import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSlice } from './selector';
import { useAppDispatch, useAppSelector } from './common';

export function usePrice() {
  const { updateFlag } = useAppSlice();
  const dispatch = useAppDispatch();

  const lastTime = useRef(0);

  const { tokenPrice } = useAppSelector((state) => state.token);

  const fetchTokenPrice = useCallback(async () => {
    if (updateFlag - lastTime.current < 10) return; // 10s
    lastTime.current = updateFlag;
    try {
      // const response = await fetch(getTokenPriceUrl(), {
      // 	method: 'GET',
      // 	headers: {
      // 		'Content-Type': 'application/json',
      // 	},
      // });
      // const resJson = await response.json();
      // if (resJson) {
      // 	const { usd } = resJson.hyperliquid;
      // 	dispatch(setTokenPrice(usd));
      // }
    } catch (err: any) {}
  }, [updateFlag]);

  useEffect(() => {
    fetchTokenPrice();
  }, [updateFlag]);

  return {
    tokenPrice: 1,
  };
}
