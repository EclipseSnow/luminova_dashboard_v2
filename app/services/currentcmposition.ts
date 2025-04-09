import crypto from 'crypto';

// Define a new interface for the CM Position Information
export interface CMPositionInfo {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  positionSide: string;
  updateTime: number;
  maxQty: string;
  notionalValue: string;
}

export async function fetchCMPositionInfo(): Promise<CMPositionInfo[]> {
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

    const queryString = `timestamp=${timestamp}`;
    
    // Generate signature
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    const response = await fetch(
      `https://papi.binance.com/papi/v1/um/positionRisk?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Binance API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: response.url,
        headers: response.headers,
      });
      throw new Error(`Binance API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from Binance API');
    }

    // Iterate over each position and log it to the console
    data.forEach((position, index) => {
      console.log(`Position ${index + 1}:`, position);
    });

    // Log the entire data to the console
    console.log('Fetched CM Position Info:', data);

    return data as CMPositionInfo[];
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to fetch CM position info:', error);
      throw new Error(`Failed to fetch CM position info: ${error.message}`);
    } else {
      console.error('Failed to fetch CM position info:', error);
      throw new Error('Failed to fetch CM position info: Unknown error');
    }
  }
}

export interface UMPositionInfo {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  positionSide: string;
  updateTime: number;
  maxNotionalValue: string;
  notional: string;
}

export async function fetchUMPositionInfo(): Promise<UMPositionInfo[]> {
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

    const queryString = `timestamp=${timestamp}`;
    
    // Generate signature
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    const response = await fetch(
      `https://papi.binance.com/papi/v1/um/positionRisk?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Binance API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: response.url,
        headers: response.headers,
      });
      throw new Error(`Binance API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from Binance API');
    }

    // Iterate over each position and log it to the console
    data.forEach((position, index) => {
      console.log(`Position ${index + 1}:`, position);
    });

    // Log the entire data to the console
    console.log('Fetched UM Position Info:', data);

    return data as UMPositionInfo[];
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to fetch UM position info:', error);
      throw new Error(`Failed to fetch UM position info: ${error.message}`);
    } else {
      console.error('Failed to fetch UM position info:', error);
      throw new Error('Failed to fetch UM position info: Unknown error');
    }
  }
}
