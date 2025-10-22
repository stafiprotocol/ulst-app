import classNames from 'classnames';
import { roboto700 } from 'config/font';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

interface Props {
	selectedTab: 'stake' | 'unstake' | 'withdraw';
	onChangeTab: (tab: 'stake' | 'unstake' | 'withdraw') => void;
	showWithdrawTab?: boolean;
}

export const DashboardTabs = (props: Props) => {
	const router = useRouter();
	const { showWithdrawTab } = props;

	const showWithdraw = useMemo(() => {
		return showWithdrawTab || router.query.tab === 'withdraw';
	}, [router.query, showWithdrawTab]);

	const curTab = useMemo(() => {
		if (props.selectedTab === 'withdraw') return 'withdraw';
		return 'stake';
	}, [props.selectedTab]);

	return (
		<div
			className={classNames(
				'p-[.04rem] h-[.42rem] grid items-stretch bg-bg2 rounded-[.3rem] w-[2.2rem] 2xl:translate-x-[.68rem]'
			)}
			style={{
				gridTemplateColumns: '40% 60%',
			}}
		>
			<div
				className={classNames(
					'cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.3rem]',
					curTab === 'stake'
						? 'text-textHighlight bg-bgHighlight'
						: 'text-text1',
					curTab === 'stake' ? roboto700.className : ''
				)}
				onClick={() => props.onChangeTab('stake')}
			>
				Stake
			</div>

			{showWithdraw && (
				<div className="flex items-stretch">
					<div className="ml-[.1rem] w-[0.01rem] h-[.22rem] bg-bg2 self-center" />
					<div
						className={classNames(
							'flex-1 ml-[.1rem] cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.3rem]',
							curTab === 'withdraw'
								? 'text-textHighlight bg-bgHighlight'
								: 'text-text1',
							curTab === 'withdraw' ? roboto700.className : ''
						)}
						onClick={() => props.onChangeTab('withdraw')}
					>
						Withdraw
					</div>
				</div>
			)}
		</div>
	);
};
