import classNames from 'classnames';
import stakeIcon from 'public/images/notice/notice_stake.svg';
import unstakeIcon from 'public/images/notice/notice_unstake.svg';
import withdrawIcon from 'public/images/notice/notice_withdraw.svg';
import {
	LocalNotice,
	NoticeStakeData,
	NoticeUnstakeData,
	NoticeWithdrawData,
} from 'utils/noticeUtils';
import { formatNumber } from 'utils/numberUtils';
import { formatDate } from 'utils/timeUtils';
import { openLink } from 'utils/commonUtils';
import Image from 'next/image';
import { getLsdTokenName } from 'utils/configUtils';
import { getExplorerTxUrl } from 'config/explorer';

export const NoticeItem = (props: { notice: LocalNotice }) => {
	const { notice } = props;

	const getNoticeIcon = (notice: LocalNotice): any => {
		switch (notice.type) {
			case 'Unstake':
				return unstakeIcon;
			case 'Withdraw':
				return withdrawIcon;
			default:
				return stakeIcon;
		}
	};

	const getNoticeStatus = (notice: LocalNotice): string => {
		switch (notice.status) {
			case 'Confirmed':
				return 'Succeed';
			case 'Error':
				return 'Failed';
			default:
				return notice.status;
		}
	};

	const getNoticeContent = (notice: LocalNotice): string => {
		try {
			let data;
			if (notice.type === 'Stake') {
				data = notice.data as NoticeStakeData;
				return `Stake ${formatNumber(data.amount)} ${
					data.tokenName
				} from your Wallet to LSD Pool Contract, and receive ${formatNumber(
					data.willReceiveAmount
				)} ${getLsdTokenName()}.`;
			} else if (notice.type === 'Unstake') {
				data = notice.data as NoticeUnstakeData;
				return `Unstake ${formatNumber(
					data.amount
				)} ${getLsdTokenName()} from LSD Pool Contract to your wallet.`;
			} else {
				data = notice.data as NoticeWithdrawData;
				return `Withdraw ${formatNumber(data.amount)} ${getLsdTokenName()}.`;
			}
		} catch (err: unknown) {
			return '';
		}
	};

	const onClickItem = () => {
		if (!notice.txHash) return;
		openLink(getExplorerTxUrl(notice.txHash));
	};

	return (
		<div className={classNames()}>
			<div
				className={classNames(
					'cursor-pointer mt-[.08rem] p-[.16rem] bg-[#6C86AD14] rounded-[.12rem]'
				)}
				onClick={() => {
					onClickItem();
				}}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center justify-start">
						<div className="w-[.34rem] h-[.34rem] relative">
							<Image src={getNoticeIcon(notice)} alt="icon" layout="fill" />
						</div>

						<div className="ml-[.12rem] font-[700] text-[#222c3c] text-[.16rem]">
							{notice.type}
						</div>

						<div
							className={classNames(
								'ml-[.06rem] h-[.2rem] rounded-[.04rem] px-[.04rem] flex items-center text-[.12rem]',
								notice.status === 'Confirmed'
									? 'bg-bgSuccess text-white'
									: notice.status === 'Error'
									? 'bg-[#FEA4FF80] text-error'
									: 'bg-text2/20 text-white'
							)}
						>
							{getNoticeStatus(notice)}
						</div>
					</div>

					<div className="text-[#6C86AD] text-[.14rem] opacity-50">
						{formatDate(notice.timestamp || 0, 'DD MMM HH:mm')}
					</div>
				</div>

				<div className="mt-[.1rem]">
					<div className="text-[#6C86AD] text-[.14rem] leading-normal">
						{getNoticeContent(notice)}
					</div>
				</div>
			</div>
		</div>
	);
};
