export function getUnstakeDaysLeft(unbondingDuration?: number) {
	const defaultDuration = '1 day';
	if (!unbondingDuration) return defaultDuration;
	if (Number(unbondingDuration) < 86400) {
		const duration = (Number(unbondingDuration) / 3600).toFixed(0);
		return `${duration} hours`;
	}
	const duration = (Number(unbondingDuration) / 86400).toFixed(0);
	if (duration === '1') {
		return defaultDuration;
	}
	return `${duration} days`;
}
