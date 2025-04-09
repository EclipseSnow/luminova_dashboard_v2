import crypto from 'crypto';

export interface InterestHistory {
  txId: number;
  interestAccuredTime: number;
  asset: string;
  rawAsset: string;
  principal: string;
  interest: string;
  interestRate: string;
  type: string;
}

export async function fetchInterestHistory(): Promise<InterestHistory[]> {
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
      `https://papi.binance.com/papi/v1/margin/marginInterestHistory?${queryString}&signature=${signature}`,
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
    if (!Array.isArray(data.rows)) {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from Binance API');
    }

    // Log the entire data to the console
    console.log('Fetched Interest History:', data.rows);

    return data.rows as InterestHistory[];
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to fetch interest history:', error);
      throw new Error(`Failed to fetch interest history: ${error.message}`);
    } else {
      console.error('Failed to fetch interest history:', error);
      throw new Error('Failed to fetch interest history: Unknown error');
    }
  }
}
