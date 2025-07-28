import crypto from 'crypto';

// Define a new interface for the Account Balance
export interface AccountBalance3 {
  asset: string;
  totalWalletBalance: string;
  crossMarginAsset: string;
  crossMarginBorrowed: string;
  crossMarginFree: string;
  crossMarginInterest: string;
  crossMarginLocked: string;
  umWalletBalance: string;
  umUnrealizedPNL: string;
  cmWalletBalance: string;
  cmUnrealizedPNL: string;
  updateTime: number;
  negativeBalance: string;
}

export async function fetchAccountBalance3(): Promise<AccountBalance3[]> {
  const apiKey = process.env.BINANCE_API_KEY_3;
  const apiSecret = process.env.BINANCE_API_SECRET_3;

  if (!apiKey || !apiSecret) {
    throw new Error('Binance API credentials are not configured');
  }

  try {
    // First get server time
    const timeResponse = await fetch('https://api.binance.com/api/v3/time');
    if (!timeResponse.ok) {
      throw new Error('Failed to fetch Binance server time');
    }
    const timeData = await timeResponse.json();
    const timestamp = timeData.serverTime;

    const recvWindow = 60000; // Set recvWindow to 60 seconds
    const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;

    // Generate signature
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    const response = await fetch(
      `https://papi.binance.com/papi/v1/balance?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Binance API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected response format from Binance API');
    }

    return data as AccountBalance3[];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch account balance: ${error.message}`);
    } else {
      throw new Error('Failed to fetch account balance: Unknown error');
    }
  }
}

// --- Price Cache Section ---
let priceCache: Map<string, number> | null = null;
let lastPriceFetchTime = 0; // Track last fetch time

export async function fetchAllPrices2(forceRefresh = false): Promise<Map<string, number>> {
  const now = Date.now();
  
  // Only fetch again if more than 60 seconds have passed OR forced refresh
  if (!forceRefresh && priceCache && (now - lastPriceFetchTime) < 60000) {
    return priceCache;
  }

  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price');
    if (!response.ok) {
      throw new Error(`Failed to fetch prices. Status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    priceCache = new Map(
      data.map((item: { symbol: string; price: string }) => [item.symbol, parseFloat(item.price)])
    );
    lastPriceFetchTime = now; // Update last fetch time
    return priceCache;
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw error;
  }
}

export async function fetchSpotPrice2(asset: string): Promise<number> {
  if (asset === 'USDT') {
    return 1; // Set spot price to 1 for USDT
  }

  const prices = await fetchAllPrices2(); // Will use cache
  const price = prices.get(`${asset}USDT`);
  
  if (price === undefined) {
    throw new Error(`Price for ${asset} not found`);
  }

  return price;
}
