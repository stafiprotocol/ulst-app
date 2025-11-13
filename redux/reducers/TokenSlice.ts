import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  getAaveStakeManagerAbi,
  getErc20Abi,
  getLsdTokenAbi,
  getLsdTokenAddress,
  getStakeManagerAddress,
} from 'config/contract';
import { AppThunk } from 'redux/store';
import { isMetaMaskCancelError, uuid } from 'utils/commonUtils';
import {
  BLOCK_HASH_NOT_FOUND_MESSAGE,
  CANCELLED_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  TRANSACTION_FAILED_MESSAGE,
} from 'constants/common';
import { LocalNotice } from 'utils/noticeUtils';
import { fromChainAmount, toChainAmount } from 'utils/numberUtils';
import snackbarUtil from 'utils/snackbarUtils';
import { getMetaMaskTxErrorMsg, getWeb3 } from 'utils/web3Utils';
import Web3 from 'web3';
import {
  addNotice,
  setStakeLoadingParams,
  setUnstakeLoadingParams,
  setStakeLoading,
  setUnstakeLoading,
  setWithdrawLoading,
  setWithdrawLoadingParams,
  updateStakeLoadingParams,
  updateWithdrawLoadingParams,
  updateUnstakeLoadingParams,
} from './AppSlice';
import BN, { max } from 'bn.js';
import { toBN, toWei } from 'web3-utils';
import { wagmiConfig } from 'connectors/walletConnect';
import {
  getAccount,
  readContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import { StableCoin } from 'config/env';

export interface WithdrawInfo {
  overallAmount: string | undefined;
  avaiableWithdraw: string | undefined;
  remainingTime: number | undefined;
}

export interface RelayFee {
  stake: string | undefined;
  unstake: string | undefined;
  withdraw: string | undefined;
}

export interface DecimalsStore {
  [address: string]: number;
}

export interface TokenState {
  balance: string | undefined;
  currentNodeDepositAmount: string | undefined;
  latestBlockTimestamp: string;
  withdrawInfo: WithdrawInfo;
  relayFee: RelayFee;
  tokenPrice: number | undefined;
  ethPrice: number | undefined;
  decimalsStore: DecimalsStore;
}

const initialState: TokenState = {
  balance: undefined,
  currentNodeDepositAmount: undefined,
  latestBlockTimestamp: '0',
  withdrawInfo: {
    overallAmount: undefined,
    avaiableWithdraw: undefined,
    remainingTime: undefined,
  },
  relayFee: {
    stake: undefined,
    unstake: undefined,
    withdraw: undefined,
  },
  tokenPrice: undefined,
  ethPrice: undefined,
  decimalsStore: {},
};

export const tokenSlice = createSlice({
  name: 'token',
  initialState,
  reducers: {
    setTokenBalance: (
      state: TokenState,
      action: PayloadAction<string | undefined>
    ) => {
      state.balance = action.payload;
    },
    setCurrentNodeDepositAmount: (
      state: TokenState,
      action: PayloadAction<string>
    ) => {
      state.currentNodeDepositAmount = action.payload;
    },
    setLatestBlockTimestamp: (
      state: TokenState,
      action: PayloadAction<string>
    ) => {
      state.latestBlockTimestamp = action.payload;
    },
    setWithdrawInfo: (
      state: TokenState,
      action: PayloadAction<WithdrawInfo>
    ) => {
      state.withdrawInfo = action.payload;
    },
    setRelayFee: (state: TokenState, action: PayloadAction<RelayFee>) => {
      state.relayFee = action.payload;
    },
    setTokenPrice: (state: TokenState, action: PayloadAction<number>) => {
      state.tokenPrice = action.payload;
    },
    setEthPrice: (state: TokenState, action: PayloadAction<number>) => {
      state.ethPrice = action.payload;
    },
    setDecimalsStore: (
      state: TokenState,
      action: PayloadAction<{ address: string; decimals: number }>
    ) => {
      const { address, decimals } = action.payload;
      state.decimalsStore = {
        ...state.decimalsStore,
        [address]: decimals,
      };
    },
  },
});

export const {
  setTokenBalance,
  setCurrentNodeDepositAmount,
  setLatestBlockTimestamp,
  setWithdrawInfo,
  setRelayFee,
  setTokenPrice,
  setEthPrice,
  setDecimalsStore,
} = tokenSlice.actions;

export default tokenSlice.reducer;

/**
 * update evm token balance
 */
export const updateTokenBalance =
  (): AppThunk => async (dispatch, getState) => {
    const metaMaskAccount = getState().wallet.metaMaskAccount;
    if (!metaMaskAccount) {
      dispatch(setTokenBalance(undefined));
      return;
    }

    let web3 = getWeb3();
    try {
      const balance = await web3.eth.getBalance(metaMaskAccount);
      dispatch(
        setTokenBalance(Web3.utils.fromWei(balance.toString(), 'ether'))
      );
    } catch (err: unknown) {}
  };

export const handleTokenStake =
  (
    stableCoin: StableCoin,
    stakeAmount: string,
    willReceiveAmount: string,
    newLsdTokenBalance: string,
    isReTry: boolean,
    cb?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const { address } = getAccount(wagmiConfig);
    if (!address) return;

    const noticeUuid = isReTry
      ? getState().app.stakeLoadingParams?.noticeUuid
      : uuid();

    let txHash: string;
    let shouldAddNotice = false;

    try {
      dispatch(setStakeLoading(true));
      dispatch(
        setStakeLoadingParams({
          stableCoin,
          modalVisible: true,
          noticeUuid,
          status: 'loading',
          amount: stakeAmount,
          willReceiveAmount,
          newLsdTokenBalance,
          msg: `Please confirm the ${stakeAmount} ${stableCoin.name} staking transaction in your wallet`,
        })
      );

      const allowance = await readContract(wagmiConfig, {
        address: stableCoin.address as `0x${string}`,
        abi: getErc20Abi(),
        functionName: 'allowance',
        args: [address, getStakeManagerAddress()],
      });

      let decimals = getState().token.decimalsStore[stableCoin.address];
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

      const amount = toChainAmount(stakeAmount, decimals);

      if (amount.gt(toBN(allowance + ''))) {
        const approveAmount = toChainAmount(
          Math.max(10000000, Number(stakeAmount)),
          decimals
        );
        const result = await writeContract(wagmiConfig, {
          functionName: 'approve',
          address: stableCoin.address as `0x${string}`,
          abi: getErc20Abi(),
          args: [getStakeManagerAddress(), approveAmount],
        });
        const txReceipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: result,
        });
        if (
          !txReceipt ||
          txReceipt.status !== 'success' ||
          !txReceipt.blockHash
        ) {
          throw new Error(getMetaMaskTxErrorMsg(txReceipt));
        }
      }

      shouldAddNotice = true;
      const result = await writeContract(wagmiConfig, {
        functionName: 'stake',
        address: getStakeManagerAddress() as `0x${string}`,
        abi: getAaveStakeManagerAbi(),
        args: [stableCoin.address, amount],
      });
      const txReceipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: result,
      });

      if (
        !txReceipt ||
        txReceipt.status !== 'success' ||
        !txReceipt.blockHash
      ) {
        throw new Error(getMetaMaskTxErrorMsg(txReceipt));
      }

      const blockHash = txReceipt.blockHash;
      if (!blockHash) {
        throw new Error(BLOCK_HASH_NOT_FOUND_MESSAGE);
      }

      txHash = txReceipt.transactionHash;
      dispatch(
        updateStakeLoadingParams(
          {
            status: 'success',
            txHash: txHash,
            msg: undefined,
          },
          (newParams) => {
            const newNotice: LocalNotice = {
              id: noticeUuid || uuid(),
              type: 'Stake',
              data: {
                amount: Number(stakeAmount) + '',
                willReceiveAmount: Number(willReceiveAmount) + '',
                tokenName: stableCoin.name,
              },
              txHash,
              status: 'Confirmed',
            };
            dispatch(addNotice(newNotice));
          }
        )
      );
      dispatch(setStakeLoading(false));
      cb && cb(true);
    } catch (err: any) {
      console.log(err);
      cb && cb(false);
      dispatch(setStakeLoading(false));
      let displayMsg = TRANSACTION_FAILED_MESSAGE;
      if (err.code === -32603) {
        displayMsg = CONNECTION_ERROR_MESSAGE;
      } else if (isMetaMaskCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setStakeLoadingParams(undefined));
        return;
      }
      dispatch(
        updateStakeLoadingParams(
          {
            status: 'error',
            msg: displayMsg,
          },
          (newParams) => {
            if (!shouldAddNotice) return;
            dispatch(
              addNotice({
                id: noticeUuid || uuid(),
                type: 'Stake',
                data: {
                  amount: Number(stakeAmount) + '',
                  willReceiveAmount: Number(willReceiveAmount) + '',
                  tokenName: stableCoin.name,
                },
                status: 'Error',
                txHash,
              })
            );
          }
        )
      );
    } finally {
      dispatch(updateTokenBalance());
    }
  };

