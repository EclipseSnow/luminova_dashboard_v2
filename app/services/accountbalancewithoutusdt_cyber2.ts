import { fetchAccountBalanceCyber2, AccountBalanceCyber2 } from './spotpositioncyber2';

export async function fetchAccountBalanceWithoutUSDTCyber2(): Promise<AccountBalanceCyber2[]> {
  const accountBalances = await fetchAccountBalanceCyber2();
  return accountBalances.filter(balance => balance.asset !== 'USDT');
} 