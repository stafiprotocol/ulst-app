import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from 'redux/store';
import {
	decodeBalancesUpdatedLog,
	getErc20AssetBalance,
	getWeb3,
} from 'utils/web3Utils';
import { getStakeManagerAbi, getStakeManagerAddress } from 'config/contract';
import { getDefaultApr } from 'utils/configUtils';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from 'connectors/walletConnect';

export interface LsdTokenState {
	balance: string | undefined; // balance of lsdToken
	rate: string | undefined; // rate of lsdToken to Token
	apr: number | undefined; // lsdToken apr
	price: string | undefined; // price of lsdToken
	unbondingDuration: number | undefined;
	lsdTokenPrice: number | undefined;
}

const initialState: LsdTokenState = {
	balance: undefined,
	rate: undefined,
	apr: undefined,
	price: undefined,
	unbondingDuration: undefined,
	lsdTokenPrice: undefined,
};

export const lsdTokenSlice = createSlice({
	name: 'lsdToken',
	initialState,
	reducers: {
		setBalance: (
			state: LsdTokenState,
			action: PayloadAction<string | undefined>
		) => {
			state.balance = action.payload;
		},
		setRate: (state: LsdTokenState, action: PayloadAction<string>) => {
			state.rate = action.payload;
		},
		setPrice: (state: LsdTokenState, action: PayloadAction<string>) => {
			state.price = action.payload;
		},
		setApr: (state: LsdTokenState, action: PayloadAction<number>) => {
			state.apr = action.payload;
		},
		setUnbondingDuration: (
			state: LsdTokenState,
			action: PayloadAction<number>
		) => {
			state.unbondingDuration = action.payload;
		},
		setLsdTokenPrice: (state: LsdTokenState, aciton: PayloadAction<number>) => {
			state.lsdTokenPrice = aciton.payload;
		},
	},
});

export const {
	setBalance,
	setRate,
	setPrice,
	setApr,
	setUnbondingDuration,
	setLsdTokenPrice,
} = lsdTokenSlice.actions;

export default lsdTokenSlice.reducer;

export const clearLsdTokenBalance =
	(): AppThunk => async (dispatch, getState) => {
		dispatch(setBalance(undefined));
	};

/**
 * update lsdToken balance
 */
export const updateLsdTokenBalance =
	(): AppThunk => async (dispatch, getState) => {
		try {
			// const metaMaskAccount = getState().wallet.metaMaskDisconnected
			// 	? undefined
			// 	: getState().wallet.metaMaskAccount;
			// const tokenAbi = getLsdTokenContractAbi();
			// const tokenAddress = getLsdTokenContract();
			// const newBalance = await getErc20AssetBalance(
			// 	metaMaskAccount,
			// 	tokenAbi,
			// 	tokenAddress
			// );
			// dispatch(setBalance(newBalance));
		} catch (err: unknown) {}
	};

/**
 * query lsdToken to token's rate
 */
export const updateLsdTokenRate =
	(): AppThunk => async (dispatch, getState) => {
		try {
			// let newRate = '--';
			// const web3 = getWeb3();
			// let contract = new web3.eth.Contract(
			// 	getStakeManagerContractAbi(),
			// 	getStakeManagerContract()
			// );
			// const result = await contract.methods.getRate().call();
			// newRate = web3.utils.fromWei(result + '', 'ether');
			// dispatch(setRate(newRate));
		} catch (err: unknown) {
			console.log(err);
		}
	};

/**
 * query apr of lsdToken
 */
export const updateApr = (): AppThunk => async (dispatch, getState) => {
	let apr = getDefaultApr();
	try {
		const currentEra = await readContract(wagmiConfig, {
			address: getStakeManagerAddress() as `0x${string}`,
			abi: getStakeManagerAbi(),
			functionName: 'currentEra',
		});
		if (!currentEra || Number(currentEra) <= 3) throw new Error();

		const eraSeconds = await readContract(wagmiConfig, {
			address: getStakeManagerAddress() as `0x${string}`,
			abi: getStakeManagerAbi(),
			functionName: 'eraSeconds',
		});
		if (!eraSeconds) throw new Error();

		let eraLength = 7;
		if (Number(currentEra) < eraLength + 3) {
			eraLength = 1;
		}
		// 7 days before
		const numEras = (60 * 60 * 24 * 7) / Number(eraSeconds);
		const beginRate = await readContract(wagmiConfig, {
			address: getStakeManagerAddress() as `0x${string}`,
			abi: getStakeManagerAbi(),
			functionName: 'eraRate',
			args: [Number(currentEra) - eraLength - 1],
		});
		const endRate = await readContract(wagmiConfig, {
			address: getStakeManagerAddress() as `0x${string}`,
			abi: getStakeManagerAbi(),
			functionName: 'eraRate',
			args: [Number(currentEra) - 1],
		});
		const timeDiff = Number(eraSeconds) * eraLength;
		if (
			!isNaN(Number(beginRate)) &&
			!isNaN(Number(endRate)) &&
			endRate !== 1 &&
			beginRate !== 1 &&
			beginRate !== endRate
		) {
			apr =
				(365.25 * 24 * 60 * 60 * (Number(endRate) - Number(beginRate)) * 100) /
				Number(beginRate) /
				timeDiff;
		}
		dispatch(setApr(apr));
	} catch (err: any) {
		dispatch(setApr(apr));
	}
};

/**
 * query unbonding duration from stake manager contract
 */
export const updateLsdTokenUnbondingDuration =
	(): AppThunk => async (dispatch, getState) => {
		try {
			const unbondingDuration = await readContract(wagmiConfig, {
				address: getStakeManagerAddress() as `0x${string}`,
				abi: getStakeManagerAbi(),
				functionName: 'unbondingDuration',
			});
			const eraSeconds = await readContract(wagmiConfig, {
				address: getStakeManagerAddress() as `0x${string}`,
				abi: getStakeManagerAbi(),
				functionName: 'eraSeconds',
			});
			if (!eraSeconds) return;
			dispatch(
				setUnbondingDuration(Number(unbondingDuration) * Number(eraSeconds))
			);
		} catch (err: any) {
			console.log(err);
		}
	};
