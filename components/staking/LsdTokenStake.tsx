'use client';
import { Icomoon } from 'components/icon/Icomoon';
import {
  allTokens,
  getEvmChainId,
  getEvmChainName,
  getStableCoins,
  StableCoin,
} from 'config/env';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  handleTokenStake,
  updateTokenBalance,
} from 'redux/reducers/TokenSlice';
import {
  formatLargeAmount,
  formatNumber,
  toChainAmount,
} from 'utils/numberUtils';
import Web3 from 'web3';
import { CustomButton } from '../common/CustomButton';
import { CustomNumberInput } from '../common/CustomNumberInput';
import { DataLoading } from '../common/DataLoading';
import { getLsdTokenName } from 'utils/configUtils';
import { useApr } from 'hooks/useApr';
import HoverPopover from 'material-ui-popup-state/HoverPopover';
import { bindPopover } from 'material-ui-popup-state';
import {
  bindHover,
  bindTrigger,
  usePopupState,
} from 'material-ui-popup-state/hooks';
import classNames from 'classnames';
import { isEmptyValue } from 'utils/commonUtils';
import { BubblesLoading } from 'components/common/BubblesLoading';
import { usePrice } from 'hooks/usePrice';
import { useMinStakeAmount } from 'hooks/useMinStakeAmount';
import { useAccount, useConnect, useGasPrice } from 'wagmi';
import { wagmiConfig } from 'connectors/walletConnect';
import { switchChain } from '@wagmi/core';
import { Popover } from '@mui/material';
import { useRouter } from 'next/router';
import { useErc20TokenBalance } from 'hooks/useErc20TokenBalance';
import { useEthBalance } from 'hooks/useEthBalance';
import { useLsdBalance } from 'hooks/useLsdBalance';

interface Props {
  curToken: StableCoin;
}

