// bybitspot.ts (modified)
import * as ccxt from 'ccxt';

interface SpotPosition {
  asset: string;
  notional: number;
}

async function fetchUsdtTickers(exchange: ccxt.Exchange): Promise<Record<string, number>> {
  try {
    // Ensure fetchTickers itself doesn't have timestamp issues
    // It will use the exchange instance's settings (including time adjustment)
    const tickers = await exchange.fetchTickers();
    const tickerMap: Record<string, number> = {};
    
    Object.entries(tickers)
      .filter(([symbol]) => symbol.endsWith('/USDT'))
      .forEach(([symbol, ticker]) => {
        const asset = symbol.split('/')[0];
        const price = (ticker as ccxt.Ticker).last;
        if (typeof price === 'number') {
          tickerMap[asset] = price;
        }
      });

    return tickerMap;
  } catch (error) {
    console.error('Error fetching USDT tickers:', error);
    // If tickers fail due to timestamp, this will also propagate the issue
    if (error instanceof ccxt.ExchangeError && error.message.includes('10002')) {
        console.error('Timestamp error while fetching tickers. Check system clock.');
    }
    return {};
  }
}

export async function fetchSpotNotional(): Promise<SpotPosition[]> {
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
      defaultType: 'spot',
      adjustForTimeDifference: true, // CRUCIAL: Let CCXT handle time sync
      recvWindow: 10000, // Consistent recvWindow, Bybit default is 5000ms. The original 60000 was not the root cause.
    },
  });

  try {
    // No manual time sync or timestamp override needed here.
    // CCXT with 'adjustForTimeDifference: true' handles it.

    console.log('Fetching Bybit spot balance for notional calculation...');
    const balance = await exchange.fetchBalance();
    
    // Ensure fetchUsdtTickers is called *after* a successful primary call (like fetchBalance)
    // or ensure the exchange instance is properly synced if it's the first call.
    // CCXT's adjustForTimeDifference should sync on the first relevant network call.
    const prices = await fetchUsdtTickers(exchange);
    if (Object.keys(prices).length === 0) {
        console.warn('Could not fetch prices for notional calculation. Spot notionals might be inaccurate.');
    }

    const rawAssets = balance.total; // Assumes 'total' gives a map of asset to amount
    const spotPositions: SpotPosition[] = [];

    if (rawAssets) {
      for (const [asset, amountStr] of Object.entries(rawAssets)) {
        const amount = parseFloat(String(amountStr)); // Ensure amount is a number
        if (amount > 0) {
          // Original code: const cleanAsset = asset.replace('USDT', '').replace(/[^A-Za-z0-9]/g, '');
          // This cleaning logic for `cleanAsset` might be too aggressive or not match ticker assets.
          // For price lookup, `asset` itself should be used if `WorkspaceUsdtTickers` keys are base assets (e.g., 'BTC', 'ETH').
          const price = prices[asset] || (asset === 'USDT' ? 1 : 0); // Get price for the asset, default to 1 for USDT, 0 for others if not found
          
          let notional: number;
          if (asset === 'USDT') {
            notional = amount;
          } else if (price > 0) {
            notional = amount * price;
          } else {
            // console.warn(`Price for asset ${asset} not found. Notional calculated as 0.`);
            notional = 0; // Or handle as per requirements, maybe amount itself if price is unknown
          }
          
          spotPositions.push({
            asset: asset, // Use the original asset name
            notional: notional,
          });
        }
      }
    } else {
        console.warn('No "total" assets found in balance response for spot notional.');
    }
    
    return spotPositions;

  } catch (error: unknown) {
    console.error('Error fetching spot notional from Bybit:', error);
    if (error instanceof ccxt.NetworkError) {
        console.error('CCXT NetworkError:', error.message);
    } else if (error instanceof ccxt.ExchangeError) {
        console.error('CCXT ExchangeError:', error.message);
        if (error.message.includes('timestamp') || error.message.includes('recv_window') || error.message.includes('10002')) {
            console.error('Timestamp/recv_window error persists in fetchSpotNotional. CRITICAL: Please ensure your server\'s system clock is accurately synchronized with an NTP server.');
        }
    } else if (error instanceof Error) {
        console.error('Generic Error:', error.message);
    }
    return [];
  }
}