import { Skeleton } from '@mui/material';

interface Props {
	height: string;
}

export const DataLoading = (props: Props) => {
	const { height } = props;

	return (
		<div className="min-w-[0.5rem]">
			<Skeleton
				variant="rounded"
				animation="pulse"
				height={height}
				sx={{
					fontSize: height,
					bgcolor: 'grey.100',
				}}
			/>
		</div>
	);
};