export const LsdTokenStake = ({ curToken }: Props) => {
  const router = useRouter();

  const dispatch = useAppDispatch();

  const { lsdBalance, refetchLsdBalance } = useLsdBalance();
  const apr = useApr();
  const { tokenPrice } = usePrice();
  const { ethPrice } = useAppSelector((state) => state.token);

  const [stakeAmount, setStakeAmount] = useState('');
  const { address, isConnected, chainId } = useAccount();

  const minStakeAmount = useMinStakeAmount();

  const { stakeLoading } = useAppSelector((state) => state.app);
  const { rate } = useAppSelector((state) => state.lsdToken);

  const { connectAsync, connectors } = useConnect();

  const { data: gasPrice } = useGasPrice({ config: wagmiConfig });

  const { stableCoinBalance, refetchStableCoinBalance } = useErc20TokenBalance(
    curToken.address
  );

  const ethBalance = useEthBalance();

  const isWrongNetwork = useMemo(() => {
    return Number(chainId) !== getEvmChainId();
  }, [chainId]);

  const stakeValue = useMemo(() => {
    if (
      !stakeAmount ||
      isNaN(Number(stakeAmount)) ||
      Number(stakeAmount) === 0 ||
      isNaN(Number(tokenPrice))
    ) {
      return undefined;
    }
    return Number(stakeAmount) * Number(tokenPrice);
  }, [stakeAmount, tokenPrice]);

  const willReceiveAmount = useMemo(() => {
    if (
      isNaN(Number(stakeAmount)) ||
      isNaN(Number(rate)) ||
      Number(stakeAmount) === 0
    ) {
      return '--';
    }
    return Number(stakeAmount) / Number(rate) + '';
  }, [stakeAmount, rate]);

  const estimateFee = useMemo(() => {
    const gasLimit = 200000;
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

  const [stakeDisabled, buttonText] = useMemo(() => {
    if (!isConnected || !address) {
      return [false, 'Connect Wallet'];
    }
    if (isWrongNetwork) {
      return [
        false,
        `Wrong network, click to change into ${getEvmChainName()}`,
      ];
    }
    if (
      !stakeAmount ||
      isNaN(Number(stakeAmount)) ||
      Number(stakeAmount) === 0 ||
      isNaN(Number(stableCoinBalance))
    ) {
      return [true, 'Stake'];
    }

    if (Number(stakeAmount) < Number(minStakeAmount)) {
      return [
        true,
        `Minimal Stake Amount is ${minStakeAmount} ${curToken.name}`,
      ];
    }

    if (
      isNaN(Number(stableCoinBalance)) ||
      Number(stableCoinBalance) < Number(stakeAmount)
    ) {
      return [true, `Not Enough ${curToken.name} to Stake`];
    }

    if (
      isNaN(Number(ethBalance)) ||
      Number(ethBalance) < Number(estimateFee) * 1.4
    ) {
      return [true, `Not Enough ETH to Pay Fee`];
    }

    return [false, 'Stake'];
  }, [
    isWrongNetwork,
    stableCoinBalance,
    stakeAmount,
    isConnected,
    address,
    estimateFee,
    minStakeAmount,
    ethBalance,
  ]);

  const newRTokenBalance = useMemo(() => {
    if (isNaN(Number(lsdBalance))) {
      return '--';
    }

    if (isNaN(Number(stakeAmount)) || isNaN(Number(rate))) {
      return '--';
    }
    return Number(lsdBalance) + Number(stakeAmount) / Number(rate) + '';
  }, [lsdBalance, rate, stakeAmount]);

  const clickConnectWallet = async () => {
    const metamaskConnector = connectors.find(
      (item) => item.name === 'MetaMask'
    );
    if (!metamaskConnector) return;
    try {
      if (!isConnected) {
        await connectAsync({ connector: metamaskConnector });
      }
      await switchChain(wagmiConfig, { chainId: getEvmChainId() });
    } catch (err: any) {
      console.log(err);
    }
  };

  const clickMax = () => {
    if (isWrongNetwork || !isConnected || isNaN(Number(stableCoinBalance))) {
      return;
    }
    let amount = Number(stableCoinBalance);

    if (Number(amount) > 0) {
      setStakeAmount(
        formatNumber(amount.toString(), {
          toReadable: false,
          withSplit: false,
        })
      );
    }
  };

  const clickStake = () => {
    if (!isConnected || isWrongNetwork) {
      clickConnectWallet();
      return;
    }

    dispatch(
      handleTokenStake(
        curToken,
        Number(stakeAmount).toString(),
        willReceiveAmount,
        newRTokenBalance,
        false,
        async (success) => {
          dispatch(updateTokenBalance());
          if (success) {
            setStakeAmount('');
          }
          await refetchStableCoinBalance();
          await refetchLsdBalance();
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

  const tokenListPopupState = usePopupState({
    variant: 'popover',
    popupId: 'tokenList',
  });

  return (
    <div>
      <div className="h-[1.07rem] mt-[.32rem] pt-[.24rem] mx-[.24rem] rounded-[.3rem] bg-[#E8EFFD]">
        <div className="mx-[.12rem] flex items-start">
          <div
            className="h-[.42rem] rounded-[.3rem] flex items-center cursor-pointer bg-white"
            {...bindTrigger(tokenListPopupState)}
          >
            <div className="ml-[.08rem] flex items-center">
              <div className="w-[.34rem] h-[.34rem] rounded-full bg-[#072723] flex items-center justify-center relative">
                <Image src={curToken.icon} alt="logo" layout="fill" />
              </div>

              <div className="text-color-text1 text-[.16rem] ml-[.16rem]">
                {curToken.name}
              </div>
            </div>

            <div className="ml-[.16rem] mr-[.16rem]">
              <Icomoon icon="arrow-down" size=".1rem" color="#848B97" />
            </div>
          </div>

          <div className="flex-1 flex justify-start flex-col pl-[.14rem]">
            <div className="flex items-center h-[.42rem]">
              <CustomNumberInput
                value={stakeAmount}
                handleValueChange={setStakeAmount}
                fontSize=".24rem"
                placeholder="Amount"
              />
              <div
                className="px-[.16rem] h-[.36rem] text-[.16rem] bg-white rounded-[.32rem] flex items-center justify-center border-[.01rem] border-[#E8EFFD] cursor-pointer"
                onClick={clickMax}
              >
                Max
              </div>
            </div>

            <div className="mt-[.1rem] flex items-center justify-between text-[.14rem]">
              <div className="text-[#272727]">
                {stakeValue
                  ? `$${formatNumber(stakeValue, { decimals: 2 })}`
                  : ''}{' '}
              </div>

              <div className="flex items-center">
                <div className="text-[#6C86AD]">Balance</div>
                <div className="ml-[.06rem] text-black">
                  {formatNumber(stableCoinBalance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomButton
        loading={stakeLoading}
        disabled={stakeDisabled}
        mt=".18rem"
        className="mx-[.24rem]"
        height=".56rem"
        onClick={clickStake}
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
        className="mx-[.75rem] my-[.24rem] grid items-stretch font-[500]"
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
                {formatLargeAmount(willReceiveAmount)} {getLsdTokenName()}
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
                <DataLoading height=".16rem" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mr-[.0rem]">
          <div className="flex flex-col items-center">
            <div className="text-[#6C86AD80] text-[.14rem]">Est. Cost</div>

            <div
              className="mt-[.1rem] flex items-center cursor-pointer"
              {...bindHover(txFeePopupState)}
            >
              <div className="text-[#6C86AD] text-[.16rem]">
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
                  color="#6C86AD"
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
          <div className="text-center mt-[.08rem] leading-normal text-[#6c86ad]">
            1:{formatNumber(rate, { decimals: 6 })}
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
          <div className="h-[.01rem] bg-[#6C86AD80]" />
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

      <Popover
        {...bindPopover(tokenListPopupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
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
          className={classNames('w-[2.8rem] max-h-[6rem] overflow-auto dark')}
        >
          <div className="text-[#6C86AD] text-[.16rem] mt-[.2rem] ml-[.12rem] mb-[.1rem]">
            Choose Token
          </div>

          {getStableCoins().map((token, index) => (
            <div key={token.name}>
              <div
                className="flex items-center justify-between h-[.5rem] cursor-pointer mx-[.12rem]"
                onClick={() => {
                  tokenListPopupState.close();
                  router.push(
                    {
                      pathname: '/',
                      query: {
                        ...router.query,
                        token: token.name,
                      },
                    },
                    undefined,
                    { scroll: false }
                  );
                }}
              >
                <div className="flex items-center ">
                  <div className="w-[.2rem] h-[.2rem] relative">
                    <Image alt="logo" layout="fill" src={token.icon} />
                  </div>
                  <div className="ml-[.06rem] text-[#6C86AD] text-[.14rem]">
                    {token.name}
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="ml-[.12rem]">
                    {curToken === token ? (
                      <Icomoon
                        icon="checked-circle"
                        size=".16rem"
                        color="#80CAFF"
                      />
                    ) : (
                      <div className="w-[.16rem] h-[.16rem] rounded-full border-solid border-[1px] border-[#222c3c]" />
                    )}
                  </div>
                </div>
              </div>

              {index !== allTokens.length - 1 && (
                <div className="h-[1px] mx-[.12rem] bg-color-popoverDivider" />
              )}
            </div>
          ))}
        </div>
      </Popover>
    </div>
  );
};
