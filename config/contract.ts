import { isDev } from './env';
import appDevConfig from './appConf/dev.json';
import appProdConfig from './appConf/prod.json';
import lsdTokenContractAbi from './abi/lsdTokenContractAbi.json';
import stakeManagerContractAbi from './abi/stakeManagerContractAbi.json';
import aaveStakeManagerContractAbi from './abi/aaveStakeManager.json';
import erc20Abi from './abi/erc20Abi.json';
import { AbiItem } from 'web3-utils';
import { Abi } from 'viem';

/**
 * get lsdToken contract address
 */
export function getLsdTokenAddress() {
  if (isDev()) {
    return appDevConfig.contracts.lsdToken;
  }
  return appProdConfig.contracts.lsdToken;
}

/**
 * get evm token stakeManager contract address
 */
export function getStakeManagerAddress() {
  if (isDev()) {
    return appDevConfig.contracts.stakeManager;
  }
  return appProdConfig.contracts.stakeManager;
}

export function getAaveStakeManagerAbi() {
  return aaveStakeManagerContractAbi as AbiItem[];
}

/**
 * get lsdToken token contract ABI
 */
export function getLsdTokenAbi() {
  return lsdTokenContractAbi as AbiItem[];
}

/**
 * get evm token stakeManager contract ABI
 */
export function getStakeManagerAbi() {
  return stakeManagerContractAbi as AbiItem[];
}

export function getErc20Abi() {
  return erc20Abi as AbiItem[];
}
