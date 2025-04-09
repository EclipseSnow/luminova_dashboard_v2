import { fetchAccountBalance, AccountBalance } from './accountbalance';

export async function fetchAccountBalanceWithoutUSDT(): Promise<AccountBalance[]> {
  const accountBalances = await fetchAccountBalance();
  return accountBalances.filter(balance => balance.asset !== 'USDT');
} 