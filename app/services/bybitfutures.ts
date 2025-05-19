import crypto from 'crypto';
import { getBybitLastPriceInfo, LastPriceInfo } from './bybitlastprice'; // Assuming LastPriceInfo is exported from bybitlastprice

export interface PositionInfo {
  asset: string;
  notional: number;
  notionalValue: number;
}

type BaseParams = {
  api_key: string;
  timestamp: number;
  sign?: string;
};

type BybitParams = BaseParams & {
  limit: number;
  category: string;
  settleCoin: string;
  cursor?: string;
};

function generateSignature(params: Record<string, any>, apiSecret: string): string {
  const queryString = Object.keys(params)
    .filter(key => key !== 'sign')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
}

function buildQueryString(params: Record<string, any>): string {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

interface BybitPosition {
  symbol: string;
  size: string;
  side: string;
}

export async function getBybitPositionInfo(limit = 50): Promise<PositionInfo[]> {
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Bybit API credentials are not configured');
  }

  let allPositionsRaw: { asset: string; notional: number }[] = []; // Store raw positions before adding notionalValue
  let cursor: string | undefined;

  try {
    while (true) {
      const timestamp = Date.now();
      const params: BybitParams = {
        api_key: apiKey,
        timestamp,
        limit,
        category: "linear",
        settleCoin: "USDT",
        cursor
      };

      params.sign = generateSignature(params, apiSecret);
      const queryString = buildQueryString(params);
      const url = `https://api.bybit.com/v5/position/list?${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.retCode !== 0) {
        // It's good practice to include more details from the API error if possible
        console.error("Bybit API Error:", data);
        throw new Error(`API Error (${data.retCode}): ${data.retMsg}`);
      }

      // Ensure data.result and data.result.list exist
      if (!data.result || !data.result.list) {
        console.warn("API response missing result.list:", data);
        break; // Or handle as an error, depending on expectations
      }

      const positions = data.result.list.map((position: BybitPosition) => {
        const notional = parseFloat(position.size);
        const signedNotional = position.side === 'Sell' ? -notional : notional;
        return {
          asset: position.symbol,
          notional: signedNotional
        };
      });

      allPositionsRaw.push(...positions);

      cursor = data.result.nextPageCursor;
      if (!cursor) break;

      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
    }

    // Fetch last prices
    // Ensure getBybitLastPriceInfo fetches all necessary tickers.
    // The limit parameter here might need to be adjusted based on how many unique assets you have.
    // If the number of unique assets can be very large, fetching all tickers at once might be an issue.
    // However, Bybit's tickers endpoint usually provides data for all available market pairs if no specific symbol is requested,
    // or it pages if a limit is hit. Check the behavior of getBybitLastPriceInfo.
    const lastPrices = await getBybitLastPriceInfo(200); // Adjust limit as needed, or modify getBybitLastPriceInfo to fetch all

    // **Optimization: Convert lastPrices to a Map for efficient lookups**
    const priceMap = new Map<string, number>();
    lastPrices.forEach(p => {
      priceMap.set(p.asset, p.lastprice);
    });

    return allPositionsRaw.map(position => {
      const lastPrice = priceMap.get(position.asset) ?? 0; // O(1) average lookup
      return {
        ...position,
        notionalValue: position.notional * lastPrice
      };
    });

  } catch (error) {
    console.error("Failed to fetch position info:", error);
    return [];
  }
}