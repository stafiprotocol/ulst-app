import classNames from 'classnames';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import Image from 'next/image';
import checkFileError from 'public/images/tx_error.png';
import checkFileSuccess from 'public/images/tx_success.png';
import loading from 'public/images/loading.svg';
import { updateUnstakeLoadingParams } from 'redux/reducers/AppSlice';
import commonStyles from 'styles/Common.module.scss';

export const UnstakeLoadingSidebar = () => {
	const dispatch = useAppDispatch();
	const { unstakeLoadingParams } = useAppSelector((state) => state.app);

	return (
		<div
			className={classNames(
				'mt-[.2rem] rounded-l-[.16rem] h-[.7rem] w-[1.9rem] flex items-center cursor-pointer border-solid border-[0.01rem] border-border1 bg-[#ffffff80]',
				{
					hidden:
						unstakeLoadingParams?.modalVisible === true ||
						!unstakeLoadingParams,
				}
			)}
			style={{
				backdropFilter: 'blur(.13rem)',
				zIndex: 2000,
			}}
			onClick={() => {
				dispatch(updateUnstakeLoadingParams({ modalVisible: true }));
			}}
		>
			<div
				className={classNames(
					'ml-[.16rem] relative w-[.32rem] h-[.32rem]',
					unstakeLoadingParams?.status === 'loading' ? commonStyles.loading : ''
				)}
			>
				<Image
					src={
						unstakeLoadingParams?.status === 'success'
							? checkFileSuccess
							: unstakeLoadingParams?.status === 'error'
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
					unstakeLoadingParams?.status === 'success'
						? 'text-text2'
						: unstakeLoadingParams?.status === 'error'
						? 'text-error'
						: 'text-text2'
				)}
			>
				Unstake
				<br />
				{unstakeLoadingParams?.status === 'success'
					? 'Succeed'
					: unstakeLoadingParams?.status === 'error'
					? 'Failed'
					: 'Operating'}
			</div>

			<div className="ml-[.2rem] rotate-90">
				<Icomoon icon="right" color="#6C86AD" size=".16rem" />
			</div>
		</div>
	);
};
