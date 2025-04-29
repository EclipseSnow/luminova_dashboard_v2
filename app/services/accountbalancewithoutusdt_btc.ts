import { fetchAccountBalance_BTC, AccountBalance_BTC } from './accountbalance_btc';

export async function fetchAccountBalanceWithoutUSDT_BTC(): Promise<AccountBalance_BTC[]> {
  const accountBalances = await fetchAccountBalance_BTC();
  return accountBalances.filter(balance => balance.asset !== 'USDT');
} 