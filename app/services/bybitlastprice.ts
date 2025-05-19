import crypto from 'crypto';

export interface LastPriceInfo {
  asset: string;
  lastprice: number;
}

function generateSignature(params: BybitParams, apiSecret: string): string {
  const queryString = Object.keys(params)
    .filter(key => key !== 'sign') // Exclude 'sign' from the query string
    .sort()
    .map(key => `${key}=${params[key as keyof BybitParams]}`)
    .join('&');

  // The signString should be the queryString itself for Bybit's API
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
}

// Define a type for the parameters including the sign
type BybitParams = {
  api_key: string;
  limit: number;
  timestamp: number;
  category: string;
  settleCoin: string;
  sign?: string; // Make sign optional initially
};

// Define a type for the ticker data
interface TickerData {
  symbol: string;
  lastPrice: string;
}

export async function getBybitLastPriceInfo(limit = 50): Promise<LastPriceInfo[]> {
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Bybit API credentials are not configured');
  }

  const timestamp = Date.now();
  const params: BybitParams = {
    api_key: apiKey,
    limit: limit,
    timestamp: timestamp,
    category: "linear",
    settleCoin: "USDT"
  };

  const sign = generateSignature(params, apiSecret);
  params.sign = sign; // Now TypeScript recognizes 'sign' as a valid property

  // Convert params to query string
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key as keyof BybitParams]!)}`)
    .join('&');

  // Update the URL to the new endpoint for tickers
  const url = `https://api.bybit.com/v5/market/tickers?${queryString}`;
  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    const data = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`API Error: ${data.retMsg}`);
    }

    // Map the response to extract the last price for each ticker
    const tickers = data.result.list.map((ticker: TickerData) => ({
      asset: ticker.symbol,
      lastprice: parseFloat(ticker.lastPrice)
    }));

    return tickers;
  } catch (error) {
    console.error("Failed to fetch ticker info:", error);
    return [];
  }
}