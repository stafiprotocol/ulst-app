import classNames from 'classnames';

type Props = React.PropsWithChildren<{}>;

export const PageTitleContainer = (props: Props) => {
	return (
		<div className={classNames('flex justify-center h-[1.16rem]')}>
			<div className="w-smallContentW xl:w-contentW 2xl:w-largeContentW flex flex-col">
				<div>{props.children}</div>
			</div>
		</div>
	);
};
