import crypto from 'crypto';

// --- Interface for OKX Futures Position (for easier consumption) ---
export interface OkxFuturesPosition {
    symbol: string;         // Instrument ID, e.g., 'BTC-USDT-SWAP'
    side: string;           // 'long' or 'short'
    notional: number;       // Notional value (signed: positive for long, negative for short)
    initialMargin: number;  // Initial margin requirement
}

// --- Configuration ---
// It's highly recommended to use environment variables for sensitive API keys
const API_KEY = process.env.OKX_API_KEY;
const API_SECRET = process.env.OKX_API_SECRET;
const PASSPHRASE = process.env.OKX_PASSPHRASE;
const BASE_URL = 'https://www.okx.com'; // Use for production

// --- Utility Functions ---

/**
 * Fetches the current server time from OKX.
 * This is crucial for accurate timestamping in API requests to avoid 50102 errors.
 * @returns {Promise<string>} Current UTC timestamp in ISO 8601 format with milliseconds (e.g., '2023-03-15T00:00:00.000Z')
 */
async function getOkxServerTime(): Promise<string> {
    try {
        const response = await fetch(`${BASE_URL}/api/v5/public/time`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch OKX server time: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        const serverTimeMs = data.data[0].ts;

        // Convert milliseconds timestamp to ISO 8601 format
        const dtObject = new Date(parseInt(serverTimeMs, 10));
        // toISOString() already returns in 'YYYY-MM-DDTHH:mm:ss.sssZ' format
        return dtObject.toISOString();
    } catch (error: any) {
        console.error(`Error fetching OKX server time: ${error.message}`);
        // Fallback to local UTC time if server time cannot be fetched (less ideal, but better than failing)
        console.warn("Falling back to local UTC time for timestamp. Consider checking network or OKX API status.");
        return new Date().toISOString();
    }
}

/**
 * Signs the request according to OKX API V5 authentication rules.
 * @param timestamp The UTC timestamp in ISO 8601 format.
 * @param method The HTTP method (e.g., 'GET', 'POST').
 * @param requestPath The API endpoint path (e.g., '/api/v5/account/balance').
 * @param body The request body string (empty for GET requests without parameters in URL).
 * @param secretKey Your OKX API Secret Key.
 * @returns {string} The Base64 encoded HMAC SHA256 signature.
 */
function signRequest(
    timestamp: string,
    method: string,
    requestPath: string,
    body: string,
    secretKey: string
): string {
    // The prehash string format: timestamp + method + requestPath + body
    const prehashString = timestamp + method + requestPath + body;

    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(prehashString);
    const signature = hmac.digest('base64');

    return signature;
}


/**
 * Fetches all open futures positions from OKX and returns symbol, side, notional, and initialMargin.
 * @returns {Promise<OkxFuturesPosition[]>}
 */
export async function fetchOkxFuturesPositions(): Promise<OkxFuturesPosition[]> {
    if (!API_KEY || !API_SECRET || !PASSPHRASE) {
        throw new Error('OKX API credentials (API_KEY, API_SECRET, PASSPHRASE) are not configured.');
    }
    const endpoint = '/api/v5/account/positions';
    const timestamp = await getOkxServerTime();
    const method = 'GET';
    const requestPath = endpoint;
    const body = '';
    const signature = signRequest(timestamp, method, requestPath, body, API_SECRET);
    const headers = {
        'OK-ACCESS-KEY': API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': PASSPHRASE,
        'Content-Type': 'application/json',
    };
    const url = `${BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url, {
            method: method,
            headers: headers,
            cache: 'no-store',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OKX API error: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        if (data.code !== '0' || !data.data || !Array.isArray(data.data)) {
            throw new Error(`API returned an error or no data: Code ${data.code}, Message: ${data.msg || 'N/A'}`);
        }
        const positions = data.data;
        const results: OkxFuturesPosition[] = [];
        for (const pos of positions) {
            const symbol = pos.instId;
            // Determine side based on pos (position quantity)
            const positionQuantity = parseFloat(pos.pos);
            let side: string;
            if (positionQuantity > 0) {
                side = 'long';
            } else if (positionQuantity < 0) {
                side = 'short';
            } else {
                // If pos is 0, it means no actual position, you might want to filter these out
                // or handle as "net" or "closed" based on your needs.
                // For now, let's skip if no actual position quantity.
                continue;
            }

            let notional = 0;
            if (pos.notionalUsd !== undefined && pos.notionalUsd !== null) {
                notional = parseFloat(pos.notionalUsd);
            } else if (pos.pos && pos.markPx) {
                // Calculate notional based on absolute position quantity and mark price
                notional = Math.abs(positionQuantity) * parseFloat(pos.markPx);
            }
            // Apply the correct sign to notional based on actual side
            if (side === 'short') {
                notional = -Math.abs(notional);
            } else { // side === 'long'
                notional = Math.abs(notional);
            }

            // Initial margin requirement
            const initialMargin = pos.imr ? parseFloat(pos.imr) : 0;
            results.push({ symbol, side, notional, initialMargin });
        }
        return results;
    } catch (error: any) {
        console.error(`Failed to fetch futures positions: ${error.message}`);
        throw error;
    }
}