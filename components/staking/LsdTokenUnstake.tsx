import { Icomoon } from 'components/icon/Icomoon';
import { getEvmChainId, getEvmChainName, getStableCoins } from 'config/env';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { useBalance } from 'hooks/useBalance';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { handleLsdTokenUnstake } from 'redux/reducers/TokenSlice';
import { isEmptyValue, openLink } from 'utils/commonUtils';
import { formatLargeAmount, formatNumber } from 'utils/numberUtils';
import Web3 from 'web3';
import { CustomButton } from '../common/CustomButton';
import { CustomNumberInput } from '../common/CustomNumberInput';
import { DataLoading } from '../common/DataLoading';
import { getLsdTokenName, getUnstakeTipLink } from 'utils/configUtils';
import Image from 'next/image';
import { getLsdTokenIcon } from 'utils/iconUtils';
import { useLsdTokenRate } from 'hooks/useLsdTokenRate';
import { useApr } from 'hooks/useApr';
import HoverPopover from 'material-ui-popup-state/HoverPopover';
import { bindPopover, bindHover } from 'material-ui-popup-state';
import classNames from 'classnames';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { getUnstakeDaysLeft } from 'utils/lsdTokenUtils';
import { usePrice } from 'hooks/usePrice';
import { BubblesLoading } from 'components/common/BubblesLoading';
import tipImg from 'public/images/tip.svg';
import { useConnect, useGasPrice } from 'wagmi';
import { switchChain } from '@wagmi/core';
import { wagmiConfig } from 'connectors/walletConnect';
import { MaxBtn } from 'components/common/MaxBtn';
import { useLsdBalance } from 'hooks/useLsdBalance';
import { useUnstakePaused } from 'hooks/useUnstakePaused';

