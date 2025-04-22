import crypto from 'crypto';
// Define a new interface for the Account Balance
export interface AccountBalance {
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

export async function fetchAccountBalance(): Promise<AccountBalance[]> {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

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
      // console.error('Binance API Error:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   error: errorText,
      //   url: response.url,
      //   headers: response.headers,
      // });
      throw new Error(`Binance API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      // console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from Binance API');
    }

    return data as AccountBalance[];
  } catch (error) {
    if (error instanceof Error) {
      // console.error('Failed to fetch account balance:', error);
      throw new Error(`Failed to fetch account balance: ${error.message}`);
    } else {
      // console.error('Failed to fetch account balance:', error);
      throw new Error('Failed to fetch account balance: Unknown error');
    }
  }
}

// New function to fetch spot price for a given asset
export async function fetchSpotPrice(asset: string): Promise<number> {
  if (asset === 'USDT') {
    return 1; // Set spot price to 1 for USDT
  }

  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${asset}USDT`);
    if (!response.ok) {
      throw new Error(`Failed to fetch spot price for ${asset}`);
    }
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching spot price for ${asset}:`, error);
    throw error;
  }
}
