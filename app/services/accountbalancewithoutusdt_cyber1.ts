import { fetchAccountBalanceCyber1, AccountBalanceCyber1 } from './spotpositioncyber1';

export async function fetchAccountBalanceWithoutUSDTCyber1(): Promise<AccountBalanceCyber1[]> {
  const accountBalances = await fetchAccountBalanceCyber1();
  return accountBalances.filter(balance => balance.asset !== 'USDT');
} 