export const LsdTokenUnstake = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { metaMaskAccount, metaMaskChainId } = useWalletAccount();
  const { balance } = useBalance();
  const lsdTokenRate = useLsdTokenRate();

  const { lsdBalance, refetchLsdBalance } = useLsdBalance();

  const { connectAsync, connectors } = useConnect();
  const { data: gasPrice } = useGasPrice();

  const isUnstakePaused = useUnstakePaused();

  const apr = useApr();
  const { tokenPrice } = usePrice();
  const { ethPrice } = useAppSelector((state) => state.token);

  const [unstakeAmount, setUnstakeAmount] = useState('');

  const { unstakeLoading } = useAppSelector((state) => state.app);
  const { unbondingDuration } = useAppSelector((state) => state.lsdToken);

  const walletNotConnected = useMemo(() => {
    return !metaMaskAccount;
  }, [metaMaskAccount]);

  const availableBalance = useMemo(() => {
    if (walletNotConnected) {
      return '--';
    }
    return lsdBalance;
  }, [lsdBalance, walletNotConnected]);

  const isWrongMetaMaskNetwork = useMemo(() => {
    return Number(metaMaskChainId) !== getEvmChainId();
  }, [metaMaskChainId]);

  const unstakeValue = useMemo(() => {
    if (
      !unstakeAmount ||
      isNaN(Number(unstakeAmount)) ||
      Number(unstakeAmount) === 0 ||
      isNaN(Number(tokenPrice)) ||
      isNaN(Number(lsdTokenRate))
    ) {
      return undefined;
    }
    return Number(unstakeAmount) * Number(tokenPrice) * Number(lsdTokenRate);
  }, [unstakeAmount, tokenPrice, lsdTokenRate]);

  const estimateFee = useMemo(() => {
    const gasLimit = 300000;
    if (!gasPrice) {
      return '--';
    }

    return Web3.utils.fromWei((Number(gasPrice) * gasLimit).toString());
  }, [gasPrice]);

  const estimateFeeValue = useMemo(() => {
    if (isNaN(Number(estimateFee)) || isNaN(Number(ethPrice))) {
      return '--';
    }
    return Number(estimateFee) * Number(ethPrice) + '';
  }, [estimateFee, ethPrice]);

  const willReceiveAmount = useMemo(() => {
    if (
      isNaN(Number(unstakeAmount)) ||
      isNaN(Number(lsdTokenRate)) ||
      Number(unstakeAmount) === 0
    ) {
      return '--';
    }
    return Number(unstakeAmount) * Number(lsdTokenRate) + '';
  }, [unstakeAmount, lsdTokenRate]);

  const [buttonDisabled, buttonText, isButtonSecondary] = useMemo(() => {
    if (walletNotConnected) {
      return [false, 'Connect Wallet'];
    }
    if (isWrongMetaMaskNetwork) {
      return [
        false,
        `Wrong network, click to change into ${getEvmChainName()}`,
        true,
      ];
    }

    if (isUnstakePaused) {
      return [true, 'Unstake Paused', false];
    }

    if (
      !unstakeAmount ||
      isNaN(Number(unstakeAmount)) ||
      Number(unstakeAmount) === 0 ||
      isNaN(Number(availableBalance))
    ) {
      return [true, 'Unstake'];
    }

    if (Number(unstakeAmount) > Number(availableBalance)) {
      return [true, `Not Enough ${getLsdTokenName()} to Unstake`];
    }

    if (
      (isNaN(Number(estimateFee)) ? 0 : Number(estimateFee) * 1.4) >
      Number(balance)
    ) {
      return [true, `Not Enough ETH for Fee`];
    }

    return [false, 'Unstake'];
  }, [
    isWrongMetaMaskNetwork,
    availableBalance,
    unstakeAmount,
    walletNotConnected,
    estimateFee,
    balance,
    isUnstakePaused,
  ]);

  const newRTokenBalance = useMemo(() => {
    if (isNaN(Number(availableBalance))) {
      return '--';
    }
    if (isNaN(Number(unstakeAmount))) {
      return '--';
    }
    return Number(availableBalance) - Number(unstakeAmount) + '';
  }, [availableBalance, unstakeAmount]);

  const resetState = () => {
    setUnstakeAmount('');
  };

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

  const clickMax = () => {
    if (
      isWrongMetaMaskNetwork ||
      walletNotConnected ||
      isNaN(Number(availableBalance))
    ) {
      return;
    }
    setUnstakeAmount(
      formatNumber(availableBalance, {
        toReadable: false,
        withSplit: false,
      })
    );
  };

  const jumpToWithdraw = () => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab: 'withdraw',
      },
    });
  };

  const clickUnstake = () => {
    if (walletNotConnected || isWrongMetaMaskNetwork) {
      clickConnectWallet();
      return;
    }

    dispatch(
      handleLsdTokenUnstake(
        getStableCoins()[0],
        Number(unstakeAmount).toString(),
        willReceiveAmount,
        newRTokenBalance,
        false,
        (success) => {
          refetchLsdBalance();
          if (success) {
            resetState();
          }
        }
      )
    );
  };

  const ratePopupState = usePopupState({
    variant: 'popover',
    popupId: 'rate',
  });

  const txFeePopupState = usePopupState({
    variant: 'popover',
    popupId: 'txFee',
  });

  return (
    <div>
      {/* <div
        className="cursor-pointer h-[.56rem] mt-[.24rem] mx-[.24rem] bg-[#6C86AD14] rounded-[.12rem] flex items-center justify-between pl-[.12rem] pr-[.18rem]"
        onClick={() => {
          openLink(getUnstakeTipLink());
        }}
      >
        <div className="flex items-center">
          <div className="relative w-[.2rem] h-[.2rem]">
            <Image src={tipImg} alt="" fill />
          </div>

          <div className="ml-[.06rem] text-[#6C86AD] text-[.14rem] leading-normal tracking-tight">
            Unstaking may take{' '}
            <span className="text-[#222C3C]">
              {getUnstakeDaysLeft(unbondingDuration)}
            </span>
            . After that, withdraw function will open
          </div>
        </div>

        <Icomoon icon="right" color="#6C86AD" size=".11rem" />
      </div> */}

      <div className="h-[1.07rem] mt-[.32rem] pt-[.24rem] mx-[.24rem] bg-[#E8EFFD] rounded-[.3rem]">
        <div className="mx-[.12rem] flex items-start">
          <div className="h-[.42rem] bg-white rounded-[.3rem] flex items-center cursor-pointer">
            <div className="ml-[.08rem] flex items-center">
              <div className="w-[.34rem] h-[.34rem] relative">
                <Image src={getLsdTokenIcon()} alt="logo" layout="fill" />
              </div>

              <div className="text-[#222c3c] text-[.16rem] ml-[.16rem]">
                {getLsdTokenName()}
              </div>
            </div>

            <div className="ml-[.16rem] mr-[.16rem]">
              {/* <Icomoon icon="arrow-down" size=".1rem" color="#848B97" /> */}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-start pl-[.14rem]">
            <div className="flex items-center h-[.42rem]">
              <CustomNumberInput
                value={unstakeAmount}
                handleValueChange={setUnstakeAmount}
                fontSize=".24rem"
                placeholder="Amount"
              />
              <MaxBtn onClick={clickMax}>Max</MaxBtn>
            </div>

            <div className="mt-[.1rem] flex items-center justify-between text-[.14rem]">
              <div className="text-[#272727]">
                {unstakeValue
                  ? `$${formatNumber(unstakeValue, { decimals: 2 })}`
                  : ''}{' '}
              </div>

              <div className="flex items-center">
                <div className="text-[#272727]">Balance</div>
                <div className="ml-[.06rem] text-black">
                  {formatNumber(availableBalance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomButton
        loading={unstakeLoading}
        disabled={buttonDisabled}
        mt=".18rem"
        className="mx-[.24rem]"
        height=".56rem"
        onClick={clickUnstake}
        type={isButtonSecondary ? 'secondary' : 'primary'}
        border="none"
      >
        <div className="flex items-center">
          {buttonText}

          {(buttonText.indexOf('Wrong network') >= 0 ||
            buttonText.indexOf('Insufficient FIS.') >= 0) && (
            <div className="ml-[.12rem] flex items-center">
              <Icomoon icon="arrow-right" size=".12rem" color="#222C3C" />
            </div>
          )}
        </div>
      </CustomButton>

      <div
        className="my-[.24rem] grid items-stretch font-[500] mx-[.75rem]"
        style={{ gridTemplateColumns: '40% 30% 30%' }}
      >
        <div className="flex justify-start ml-[.18rem]">
          <div className="flex flex-col items-center">
            <div className="text-[#6C86AD80] text-[.14rem]">Will Receive</div>
            <div
              className="mt-[.1rem] flex items-center cursor-pointer"
              {...bindHover(ratePopupState)}
            >
              <div className="text-[#6C86AD] text-[.16rem]">
                {formatLargeAmount(willReceiveAmount)}{' '}
                {getStableCoins()[0].name}
              </div>
              <div
                className={classNames(
                  'ml-[.06rem] flex items-center relative self-center',
                  ratePopupState.isOpen ? 'rotate-[270deg]' : 'rotate-90'
                )}
              >
                <Icomoon
                  icon="right"
                  size=".12rem"
                  color="#FFFFFF80"
                  layout="fill"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-[#6C86AD80] text-[.14rem]">APR</div>

          <div className="mt-[.1rem] flex items-center">
            {apr !== undefined ? (
              <div className="text-[#6C86AD] text-[.16rem]">
                {formatNumber(apr, { decimals: 2, toReadable: false })}%
              </div>
            ) : (
              <div className="">
                <DataLoading height=".32rem" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mr-[.0rem]">
          <div className="flex flex-col items-center">
            <div className="text-[#6C86AD80] text-[.14rem]">Est. Cost</div>

            <div className="mt-[.1rem] flex items-center cursor-pointer">
              <div
                className="text-[#6C86AD] text-[.16rem]"
                {...bindHover(txFeePopupState)}
              >
                ${formatNumber(estimateFeeValue, { decimals: 2 })}
              </div>
              <div
                className={classNames(
                  'ml-[.06rem] flex items-center relative self-center',
                  txFeePopupState.isOpen ? 'rotate-[270deg]' : 'rotate-90'
                )}
              >
                <Icomoon
                  icon="right"
                  size=".12rem"
                  color="#FFFFFF80"
                  layout="fill"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <HoverPopover
        {...bindPopover(ratePopupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        elevation={0}
        sx={{
          marginTop: '.15rem',
          '& .MuiPopover-paper': {
            background: '#FFFFFF80',
            border: '0.01rem solid #ffffff',
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
        <div
          className={classNames(
            'p-[.16rem] text-[.14rem] text-[#6C86AD] flex flex-col justify-center'
          )}
        >
          <div className="text-center leading-normal">Exchange Rate</div>
          <div className="text-center mt-[.08rem] leading-normal text-[#6C86AD]">
            1:{formatNumber(lsdTokenRate, { decimals: 6 })}
          </div>
        </div>
      </HoverPopover>

      <HoverPopover
        {...bindPopover(txFeePopupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        elevation={0}
        sx={{
          marginTop: '.15rem',
          '& .MuiPopover-paper': {
            background: '#ffffff80',
            border: '0.01rem solid #ffffff',
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
        <div
          className={classNames(
            'text-[#6C86AD] w-[2.5rem] p-[.16rem] text-[.14rem]'
          )}
        >
          <div className="flex justify-between my-[.16rem]">
            <div>Tx Fee</div>
            <div>
              {isEmptyValue(estimateFee) ? (
                <BubblesLoading />
              ) : (
                formatNumber(estimateFee, { decimals: 4 })
              )}{' '}
              ETH
            </div>
          </div>
          <div className="h-[1px] bg-[#6C86AD80] my-[.1rem]" />
          <div className="mt-[.16rem] text-right flex items-center justify-end mb-[.16rem]">
            ~$
            {isEmptyValue(estimateFeeValue) ? (
              <BubblesLoading />
            ) : (
              formatNumber(estimateFeeValue, { decimals: 4 })
            )}
          </div>
        </div>
      </HoverPopover>
    </div>
  );
};
