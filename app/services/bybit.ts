import crypto from 'crypto';

export interface BybitResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: [{
      totalEquity: string;
      accountIMRate: string;
      totalMarginBalance: string;
      totalInitialMargin: string;
      accountType: string;
      totalAvailableBalance: string;
      accountMMRate: string;
      totalPerpUPL: string;
      totalWalletBalance: string;
      accountLTV: string;
      totalMaintenanceMargin: string;
      coin: {
        availableToBorrow: string;
        bonus: string;
        accruedInterest: string;
        availableToWithdraw: string;
        totalOrderIM: string;
        equity: string;
        totalPositionMM: string;
        usdValue: string;
        spotHedgingQty: string;
        unrealisedPnl: string;
        collateralSwitch: boolean;
        borrowAmount: string;
        totalPositionIM: string;
        walletBalance: string;
        cumRealisedPnl: string;
        locked: string;
        marginCollateral: boolean;
        coin: string;
      }[];
    }];
  };
  retExtInfo: object;
  time: number;
}

let serverTimeOffset = 0;

async function syncTime() {
  try {
    const response = await fetch('https://api.bybit.com/v5/market/time');
    const data = await response.json();
    if (data.retCode === 0) {
      const serverTime = Number(data.time);
      serverTimeOffset = serverTime - Date.now();
    }
  } catch (error) {
    console.error('Failed to sync time with Bybit server:', error);
  }
}

function getServerTime(): number {
  return Date.now() + serverTimeOffset;
}

export async function getWalletBalance(): Promise<BybitResponse> {
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Bybit API credentials are not configured');
  }

  // Sync time before making the request
  await syncTime();
  
  const timestamp = getServerTime().toString();
  const recvWindow = '20000'; // Increased from 5000 to 20000
  const params = { accountType: 'UNIFIED' };
  
  // Sort parameters alphabetically and create query string
  const queryString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Generate signature - matching Python implementation
  // sign_str = timestamp + api_key + recv_window + param_str
  const signString = timestamp + apiKey + recvWindow + queryString;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signString)
    .digest('hex');

  try {
    const response = await fetch(
      `https://api.bybit.com/v5/account/wallet-balance?${queryString}`,
      {
        method: 'GET',
        headers: {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-SIGN': signature,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': recvWindow
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bybit API error: ${response.status} ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch wallet data: ${error.message}`);
    }
    throw new Error('Failed to fetch wallet data: Unknown error');
  }
}

export async function getFuturesPositions(): Promise<BybitResponse> {
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Bybit API credentials are not configured');
  }

  // Sync time before making the request
  await syncTime();
  
  const timestamp = getServerTime().toString();
  const recvWindow = '20000'; // Increased from 5000 to 20000
  const params = { accountType: 'UNIFIED' };

  const queryString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const signString = timestamp + apiKey + recvWindow + queryString;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signString)
    .digest('hex');

  try {
    const response = await fetch(
      `https://api.bybit.com/v5/account/futures-positions?${queryString}`,
      {
        method: 'GET',
        headers: {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-SIGN': signature,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': recvWindow
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bybit API error: ${response.status} ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch futures data: ${error.message}`);
    }
    throw new Error('Failed to fetch futures data: Unknown error');
  }
}

// Exporting getWalletBalance with an alias
export { getWalletBalance as getBybitWalletBalance };
