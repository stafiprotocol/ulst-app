import { Box, Modal } from '@mui/material';
import classNames from 'classnames';
import { PrimaryLoading } from 'components/common/PrimaryLoading';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import Image from 'next/image';
import successIcon from 'public/images/tx_success.png';
import errorIcon from 'public/images/tx_error.png';
import { useMemo } from 'react';
import {
	setStakeLoadingParams,
	updateStakeLoadingParams,
} from 'redux/reducers/AppSlice';
import {
	handleTokenStake,
	updateTokenBalance,
} from 'redux/reducers/TokenSlice';
import { formatNumber } from 'utils/numberUtils';
import { roboto, roboto700 } from 'config/font';
import { getLsdTokenName } from 'utils/configUtils';
import { getExplorerTxUrl } from 'config/explorer';
import snackbarUtil from 'utils/snackbarUtils';
import { updateLsdTokenBalance } from 'redux/reducers/LsdTokenSlice';

export const StakeLoadingModal = () => {
	const dispatch = useAppDispatch();

	const { stakeLoadingParams } = useAppSelector((state) => state.app);

	const title = useMemo(() => {
		return stakeLoadingParams?.title
			? stakeLoadingParams.title
			: stakeLoadingParams?.status === 'success'
			? `Your new balance is ${formatNumber(
					stakeLoadingParams?.newLsdTokenBalance
			  )} ${getLsdTokenName()}`
			: stakeLoadingParams?.status === 'error'
			? 'Transaction Failed'
			: `You are now staking ${stakeLoadingParams?.amount} ${stakeLoadingParams?.stableCoin?.name}`;
	}, [stakeLoadingParams]);

	const secondaryMsg = useMemo(() => {
		return stakeLoadingParams?.msg
			? stakeLoadingParams.msg
			: stakeLoadingParams?.status === 'success'
			? `Staking operation was successful`
			: stakeLoadingParams?.status === 'error'
			? stakeLoadingParams?.msg || 'Something went wrong, please try again'
			: stakeLoadingParams?.msg ||
			  `Staking ${stakeLoadingParams?.amount} ${
					stakeLoadingParams?.stableCoin?.name
			  }, you will receive ${formatNumber(
					stakeLoadingParams?.willReceiveAmount
			  )} 
  ${getLsdTokenName()}`;
	}, [stakeLoadingParams]);

	const closeModal = () => {
		if (stakeLoadingParams?.status !== 'loading') {
			dispatch(setStakeLoadingParams(undefined));
		} else {
			dispatch(updateStakeLoadingParams({ modalVisible: false }));
		}
	};

	const clickRetry = () => {
		if (!stakeLoadingParams) {
			return;
		}
		const { amount, willReceiveAmount, newLsdTokenBalance, stableCoin } =
			stakeLoadingParams;
		if (!amount || !willReceiveAmount || !newLsdTokenBalance || !stableCoin) {
			snackbarUtil.error('Invalid parameters, please retry manually');
			return;
		}

		dispatch(
			handleTokenStake(
				stableCoin,
				amount,
				willReceiveAmount,
				newLsdTokenBalance,
				true,
				(success) => {
					dispatch(updateTokenBalance());
					if (success) {
						dispatch(updateLsdTokenBalance());
					}
				}
			)
		);
	};

	return (
		<Modal
			open={stakeLoadingParams?.modalVisible === true}
			onClose={closeModal}
		>
			<Box
				pt="0"
				sx={{
					backgroundColor: '#ffffff',
					width: '3.5rem',
					borderRadius: '0.16rem',
					outline: 'none',
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
				}}
			>
				<div
					className={classNames(
						'flex-1 flex flex-col items-center',
						roboto.className
					)}
				>
					<div
						className={classNames(
							'mr-[.24rem] self-end mt-[.24rem] cursor-pointer'
						)}
						onClick={closeModal}
					>
						<Icomoon icon="close" size=".16rem" color={'#6C86AD80'} />
					</div>

					{(stakeLoadingParams?.status === 'loading' ||
						!stakeLoadingParams?.status) && (
						<div className="mt-[.0rem] w-[.8rem] h-[.8rem]">
							<PrimaryLoading size=".8rem" />
						</div>
					)}

					{stakeLoadingParams?.status === 'success' && (
						<div className="mt-[.0rem] w-[.8rem] h-[.8rem] relative">
							<Image src={successIcon} alt="success" layout="fill" />
						</div>
					)}

					{stakeLoadingParams?.status === 'error' && (
						<div className="mt-[.0rem] w-[.8rem] h-[.8rem] relative">
							<Image src={errorIcon} alt="error" layout="fill" />
						</div>
					)}

					<div
						className={classNames(
							roboto700.className,
							'mx-[.36rem] mt-[.24rem] text-[.24rem] text-text1 text-center leading-tight'
						)}
					>
						{title}
					</div>

					<div
						className={classNames(
							'mx-[.36rem] mt-[.2rem] mb-[.32rem] leading-tight text-center text-[.16rem] text-text2'
						)}
						style={{
							maxLines: 3,
							WebkitLineClamp: 3,
							lineClamp: 3,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							display: '-webkit-box',
							WebkitBoxOrient: 'vertical',
						}}
					>
						{secondaryMsg}
					</div>

					{stakeLoadingParams?.status === 'error' ? (
						<div
							className="mb-[.32rem] text-color-link text-[.16rem] cursor-pointer"
							onClick={clickRetry}
						>
							Retry
						</div>
					) : (
						stakeLoadingParams?.txHash && (
							<a
								className="mb-[.32rem] flex items-center"
								href={getExplorerTxUrl(stakeLoadingParams.txHash)}
								target="_blank"
								rel="noreferrer"
							>
								<span className="text-link text-[.16rem] mr-[.12rem] font-[500]">
									View on explorer
								</span>

								<Icomoon icon="right" size=".12rem" color={'#5A5DE0'} />
							</a>
						)
					)}
				</div>
			</Box>
		</Modal>
	);
};
