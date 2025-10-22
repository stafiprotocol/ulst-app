import classNames from 'classnames';
import { useMemo } from 'react';
import { LsdTokenStake } from './LsdTokenStake';
import { LsdTokenUnstake } from './LsdTokenUnstake';
import { useRouter } from 'next/router';
import styles from 'styles/CustomButton.module.css';
import { roboto700 } from 'config/font';
import { allTokens, getStableCoins } from 'config/env';
import { Token } from 'interfaces/token';

export const StakePage = () => {
	const router = useRouter();

	const selectedTab = useMemo(() => {
		const tabParam = router.query.tab;
		if (tabParam) {
			switch (tabParam) {
				case 'stake':
				case 'unstake':
				case 'trade':
				case 'bridge':
				case 'withdraw':
					return tabParam;
				default:
					return 'stake';
			}
		}
		return 'stake';
	}, [router.query]);

	const curToken = useMemo(() => {
		const { token: tokenName } = router.query;
		const token = getStableCoins().find((t) => t.name === tokenName);
		if (!tokenName || !token) return getStableCoins()[0];
		return token;
	}, [router.query]);

	const updateTab = (tab: string) => {
		router.replace({
			pathname: router.pathname,
			query: {
				...router.query,
				tab,
			},
		});
	};

	return (
		<div className="bg-bg2 rounded-[.3rem] pb-[.14rem] border-[.01rem] border-border1">
			<div
				className="h-[.56rem] grid items-stretch"
				style={{ gridTemplateColumns: '50% 50%' }}
			>
				<div
					className={classNames(
						'cursor-pointer flex items-center justify-center rounded-tl-[.3rem] text-[.16rem] border-[0.01rem] text-[#222c3c]',
						selectedTab === 'stake' ? 'border-[#80CAFF]' : 'border-white',
						selectedTab === 'stake' ? roboto700.className : ''
					)}
					style={{
						background:
							selectedTab === 'stake'
								? 'linear-gradient(95.88deg, #C6F4D7 38.7%, #80CAFF 137.09%)'
								: '#ffffff',
						borderRightWidth: selectedTab === 'stake' ? '0.01rem' : '0px',
					}}
					onClick={() => {
						updateTab('stake');
					}}
				>
					Stake
				</div>

				<div
					className={classNames(
						'cursor-pointer flex items-center justify-center rounded-tr-[.3rem] text-[.16rem] border-[0.01rem] text-[#222c3c]',
						selectedTab === 'unstake' ? 'border-[#80CAFF]' : 'border-white',
						selectedTab === 'unstake' ? roboto700.className : ''
					)}
					style={{
						background:
							selectedTab === 'unstake'
								? 'linear-gradient(95.88deg, #C6F4D7 38.7%, #80CAFF 137.09%)'
								: '#ffffff',
						borderLeftWidth: selectedTab === 'unstake' ? '0.01rem' : '0px',
					}}
					onClick={() => {
						updateTab('unstake');
					}}
				>
					Unstake
				</div>
			</div>

			{selectedTab === 'stake' && <LsdTokenStake curToken={curToken} />}

			{selectedTab === 'unstake' && <LsdTokenUnstake />}
		</div>
	);
};
