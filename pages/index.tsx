import classNames from 'classnames';
import { FaqItem } from 'components/common/FaqItem';
import { DashboardTabs } from 'components/staking/DashboardTabs';
import { WithdrawUnstaked } from 'components/staking/WithdrawUnstaked';
import { Icomoon } from 'components/icon/Icomoon';
import { getLsdTokenAddress, getStakeManagerAddress } from 'config/contract';
import { getExplorerAccountUrl } from 'config/explorer';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { formatNumber } from 'utils/numberUtils';
import {
  IFaqItem,
  getFaqList,
  getLsdTokenName,
  IFaqContent,
} from 'utils/configUtils';
import { StakePage } from 'components/staking/StakePage';
import { useLsdTokenRate } from 'hooks/useLsdTokenRate';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useWithdrawInfo } from 'hooks/useWithdrawInfo';
import { getEvmChainId } from 'config/env';
import { roboto, roboto700 } from 'config/font';
import Link from 'next/link';
import { useTotalStaked } from 'hooks/useTotalStaked';
import { BubblesLoading } from 'components/common/BubblesLoading';
import { usePrice } from 'hooks/usePrice';

const TokenPage = () => {
  const router = useRouter();

  const { withdrawInfo } = useWithdrawInfo();

  const { metaMaskChainId } = useWalletAccount();

  const rate = useLsdTokenRate();
  const totalStaked = useTotalStaked();
  const { tokenPrice } = usePrice();

  const selectedTab = useMemo(() => {
    const tabParam = router.query.tab;
    if (tabParam) {
      switch (tabParam) {
        case 'stake':
        case 'unstake':
        case 'withdraw':
          return tabParam;
        default:
          return 'stake';
      }
    }
    return 'stake';
  }, [router.query]);

  const isWrongMetaMaskNetwork = useMemo(() => {
    return Number(metaMaskChainId) !== getEvmChainId();
  }, [metaMaskChainId]);

  const showWithdrawTab = useMemo(() => {
    return (
      !isWrongMetaMaskNetwork &&
      !isNaN(Number(withdrawInfo.overallAmount)) &&
      Number(withdrawInfo.overallAmount) > 0
    );
  }, [withdrawInfo, isWrongMetaMaskNetwork]);

  const totalStakedValue = useMemo(() => {
    if (
      isNaN(Number(totalStaked)) ||
      isNaN(Number(tokenPrice)) ||
      isNaN(Number(rate))
    ) {
      return undefined;
    }
    return Number(totalStaked) * Number(rate) * Number(tokenPrice);
  }, [totalStaked, tokenPrice, rate]);

  const updateTab = (tab: string) => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab,
      },
    });
  };

  const renderFaqContent = (content: IFaqContent, index: number) => {
    if (content.type === 'link') {
      if (content.content.endsWith('\n')) {
        return (
          <div className={classNames(index > 0 ? 'mt-faqGap' : '')} key={index}>
            <a
              className="text-color-link cursor-pointer"
              href={content.link}
              target="_blank"
              rel="noreferrer"
            >
              {content.content.trimEnd()}
            </a>
          </div>
        );
      } else {
        return (
          <a
            className="text-link cursor-pointer"
            href={content.link}
            target="_blank"
            rel="noreferrer"
            key={index}
          >
            {content.content}
          </a>
        );
      }
    } else {
      if (content.content.endsWith('\n')) {
        return (
          <div className={classNames(index > 0 ? 'mt-faqGap' : '')} key={index}>
            {content.content}
          </div>
        );
      } else {
        return <span key={index}>{content.content}</span>;
      }
    }
  };

  const renderFaqContents = (contents: IFaqContent[]) => {
    const renderedJSX: React.ReactElement[] = [];
    contents.forEach((content: IFaqContent, index: number) => {
      const contentJSX = renderFaqContent(content, index);
      renderedJSX.push(contentJSX);
    });
    return renderedJSX;
  };

  return (
    <div className="mt-[2.6rem]">
      <div className="w-[11.33rem] mx-auto 2xl:w-[12.8rem]">
        <div className="my-[.36rem]">
          {showWithdrawTab && (
            <DashboardTabs
              selectedTab={selectedTab}
              onChangeTab={updateTab}
              showWithdrawTab={showWithdrawTab}
            />
          )}

          <div className="mt-[.36rem] w-[11.33rem] 2xl:w-[12.8rem] flex justify-center gap-[.87rem]">
            <div className={classNames('w-[6.2rem]')}>
              {(selectedTab === 'stake' || selectedTab === 'unstake') && (
                <StakePage />
              )}

              {selectedTab === 'withdraw' && (
                <WithdrawUnstaked withdrawInfo={withdrawInfo} />
              )}
            </div>

            <div className="w-[4.29rem]">
              <div className="bg-[#6C86AD14] rounded-[.12rem] py-[.16rem] px-[.24rem] text-[.14rem] mb-[.16rem]">
                <div
                  className={classNames(
                    roboto700.className,
                    'text-[.14rem] text-text1 leading-normal'
                  )}
                >
                  Total Staked
                </div>
                <div
                  className={classNames(
                    roboto.className,
                    'flex items-center justify-between leading-normal text-text2 mt-[.06rem]'
                  )}
                >
                  <div className="text-[.28rem]">
                    {!isNaN(Number(totalStaked)) ? (
                      `${formatNumber(totalStaked, { decimals: 4 })}`
                    ) : (
                      <BubblesLoading />
                    )}{' '}
                    U
                  </div>
                  <div className="text-[.2rem]">
                    {!isNaN(Number(totalStakedValue)) ? (
                      `$${formatNumber(totalStakedValue, { decimals: 2 })}`
                    ) : (
                      <BubblesLoading />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#6C86AD14] rounded-[.12rem] py-[.16rem] px-[.24rem] text-[.14rem]">
                <div
                  className={classNames(roboto700.className, 'text-[#222c3c]')}
                >
                  {getLsdTokenName()} Token Contract Address
                </div>

                <Link
                  href={getExplorerAccountUrl(getLsdTokenAddress())}
                  target="_blank"
                >
                  <div className="mt-[.12rem] text-[#5A5DE0] flex items-center">
                    <span className="mr-[.12rem] flex-1 break-all leading-normal tracking-tight">
                      {getLsdTokenAddress()}
                    </span>

                    <div className="min-w-[.12rem]">
                      <Icomoon icon="share" size=".12rem" color="#ffffff80" />
                    </div>
                  </div>
                </Link>

                <div
                  className={classNames(
                    roboto700.className,
                    'text-[#222c3c] mt-[.16rem]'
                  )}
                >
                  {getLsdTokenName()} Stake Contract Address
                </div>

                <Link
                  href={getExplorerAccountUrl(getStakeManagerAddress())}
                  target="_blank"
                >
                  <div className="mt-[.12rem] text-[#5A5DE0] flex items-center">
                    <span className="mr-[.12rem] flex-1 break-all leading-normal tracking-tight">
                      {getStakeManagerAddress()}
                    </span>

                    <div className="min-w-[.12rem]">
                      <Icomoon icon="share" size=".12rem" color="#ffffff80" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {getFaqList().length > 0 && (
          <div
            className={classNames(
              'w-[11.33rem] pb-[.56rem] mt-[1.12rem] mx-auto'
            )}
          >
            <div className="text-[.24rem] leading-normal tracking-tight text-[#222c3c]">
              FAQ
            </div>
            <div
              className="grid items-start mt-[.14rem]"
              style={{
                gridTemplateColumns: '48% 48%',
                columnGap: '4%',
                rowGap: '.16rem',
              }}
            >
              {getFaqList().map((item: IFaqItem, index: number) => (
                <FaqItem text={item.title} key={index}>
                  {renderFaqContents(item.contents)}
                </FaqItem>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenPage;
