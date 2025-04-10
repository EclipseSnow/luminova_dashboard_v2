import crypto from 'crypto';
// Define a new interface for the Portfolio Margin Pro Account Info
export interface PortfolioMarginAccountInfo {
  uniMMR: string;
  accountEquity: string;
  actualEquity: string;
  accountMaintMargin: string;
  accountInitialMargin: string;
  totalAvailableBalance: string;
  accountStatus: string;
  accountType: string;
  accountEquityinBTC: string;
  btcPrice: string;
}

export async function fetchPortfolioMarginAccountInfo(): Promise<PortfolioMarginAccountInfo> {
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
      `https://papi.binance.com/papi/v1/account?${queryString}&signature=${signature}`,
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
    if (!data || typeof data !== 'object') {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from Binance API');
    }

    // Fetch the latest BTC price
    const btcPriceResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    if (!btcPriceResponse.ok) {
      throw new Error('Failed to fetch BTC price');
    }
    const btcPriceData = await btcPriceResponse.json();
    const btcPrice = parseFloat(btcPriceData.price);

    // Calculate accountEquityinBTC
    const accountEquity = parseFloat(data.accountEquity);
    data.accountEquityinBTC = (accountEquity / btcPrice).toString();
    data.btcPrice = btcPrice.toString();

    return data as PortfolioMarginAccountInfo;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to fetch portfolio margin pro account info:', error);
      throw new Error(`Failed to fetch portfolio margin pro account info: ${error.message}`);
    } else {
      console.error('Failed to fetch portfolio margin pro account info:', error);
      throw new Error('Failed to fetch portfolio margin pro account info: Unknown error');
    }
  }
}

