// eclipsesnow/ctrldashboard2/EclipseSnow-ctrldashboard2-6a4c07d4d65a3239cf42a7e52ae865551a78797c/app/page.tsx
import PositionsList from './components/PositionsList';
import crypto from 'crypto';

// --- Start of added/modified code ---
let cachedPageServerTime: number | null = null;
let lastPageTimeFetch: number = 0;
const PAGE_TIME_CACHE_DURATION = 55 * 1000; // Cache for 55 seconds

async function getBinanceServerTimeForPage(): Promise<number> {
  const now = Date.now();
  if (cachedPageServerTime && (now - lastPageTimeFetch < PAGE_TIME_CACHE_DURATION)) {
    return cachedPageServerTime;
  }
  try {
    const timeResponse = await fetch('https://api.binance.com/api/v3/time');
    if (!timeResponse.ok) {
      const errorText = await timeResponse.text();
      console.error(`Failed to fetch Binance server time in page.tsx. Status: ${timeResponse.status}, Error: ${errorText}`);
      // Fallback to local time, but warn that it might cause recvWindow issues
      return Date.now();
    }
    const timeData = await timeResponse.json();
    cachedPageServerTime = timeData.serverTime;
    lastPageTimeFetch = now;
    return cachedPageServerTime;
  } catch (error) {
    console.error('Error fetching Binance server time in page.tsx:', error);
    // Fallback to local time if network error
    return Date.now();
  }
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      // Check for rate limit or IP ban errors (418 and 429 are common)
      if ((response.status === 418 || response.status === 429 || errorText.includes("Way too much request weight")) && retries > 0) {
        console.warn(`Rate limit hit or IP banned in page.tsx, retrying in ${backoff / 1000} seconds... (${retries} retries left)`);
        await new Promise(res => setTimeout(res, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw new Error(`API error in page.tsx: ${response.status} ${errorText}`);
    }
    return response;
  } catch (error) {
    console.error("Error during fetchWithRetry in page.tsx:", error);
    throw error;
  }
}
// --- End of added/modified code ---

export default async function Home() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Binance API credentials are not configured');
  }

  // Use the centralized server time fetcher for this module
  const timestamp = await getBinanceServerTimeForPage();

  const queryString = `timestamp=${timestamp}&recvWindow=60000`;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');

  // Use fetchWithRetry for the main API call
  const response = await fetchWithRetry(
    `https://papi.binance.com/papi/v1/balance?${queryString}&signature=${signature}`,
    {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
      cache: 'no-store',
    }
  );

  await response.json(); // Process the response as needed

  return (
    <main className="min-h-screen p-8">
      <PositionsList />
    </main>
  );
}