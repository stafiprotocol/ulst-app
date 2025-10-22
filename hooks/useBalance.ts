import { useEffect } from "react";
import { updateLsdTokenBalance } from "redux/reducers/LsdTokenSlice";
import { useAppDispatch, useAppSelector } from "./common";
import { useAppSlice } from "./selector";

export function useBalance() {
  const { updateFlag } = useAppSlice();
  const dispatch = useAppDispatch();

  const { balance } = useAppSelector((state) => state.token);
  const { balance: lsdBalance } = useAppSelector((state) => state.lsdToken);

  useEffect(() => {
    if (updateFlag) {
      dispatch(updateLsdTokenBalance());
    }
  }, [dispatch, updateFlag]);

  return {
    balance,
    lsdBalance,
  };
}