/**
 * unstake lsdToken
 * @param unstakeAmount unstake lsdToken amount
 * @param willReceiveAmount will receive token amount
 * @param newLsdTokenBalance new lsdToken balance after unstaking
 * @param isReTry is retry unstaking
 * @param cb callback function
 */
export const handleLsdTokenUnstake =
  (
    stableCoin: StableCoin,
    unstakeAmount: string,
    willReceiveAmount: string,
    newLsdTokenBalance: string,
    isReTry: boolean,
    cb?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const metaMaskAccount = getState().wallet.metaMaskAccount;
    if (!metaMaskAccount) return;

    const noticeUuid = isReTry
      ? getState().app.unstakeLoadingParams?.noticeUuid
      : uuid();

    dispatch(setUnstakeLoading(true));

    let txHash: string;
    let shouldAddNotice = false;

    try {
      // const web3 = createWeb3();
      dispatch(
        setUnstakeLoadingParams({
          modalVisible: true,
          status: 'loading',
          amount: unstakeAmount,
          willReceiveAmount,
          newLsdTokenBalance,
          stableCoin,
        })
      );

      let decimals = getState().token.decimalsStore[getLsdTokenAddress()];
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

      const amount = toChainAmount(unstakeAmount, decimals);

      const allowance = await readContract(wagmiConfig, {
        address: getLsdTokenAddress() as `0x${string}`,
        abi: getLsdTokenAbi(),
        functionName: 'allowance',
        args: [metaMaskAccount, getStakeManagerAddress()],
      });

      if (amount.gt(toBN(allowance + ''))) {
        const approveAmount = toChainAmount(
          Math.max(10000000, Number(unstakeAmount)),
          decimals
        );
        const result = await writeContract(wagmiConfig, {
          functionName: 'approve',
          address: getLsdTokenAddress() as `0x${string}`,
          abi: getLsdTokenAbi(),
          args: [getStakeManagerAddress(), approveAmount],
        });
        await waitForTransactionReceipt(wagmiConfig, {
          hash: result,
        });
      }

      shouldAddNotice = true;
      const result = await writeContract(wagmiConfig, {
        address: getStakeManagerAddress() as `0x${string}`,
        abi: getAaveStakeManagerAbi(),
        functionName: 'unstake',
        args: [stableCoin.address, amount],
      });

      const unstakeTxReceipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: result,
      });

      if (
        !unstakeTxReceipt ||
        unstakeTxReceipt.status !== 'success' ||
        !unstakeTxReceipt.blockHash
      ) {
        throw new Error(getMetaMaskTxErrorMsg(unstakeTxReceipt));
      }

      const blockHash = unstakeTxReceipt.blockHash;
      if (!blockHash) {
        throw new Error(BLOCK_HASH_NOT_FOUND_MESSAGE);
      }

      txHash = unstakeTxReceipt.transactionHash;
      console.log({ txHash });
      dispatch(
        updateUnstakeLoadingParams({
          status: 'success',
          txHash: txHash,
        })
      );
      const newNotice: LocalNotice = {
        id: noticeUuid || uuid(),
        type: 'Unstake',
        data: {
          amount: unstakeAmount,
          willReceiveAmount: willReceiveAmount,
        },
        txHash,
        status: 'Confirmed',
      };
      dispatch(addNotice(newNotice));
      dispatch(setUnstakeLoading(false));
      cb && cb(true);
    } catch (err: any) {
      cb && cb(false);
      dispatch(setUnstakeLoading(false));
      // snackbarUtil.error(err.message);
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (err.code === -32603) {
        displayMsg = CONNECTION_ERROR_MESSAGE;
      } else if (isMetaMaskCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setUnstakeLoadingParams(undefined));
        return;
      }
      dispatch(
        updateUnstakeLoadingParams(
          {
            status: 'error',
            customMsg: displayMsg || 'Unstake failed',
          },
          () => {
            if (!shouldAddNotice) return;
            dispatch(
              addNotice({
                id: noticeUuid || uuid(),
                type: 'Stake',
                data: {
                  amount: unstakeAmount,
                  willReceiveAmount: willReceiveAmount,
                },
                status: 'Error',
                txHash,
              })
            );
          }
        )
      );
    } finally {
      dispatch(updateTokenBalance());
    }
  };

