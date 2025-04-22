import PositionsList from './components/PositionsList';
import crypto from 'crypto';

export default async function Home() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Binance API credentials are not configured');
  }

  // Fetch server time
  const timeResponse = await fetch('https://api.binance.com/api/v3/time');
  if (!timeResponse.ok) {
    throw new Error('Failed to fetch Binance server time');
  }
  const timeData = await timeResponse.json();
  const timestamp = timeData.serverTime;

  const queryString = `timestamp=${timestamp}`;
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

  await response.json();
  const currentDateTime = new Date().toLocaleString();

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Binance BTC balances
      </h1>
      <p className="text-center mb-4">{`Current Date and Time: ${currentDateTime}`}</p>
      <PositionsList />
    </main>
  );
}