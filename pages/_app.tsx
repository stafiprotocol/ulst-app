'use client';

import { styled } from '@mui/material/styles';
import Fade from '@mui/material/Fade';
import ThemeProvider from '@mui/styles/ThemeProvider';
import { Layout } from 'components/layout/Layout';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { SnackbarProvider } from 'notistack';
import { ReactElement, ReactNode, useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { store } from 'redux/store';
import { theme } from 'styles/material-ui-theme';
import { SnackbarUtilsConfigurator } from 'utils/snackbarUtils';
import 'styles/globals.css';
import { MaterialDesignContent } from 'notistack';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from 'connectors/walletConnect';
import { useAppSelector } from 'hooks/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
	getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
	const resizeListener = () => {
		// 1rem:100px
		let designSize = 1280;
		let html = document.documentElement;
		let clientW = html.clientWidth;
		let htmlRem = (clientW * 100) / designSize;
		html.style.fontSize = Math.min(htmlRem, 100) + 'px';
	};

	useEffect(() => {
		window.addEventListener('resize', resizeListener);
		resizeListener();

		return () => {
			window.removeEventListener('resize', resizeListener);
		};
	}, []);

	return (
		<Provider store={store}>
			<MyAppWrapper Component={Component} pageProps={pageProps} />
		</Provider>
	);
}

export default MyApp;

const queryClient = new QueryClient();

const MyAppWrapper = ({ Component, pageProps }: any) => {
	// Use the layout defined at the page level, if available
	const getLayout = Component.getLayout ?? ((page: any) => page);

	const StyledMaterialDesignContent = useMemo(() => {
		const successBg = '#E8EFFD';
		const successTextColor = '#222C3C';

		return styled(MaterialDesignContent)(() => ({
			'&.notistack-MuiContent-success': {
				backgroundColor: successBg,
				color: successTextColor,
				fontSize: '.16rem',
			},
			'&.notistack-MuiContent-error': {
				backgroundColor: 'rgba(255,82,196, 0.9) !important',
				color: '#ffffff',
				fontSize: '.16rem',
			},
			'&.notistack-MuiContent-warning': {
				backgroundColor: 'rgba(255, 204, 0, 0.9) !important',
				color: '#ffffff',
				fontSize: '.16rem',
			},
		}));
	}, []);

	return (
		<SnackbarProvider
			maxSnack={1}
			autoHideDuration={3000}
			anchorOrigin={{
				vertical: 'top',
				horizontal: 'center',
			}}
			TransitionComponent={Fade as React.ComponentType}
			Components={{
				success: StyledMaterialDesignContent,
				error: StyledMaterialDesignContent,
				warning: StyledMaterialDesignContent,
			}}
		>
			<WagmiProvider config={wagmiConfig} reconnectOnMount>
				<QueryClientProvider client={queryClient}>
					<SnackbarUtilsConfigurator />
					<Layout>{getLayout(<Component {...pageProps} />)}</Layout>
				</QueryClientProvider>
			</WagmiProvider>
		</SnackbarProvider>
	);
};