interface LsdTokenUnstakeInfo {
  amount: string;
  era: string;
}

/**
 * update user withdraw info
 */
export const updateLsdTokenUserWithdrawInfo =
  (): AppThunk => async (dispatch, getState) => {
    const metaMaskAccount = getState().wallet.metaMaskAccount;
    if (!metaMaskAccount) return;

    const unbondingDuration = getState().lsdToken.unbondingDuration;
    if (!unbondingDuration) {
      return;
    }

    try {
      const web3 = getWeb3();
      const stakeManagerContract = new web3.eth.Contract(
        getAaveStakeManagerAbi(),
        getStakeManagerAddress(),
        { from: metaMaskAccount }
      );

      const eraSeconds = await stakeManagerContract.methods.eraSeconds().call();

      const unstakeIndexList = await stakeManagerContract.methods
        .getUnstakeIndexListOf(metaMaskAccount)
        .call();
      // console.log(unstakeIndexList);
      if (!Array.isArray(unstakeIndexList)) {
        // console.log("unstake index list error");
        return;
      }
      let avaiableWithdrawAmount: BN = new BN(0);
      let overallWithdrawAmount: BN = new BN(0);

      const currentEra = await stakeManagerContract.methods.currentEra().call();
      let remainingEra = 0;

      for (let i = 0; i < unstakeIndexList.length; i++) {
        const unstakeInfo: LsdTokenUnstakeInfo =
          await stakeManagerContract.methods
            .unstakeAtIndex(unstakeIndexList[i])
            .call();
        overallWithdrawAmount = overallWithdrawAmount.add(
          web3.utils.toBN(unstakeInfo.amount)
        );
        // console.log(unstakeInfo.era, unbondingDuration, currentEra, eraSeconds);
        if (
          Number(unstakeInfo.era) +
            Number(unbondingDuration) / Number(eraSeconds) >
          Number(currentEra)
        ) {
          remainingEra = Math.max(
            remainingEra,
            Number(unstakeInfo.era) +
              Number(unbondingDuration) / Number(eraSeconds) -
              Number(currentEra)
          );
          continue;
        }
        avaiableWithdrawAmount = avaiableWithdrawAmount.add(
          web3.utils.toBN(unstakeInfo.amount)
        );
      }

      let decimals = getState().token.decimalsStore[getLsdTokenAddress()];
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

      dispatch(
        setWithdrawInfo({
          avaiableWithdraw: fromChainAmount(
            avaiableWithdrawAmount.toString(),
            decimals
          ).toString(),
          overallAmount: fromChainAmount(
            overallWithdrawAmount.toString(),
            decimals
          ).toString(),
          remainingTime: remainingEra * Number(eraSeconds) * 1000,
        })
      );
    } catch (err: any) {}
  };

