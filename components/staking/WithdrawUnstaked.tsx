import { CustomButton } from '../common/CustomButton';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { formatNumber } from 'utils/numberUtils';
import { useMemo } from 'react';
import { handleTokenWithdraw, WithdrawInfo } from 'redux/reducers/TokenSlice';
import { formatWithdrawRemaingTime } from 'utils/timeUtils';
import classNames from 'classnames';
import { roboto500 } from 'config/font';
import { useRouter } from 'next/router';
import { getStableCoins } from 'config/env';

interface Props {
	withdrawInfo: WithdrawInfo;
}

export const WithdrawUnstaked = (props: Props) => {
	const { withdrawInfo } = props;

	const router = useRouter();

	const dispatch = useAppDispatch();

	const { withdrawLoading } = useAppSelector((state) => state.app);

	const withdrawDisabled = useMemo(() => {
		return (
			isNaN(Number(withdrawInfo.avaiableWithdraw)) ||
			Number(withdrawInfo.avaiableWithdraw) <= 0 ||
			withdrawLoading
		);
	}, [withdrawInfo, withdrawLoading]);

	const clickWithdraw = () => {
		if (withdrawDisabled || !withdrawInfo.avaiableWithdraw) {
			return;
		}
		dispatch(
			handleTokenWithdraw(withdrawInfo.avaiableWithdraw, true, (success) => {
				if (success) {
					router.push('/');
				}
			})
		);
	};

	return (
		<div className="mt-[.18rem] bg-bg2 rounded-[.3rem] border-border1 border-[.01rem]">
			<div className="mt-[.28rem] mx-[.24rem] flex items-center justify-between">
				<div className="flex items-center">
					<div className="flex items-center cursor-pointer">
						<div className={classNames('text-[.14rem] text-text2')}>
							Withdraw Amount
						</div>
					</div>
					<div
						className={classNames(
							roboto500.className,
							'text-[.16rem] text-text1 ml-[.12rem] mt-[.02rem]'
						)}
					>
						{formatNumber(withdrawInfo.overallAmount)}{' '}
						{getStableCoins()[0].name}
					</div>
				</div>
				<div className="flex items-center">
					<div className={classNames('text-[.14rem] text-text2')}>
						Est. Remaining Lock Time
					</div>
					<div
						className={classNames(
							roboto500.className,
							'text-[.16rem] text-text1 ml-[.12rem] mt-[.02rem]'
						)}
					>
						{formatWithdrawRemaingTime(Number(withdrawInfo.remainingTime))}
					</div>
				</div>
			</div>

			<div className="mt-[.24rem] mx-[.24rem] flex items-center justify-center relative h-[.77rem] rounded-[.12rem] bg-bgPage">
				<div
					className={classNames(
						roboto500.className,
						'text-[.14rem] text-text1 absolute left-[.23rem]'
					)}
				>
					Withdrawable Now
				</div>
				<div className={classNames('text-[.24rem] text-text2')}>
					{formatNumber(withdrawInfo.avaiableWithdraw)}{' '}
					{getStableCoins()[0].name}
				</div>
			</div>

			<div className="mt-[.24rem] mx-[.24rem] mb-[.32rem]">
				<CustomButton
					type="primary"
					height=".56rem"
					disabled={withdrawDisabled}
					loading={withdrawLoading}
					border="none"
					onClick={() => {
						clickWithdraw();
					}}
				>
					Withdraw
				</CustomButton>
			</div>
		</div>
	);
};
