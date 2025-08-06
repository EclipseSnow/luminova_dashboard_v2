import crypto from 'crypto';

// --- Interfaces for OKX API Response ---

// Represents a single account type (e.g., Funding, Trading)
export interface OkxAccountBalance {
    acType: string;         // Account type, e.g., "1" (spot), "2" (futures), etc.
    totalEq: string;        // Total equity of the account (for all assets)
    isoEq: string;          // Isolated margin equity (if applicable)
    adjEq: string;          // Adjusted equity (if applicable)
    ordFroz: string;        // Order frozen (if applicable)
    imr: string;            // Initial margin requirement (if applicable)
    mmr: string;            // Maintenance margin requirement (if applicable)
    notionalUsd: string;    // Notional USD value (if applicable)
    mgnRatio: string;       // Margin ratio (if applicable)
    ts: string;             // Timestamp of the data
}

// The overall structure of the OKX /api/v5/account/balance response
export interface OkxBalanceResponse {
    code: string;
    msg: string;
    data: OkxAccountBalance[];
}

// --- Flattened Interface for easier consumption ---
export interface OkxAccountSummary {
    timestamp: string;
    totalEq: string;
    imr: string;
    mmr: string;
}


// --- Configuration ---
// It's highly recommended to use environment variables for sensitive API keys
const API_KEY = process.env.OKX_API_KEY || '2f807dab-d451-48d1-a58d-b7931efa52e0';
const API_SECRET = process.env.OKX_API_SECRET || 'CD7CF7515D8D776855BDEA97F7372E73';
const PASSPHRASE = process.env.OKX_PASSPHRASE || 'Luminova2025&';
const BASE_URL = 'https://www.okx.com'; // Use for production

// --- Utility Functions ---

/**
 * Fetches the current server time from OKX.
 * This is crucial for accurate timestamping in API requests to avoid 50102 errors.
 * @returns {Promise<string>} Current UTC timestamp in ISO 8601 format with milliseconds (e.g., '2023-03-15T00:00:00.000Z')
 */
async function getOkxServerTime(): Promise<string> {
    try {
        const response = await fetch(`${BASE_URL}/api/v5/public/time`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });
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
    } catch (error: unknown) { // Changed 'any' to 'unknown'
        console.error(`Error fetching OKX server time: ${error instanceof Error ? error.message : String(error)}`);
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
 * Fetches the account balance summary (totalEq, imr, mmr) from OKX.
 * @returns {Promise<OkxAccountSummary | null>} The account summary or null if an error occurs.
 */
export async function fetchOkxAccountSummary(): Promise<OkxAccountSummary | null> {
    if (!API_KEY || !API_SECRET || !PASSPHRASE) {
        throw new Error('OKX API credentials (API_KEY, API_SECRET, PASSPHRASE) are not configured.');
    }

    const endpoint = '/api/v5/account/balance';
    const timestamp = await getOkxServerTime();
    const method = 'GET';
    const requestPath = endpoint;
    const body = ''; // No body for GET requests
    const signature = signRequest(timestamp, method, requestPath, body, API_SECRET);

    const headers = {
        'OK-ACCESS-KEY': API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': PASSPHRASE,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
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

        const data: OkxBalanceResponse = await response.json();
        if (data.code !== '0' || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
            throw new Error(`API returned an error or no data: Code ${data.code}, Message: ${data.msg || 'N/A'}`);
        }

        // Assuming we are interested in the first account's summary
        const accountData = data.data[0];

        const summary: OkxAccountSummary = {
            timestamp: accountData.ts,
            totalEq: accountData.totalEq,
            imr: accountData.imr,
            mmr: accountData.mmr,
        };

        return summary;

    } catch (error: unknown) { // Changed 'any' to 'unknown'
        console.error(`Failed to fetch account summary: ${error instanceof Error ? error.message : String(error)}`);
        return null; // Return null on error as per the Python example's implicit behavior
    }
}