/**
 * withdraw unstaked token
 * @param amount withdraw amount
 */
export const handleTokenWithdraw =
  (
    amount: string,
    isReTry: boolean,
    cb?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const metaMaskAccount = getState().wallet.metaMaskAccount;
    if (!metaMaskAccount) {
      return;
    }

    const noticeUuid = isReTry
      ? getState().app.unstakeLoadingParams?.noticeUuid
      : uuid();

    let txHash: string;
    try {
      dispatch(setWithdrawLoading(true));
      dispatch(
        setWithdrawLoadingParams({
          modalVisible: true,
          status: 'loading',
          tokenAmount: amount,
        })
      );

      const withdrawResult = await writeContract(wagmiConfig, {
        address: getStakeManagerAddress() as `0x${string}`,
        abi: getAaveStakeManagerAbi(),
        functionName: 'withdraw',
        args: [],
      });
      const withdrawTxReceipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: withdrawResult,
      });

      if (
        !withdrawTxReceipt ||
        withdrawTxReceipt.status !== 'success' ||
        !withdrawTxReceipt.blockHash
      ) {
        throw new Error(getMetaMaskTxErrorMsg(withdrawTxReceipt));
      }

      const blockHash = withdrawTxReceipt.blockHash;
      if (!blockHash) {
        throw new Error(BLOCK_HASH_NOT_FOUND_MESSAGE);
      }

      txHash = withdrawTxReceipt.transactionHash;
      dispatch(
        updateWithdrawLoadingParams(
          {
            status: 'success',
            txHash: txHash,
            customMsg: undefined,
          },
          (newParams) => {
            dispatch(
              addNotice({
                id: uuid(),
                type: 'Withdraw',
                data: {
                  amount: amount,
                },
                txHash,
                status: 'Confirmed',
              })
            );
          }
        )
      );
      dispatch(setWithdrawLoading(false));
      cb && cb(true);
    } catch (err: any) {
      cb && cb(false);
      dispatch(setWithdrawLoading(false));
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (err.code === -32603) {
        displayMsg = CONNECTION_ERROR_MESSAGE;
      } else if (isMetaMaskCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setWithdrawLoadingParams(undefined));
        return;
      }
      dispatch(
        updateWithdrawLoadingParams(
          {
            status: 'error',
            customMsg: displayMsg || 'Unstake failed',
          },
          () => {
            dispatch(
              addNotice({
                id: noticeUuid || uuid(),
                type: 'Stake',
                data: {
                  amount,
                },
                status: 'Error',
                txHash,
              })
            );
          }
        )
      );
    } finally {
      dispatch(updateTokenBalance());
    }
  };
