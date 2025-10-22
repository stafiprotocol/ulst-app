import classNames from 'classnames';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import Image from 'next/image';
import checkFileError from 'public/images/tx_error.png';
import checkFileSuccess from 'public/images/tx_success.png';
import loading from 'public/images/loading.svg';
import { updateStakeLoadingParams } from 'redux/reducers/AppSlice';
import commonStyles from 'styles/Common.module.scss';

export const StakeLoadingSidebar = () => {
	const dispatch = useAppDispatch();

	const { stakeLoadingParams } = useAppSelector((state) => state.app);

	return (
		<div
			className={classNames(
				'mt-[.2rem] rounded-l-[.16rem] h-[.7rem] w-[1.9rem] flex items-center cursor-pointer border-solid border-[0.01rem] border-border1 bg-[#ffffff80]',
				{
					hidden:
						stakeLoadingParams?.modalVisible === true || !stakeLoadingParams,
				}
			)}
			style={{
				backdropFilter: 'blur(.13rem)',
				zIndex: 2000,
			}}
			onClick={() => {
				dispatch(updateStakeLoadingParams({ modalVisible: true }));
			}}
		>
			<div
				className={classNames(
					'ml-[.16rem] relative w-[.32rem] h-[.32rem]',
					stakeLoadingParams?.status === 'loading' ? commonStyles.loading : ''
				)}
			>
				<Image
					src={
						stakeLoadingParams?.status === 'success'
							? checkFileSuccess
							: stakeLoadingParams?.status === 'error'
							? checkFileError
							: loading
					}
					layout="fill"
					alt="loading"
				/>
			</div>

			<div
				className={classNames(
					'ml-[.16rem] text-[.16rem] leading-normal',
					stakeLoadingParams?.status === 'success'
						? 'text-text1'
						: stakeLoadingParams?.status === 'error'
						? 'text-error'
						: 'text-text2'
				)}
			>
				Stake
				<br />
				{stakeLoadingParams?.status === 'success'
					? 'Succeed'
					: stakeLoadingParams?.status === 'error'
					? 'Failed'
					: 'Operating'}
			</div>

			<div className="ml-[.2rem] rotate-90">
				<Icomoon icon="right" color="#6C86AD" size=".16rem" />
			</div>
		</div>
	);
};
