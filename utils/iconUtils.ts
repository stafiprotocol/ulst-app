import appConfig from 'config/appConf/app.json';
import usdtImg from 'public/images/token/usdt.svg';
import usdcImg from 'public/images/token/usdc.svg';
import { Token } from 'interfaces/token';

export function getLsdTokenIcon() {
	return appConfig.token.lsdTokenImg;
}

export function getChainIcon() {
	return appConfig.token.chainImg;
}

export const getTokenIcon = (token: Token) => {
	if (token === Token.USDC) return usdcImg;
	return usdtImg;
};
