import { fetchAccountBalance, AccountBalance } from './accountbalance_usdt';

export async function fetchAccountBalanceWithoutUSDT(): Promise<AccountBalance[]> {
  const accountBalances = await fetchAccountBalance();
  return accountBalances.filter(balance => balance.asset !== 'USDT' && balance.asset !== 'USDC');
} 