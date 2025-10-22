import dayjs from "dayjs";
import { useEffect } from "react";
import {
  setDarkMode,
  setUnreadNoticeFlag,
  setUpdateFlag,
} from "redux/reducers/AppSlice";
import { setRate, updateApr } from "redux/reducers/LsdTokenSlice";
import {
  setMetaMaskAccount,
  setMetaMaskChainId,
  setMetaMaskDisconnected,
} from "redux/reducers/WalletSlice";
import {
  getStorage,
  STORAGE_KEY_DARK_MODE,
  STORAGE_KEY_DISCONNECT_METAMASK,
  STORAGE_KEY_UNREAD_NOTICE,
} from "utils/storageUtils";
import { useAppDispatch } from "./common";
import { useInterval } from "./useInterval";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "connectors/walletConnect";
import { getStakeManagerAbi, getStakeManagerAddress } from "config/contract";

export function useInit() {
  const dispatch = useAppDispatch();

  const {
    address: wagmiAddress,
    isConnected: wagmiIsConnected,
    isDisconnected: wagmiIsDisconnected,
    chainId: wagmiChainId,
  } = useAccount();

  useEffect(() => {
    if (!wagmiIsConnected) {
      dispatch(setMetaMaskAccount(undefined));
    } else {
      dispatch(setMetaMaskAccount(wagmiAddress));
    }
  }, [dispatch, wagmiAddress, wagmiIsConnected, wagmiIsDisconnected]);

  useEffect(() => {
    dispatch(setMetaMaskChainId(wagmiChainId ? wagmiChainId + "" : "1"));
  }, [dispatch, wagmiChainId]);

  useEffect(() => {
    // Init local data.
    const unreadNotice = getStorage(STORAGE_KEY_UNREAD_NOTICE);
    dispatch(setUnreadNoticeFlag(!!unreadNotice));
    dispatch(
      setMetaMaskDisconnected(!!getStorage(STORAGE_KEY_DISCONNECT_METAMASK))
    );
    dispatch(setDarkMode(!!getStorage(STORAGE_KEY_DARK_MODE)));
  }, [dispatch]);

  useInterval(() => {
    dispatch(setUpdateFlag(dayjs().unix()));
  }, 6000); // 6s

  const aprResult = useQuery<null>({
    queryKey: ["getLsdTokenApr"],
    refetchInterval: 10 * 1000,
    queryFn: async () => {
      dispatch(updateApr());
      return null;
    },
  });

  const rateResult = useQuery<null>({
    queryKey: ["getLsdTokenRate"],
    refetchInterval: 10 * 1000,
    queryFn: async () => {
      try {
        const rate = await readContract(wagmiConfig, {
          address: getStakeManagerAddress() as `0x${string}`,
          abi: getStakeManagerAbi(),
          functionName: "getRate",
        });
        dispatch(setRate(Number(rate) / 10 ** 18 + ""));
      } catch (err: any) {
        console.log(err);
      }
      return null;
    },
  });
}
