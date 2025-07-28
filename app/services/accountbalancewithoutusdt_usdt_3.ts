import { fetchAccountBalance3, AccountBalance3 } from './accountbalance_usdt_3';

export async function fetchAccountBalanceWithoutUSDT3(): Promise<AccountBalance3[]> {
  const accountBalances = await fetchAccountBalance3();
  return accountBalances.filter(balance => balance.asset !== 'USDT' && balance.asset !== 'USDC');
} 