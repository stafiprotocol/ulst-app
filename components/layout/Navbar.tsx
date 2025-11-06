import { Popover } from '@mui/material';
import classNames from 'classnames';
import { CustomButton } from 'components/common/CustomButton';
import { NoticeDrawer } from 'components/drawer/NoticeDrawer';
import { SettingsDrawer } from 'components/drawer/SettingsDrawer';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppSelector } from 'hooks/common';
import { useWalletAccount } from 'hooks/useWalletAccount';
import noticeDarkIcon from 'public/images/notice_dark.svg';
import {
  bindPopover,
  bindTrigger,
  usePopupState,
} from 'material-ui-popup-state/hooks';
import Image from 'next/image';
import defaultAvatar from 'public/images/default_avatar.png';
import { useEffect, useMemo, useState } from 'react';
import { getShortAddress } from 'utils/stringUtils';
import { getEvmChainId } from 'config/env';
import {
  getLsdTokenName,
  getSupportChains,
  getTokenChainName,
  getTokenStandard,
} from 'utils/configUtils';
import { getLsdTokenIcon } from 'utils/iconUtils';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { switchChain } from '@wagmi/core';
import { wagmiConfig } from 'connectors/walletConnect';
import { formatNumber } from 'utils/numberUtils';
import { roboto700 } from 'config/font';
import { useApr } from 'hooks/useApr';
import logo1Img from 'public/images/logo1.svg';
import p1Img from 'public/images/p1.svg';
import p2Img from 'public/images/p2.svg';
import styled from 'styled-components';
import chainIcon from 'public/images/ethereum.png';
import { useLsdBalance } from 'hooks/useLsdBalance';
import { theme } from 'styles/material-ui-theme';
import { addLsdTokenToMetaMask } from 'utils/web3Utils';

