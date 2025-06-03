import { fetchAccountBalance2, AccountBalance2 } from './accountbalance_usdt_2';

export async function fetchAccountBalanceWithoutUSDT2(): Promise<AccountBalance2[]> {
  const accountBalances = await fetchAccountBalance2();
  return accountBalances.filter(balance => balance.asset !== 'USDT');
} 