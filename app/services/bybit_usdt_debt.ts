// bybit_usdt_debt.ts (modified)
import * as ccxt from 'ccxt';

interface USDTDebt {
  notional: number;
}

export async function fetchUsdtDebt(): Promise<USDTDebt[]> {
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('Bybit API credentials are not configured');
    return [];
  }

  const exchange = new ccxt.bybit({
    apiKey: apiKey,
    secret: apiSecret,
    enableRateLimit: true,
    options: {
      defaultType: 'spot', // For fetchBalance, this might need to be 'unified' or check what assets it returns
      adjustForTimeDifference: true, // Let CCXT handle time sync
      recvWindow: 10000, // Start with a reasonable recvWindow, 50000 is very large. Bybit default is 5000.
                         // The error showed 50000 was used, so let's try a slightly larger but common value or stick to 50000 if the error persists with smaller ones.
                         // For now, let's try 10000. If error persists, can go back to 50000.
    },
  });

  try {
    // Optional: Explicitly load time difference if issues persist,
    // though 'adjustForTimeDifference: true' should handle it.
    // await exchange.loadTimeDifference(); // May or may not be necessary

    // CCXT will handle retries for certain errors if enableRateLimit is true,
    // but for timestamp errors, a specific retry loop might still be needed if the first attempt fails.
    // However, the goal is for adjustForTimeDifference to make the first attempt succeed.

    const balance = await exchange.fetchBalance();
    console.log('Fetching balance...');

    const usdtBalance = balance['USDT'] || {};
    const usdtDebt = usdtBalance['debt'] || 0;

    console.log("USDT Debt Amount:", usdtDebt);

    return [{ notional: usdtDebt }];

  } catch (error: unknown) {
    console.error('Error fetching USDT debt:', error);
    // Log the specific CCXT error if possible
    if (error instanceof ccxt.NetworkError) {
        console.error('CCXT NetworkError:', error.message);
    } else if (error instanceof ccxt.ExchangeError) {
        console.error('CCXT ExchangeError:', error.message);
        // Specific check for timestamp-related errors by message content if needed
        if (error.message.includes('timestamp') || error.message.includes('recv_window')) {
            console.error('This is likely a timestamp or recv_window issue. Ensure your system clock is reasonably accurate.');
            // If using a VM or container, ensure its clock is synced with the host or an NTP server.
        }
    } else if (error instanceof Error) {
        console.error('Generic Error:', error.message);
    }
    return [];
  }
}