const Navbar = () => {
  const { unreadNoticeFlag } = useAppSelector((state) => state.app);

  const [noticeDrawerOpen, setNoticeDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [auditExpand, setAuditExpand] = useState(false);
  const [pageWidth, setPageWidth] = useState(
    document.documentElement.clientWidth
  );

  const { address } = useAccount();

  const { lsdBalance } = useLsdBalance();

  const { rate } = useAppSelector((state) => state.lsdToken);

  const apr = useApr();

  const stakedToken = useMemo(() => {
    if (isNaN(Number(lsdBalance)) || isNaN(Number(rate))) {
      return '--';
    }
    return Number(lsdBalance) * Number(rate);
  }, [lsdBalance, rate]);

  const resizeListener = () => {
    const clientW = document.documentElement.clientWidth;
    setPageWidth(clientW);
  };

  useEffect(() => {
    window.addEventListener('resize', resizeListener);
    resizeListener();

    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  }, []);

  return (
    <div
      className="relative h-[2.1rem] w-full"
      style={{
        background: 'linear-gradient(180deg, #ffffff -20.69%, #beebcd 103.45%)',
      }}
    >
      <div className="mx-auto pt-[.3rem] flex items-center justify-between relative w-[11.33rem] translate-x-[.68rem]">
        <div className="w-[2.44rem] h-[.42rem] -translate-x-[.68rem]">
          <div className="relative w-[.7416rem] h-[.2416rem]">
            <Image src={logo1Img} alt="logo" layout="fill" />
          </div>
        </div>

        <div className={classNames('flex items-center')}>
          <div className={classNames('ml-[.16rem]')}>
            {address ? <UserInfo /> : <ConnectButton />}
          </div>

          <div
            className={classNames(
              'cursor-pointer ml-[.3rem] w-[.42rem] h-[.42rem] flex items-center justify-center rounded-[.12rem] relative',
              noticeDrawerOpen ? 'bg-color-selected' : ''
            )}
            onClick={() => {
              setSettingsDrawerOpen(false);
              setNoticeDrawerOpen(!noticeDrawerOpen);
            }}
          >
            <div className="h-[.25rem] w-[.22rem] relative">
              <Image src={noticeDarkIcon} layout="fill" alt="notice" />
            </div>

            {unreadNoticeFlag && (
              <div className="bg-error rounded-full w-[.06rem] h-[.06rem] absolute right-[0.08rem] top-[0.08rem]"></div>
            )}
          </div>

          <div
            className={classNames(
              'cursor-pointer ml-[.16rem] w-[.42rem] h-[.42rem] flex items-center justify-center rounded-[.12rem]',
              settingsDrawerOpen ? 'bg-color-selected' : ''
            )}
            onClick={() => {
              setNoticeDrawerOpen(false);
              setSettingsDrawerOpen(!settingsDrawerOpen);
            }}
          >
            <Icomoon icon="more" size=".2rem" color="#222c3c" />
          </div>
        </div>

        <SettingsDrawer
          open={settingsDrawerOpen}
          onChangeOpen={setSettingsDrawerOpen}
        />

        <NoticeDrawer
          open={noticeDrawerOpen}
          onChangeOpen={setNoticeDrawerOpen}
        />
      </div>

      <div className="w-[11.33rem] h-[.71rem] mx-auto mt-[.37rem] flex items-center">
        <div className="bg-black flex items-center justify-center rounded-full w-[.68rem] h-[.68rem] relative">
          <Image src={getLsdTokenIcon()} fill alt="icon" />
        </div>
        <div className="ml-[.12rem]">
          <div className="flex items-center">
            <div
              className={classNames(
                roboto700.className,
                'text-[.34rem] text-[#222c3c] leading-normal'
              )}
            >
              {getLsdTokenName()}
            </div>

            <div className="ml-[.09rem] text-[.12rem] text-[#222c3c] flex items-center justify-center w-[.5rem] h-[.26rem] rounded-[.06rem] border-[.01rem] border-[#222C3C1A]">
              {getTokenStandard()}
            </div>

            <div className="text-[.12rem] flex items-center justify-center bg-[#B9EE01] px-[.06rem] h-[.26rem] rounded-[.06rem] ml-[.06rem]">
              <span className={classNames(roboto700.className)}>
                {formatNumber(apr, { decimals: 2 })}%
              </span>
              <span className="ml-[.02rem]">APR</span>
            </div>

            <div
              className="ml-[.24rem] flex items-center cursor-pointer"
              onClick={async () => {
                await addLsdTokenToMetaMask();
              }}
            >
              <div className="text-[#222c3c] text-[.14rem]">
                Add {getLsdTokenName()} to Wallet
              </div>

              <span className="ml-[.06rem] flex items-center">
                <Icomoon icon="share" size=".12rem" color="#222C3C" />
              </span>
            </div>
          </div>

          <div className="mt-[.02rem] text-[#222c3c] text-[.12rem] leading-normal">
            On {getSupportChains().join(', ')} Chains
          </div>
        </div>

        <div className="relative ml-[1rem] -translate-y-[.72rem]">
          <div className="absolute w-[1.42rem] h-[1.3675rem] left-0 top-0">
            <Image src={p1Img} alt="logo" layout="fill" />
          </div>
          <div className="absolute w-[2.16rem] h-[2.1125rem] left-[1.05rem] -top-[.5rem]">
            <Image src={p2Img} alt="logo" layout="fill" />
          </div>
        </div>

        {address && (
          <div className="ml-auto flex flex-col justify-center items-end">
            <div
              className={classNames(
                roboto700.className,
                'text-[.34rem] text-[#222c3c] leading-normal'
              )}
            >
              {formatNumber(lsdBalance)}
            </div>
            <div className="text-[.12rem] text-[#222c3c] mt-[.03rem] leading-normal">
              {formatNumber(stakedToken)} U Staked
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UserInfo = () => {
  const { address } = useAccount();

  const { disconnectAsync } = useDisconnect();

  const clickDisconnect = async () => {
    addressPopupState.close();
    try {
      await disconnectAsync();
    } catch (err: any) {}
  };

  const addressPopupState = usePopupState({
    variant: 'popover',
    popupId: 'address',
  });

  return (
    <div className="h-[.42rem] bg-white/50 rounded-[.6rem] flex items-stretch">
      <div
        className={classNames(
          'items-center pl-[.04rem] pr-[.12rem] rounded-l-[.6rem] cursor-pointer flex'
        )}
      >
        <div className="w-[.28rem] h-[.28rem] relative ml-[.04rem]">
          <Image
            src={chainIcon}
            alt="logo"
            className="rounded-full  overflow-hidden"
            fill
          />
        </div>

        <div className={classNames('ml-[.08rem] text-[.16rem] text-[#222c3c]')}>
          {getTokenChainName()}
        </div>

        {/* <div className="ml-[.12rem]">
          <Icomoon icon="arrow-down" size=".1rem" color="#848B97" />
        </div> */}
      </div>

      <div
        className={classNames(
          'self-center h-[.22rem] w-[.01rem] bg-[#DEE6F7] flex'
        )}
      />

      <div
        className={classNames(
          'cursor-pointer pr-[.48rem] flex items-center rounded-r-[.6rem] relative',
          addressPopupState.isOpen ? 'bg-white' : '',
          'rounded-r-[.6rem]  pl-[.12rem]'
        )}
        {...bindTrigger(addressPopupState)}
      >
        <Image
          src={defaultAvatar}
          alt="logo"
          className="w-[.34rem] h-[.34rem] rounded-full"
        />

        <div
          className={classNames(
            'mx-[.12rem] text-[.16rem]',
            addressPopupState.isOpen ? 'text-text1 ' : 'text-[#222c3c]'
          )}
        >
          {getShortAddress(address, 5)}
        </div>

        <TestnetTag>Testnet</TestnetTag>
      </div>

      {/* Address Menu */}
      <Popover
        {...bindPopover(addressPopupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        elevation={0}
        sx={{
          marginTop: '.15rem',
          '& .MuiPopover-paper': {
            background: '#4D65734D',
            border: '0.01rem solid #4D657333',
            backdropFilter: 'blur(.4rem)',
            borderRadius: '.3rem',
          },
          '& .MuiTypography-root': {
            padding: '0px',
          },
          '& .MuiBox-root': {
            padding: '0px',
          },
        }}
      >
        <div className={classNames('p-[.16rem] w-[2rem] text-white')}>
          <div
            className="cursor-pointer flex items-center justify-between"
            onClick={() => {
              navigator.clipboard.writeText(address || '').then(() => {
                addressPopupState.close();
              });
            }}
          >
            <div className="flex items-center">
              <div className="ml-[.12rem] text-[.16rem]">Copy Address</div>
            </div>
          </div>

          <div className="my-[.16rem] h-[0.01rem] bg-color-divider1" />

          <div
            className="cursor-pointer flex items-center justify-between"
            onClick={clickDisconnect}
          >
            <div className="ml-[.12rem] text-[.16rem]">Disconnect</div>
          </div>
        </div>
      </Popover>
    </div>
  );
};

const ConnectButton = () => {
  const { metaMaskAccount } = useWalletAccount();

  const { connectAsync, connectors } = useConnect();

  const clickConnectWallet = async () => {
    const metamaskConnector = connectors.find(
      (item) => item.name === 'MetaMask'
    );
    if (!metamaskConnector) return;
    if (!metaMaskAccount) {
      try {
        await connectAsync({ connector: metamaskConnector });
        await switchChain(wagmiConfig, { chainId: getEvmChainId() });
      } catch (err: any) {
        console.log(err);
      }
    }
  };

  return (
    <CustomButton
      type="small"
      height=".42rem"
      onClick={() => {
        clickConnectWallet();
      }}
      border="none"
      // textColor={darkMode ? "#E8EFFD" : ""}
    >
      Connect Wallet
    </CustomButton>
  );
};

export default Navbar;

const TestnetTag = styled.div`
  background-color: #ffcd29;
  border: 0.01rem solid #ffffff80;
  width: 0.5rem;
  height: 0.26rem;
  font-size: 0.12rem;
  line-height: 150%;
  color: #222c3c;
  border-radius: 0.08rem;
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  letter-spacing: -0.025em;
`;
