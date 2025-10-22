import dayjs from 'dayjs';

export const STORAGE_KEY_DARK_MODE = 'ulst_lsd_dark_mode';
export const STORAGE_KEY_NOTICE = 'ulst_lsd_notice';
export const STORAGE_KEY_UNREAD_NOTICE = 'ulst_lsd_unread_notice';
export const STORAGE_KEY_UNBOND_RECORDS = 'ulst_lsd_unbond_records';
export const STORAGE_KEY_DISCONNECT_METAMASK = 'ulst_lsd_disconnect_metamask';

export function saveStorage(key: string, value: string) {
	localStorage.setItem(key, value);
}

export function getStorage(key: string): string | null {
	return localStorage.getItem(key);
}

export function removeStorage(key: string) {
	localStorage.removeItem(key);
}
