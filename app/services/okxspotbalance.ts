import crypto from 'crypto';

// --- Interfaces for OKX API Response ---

// Represents the detailed balance of a single currency within an account type
export interface OkxAssetDetail {
    ccy: string;        // Currency, e.g., "BTC", "USDT"
    bal: string;        // Total balance
    availBal: string;   // Available balance
    frozenBal: string;  // Frozen balance
    liqHold: string;    // Liquidation hold (if applicable)
    maxLoan: string;    // Max loan (if applicable)
    eq: string;         // Equity (specific to certain account types like margin/futures)
    usdVal: string;     // Estimated USD value of the asset
    // Add other fields from OKX API if you need them:
    // fuzedBal: string;
    // liab: string;
    // disEq: string;
    // eqUsd: string;
    // borrowFroz: string;
    // spotInUseAmt: string;
}

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
    details: OkxAssetDetail[]; // Array of detailed asset balances within this account
}

// The overall structure of the OKX /api/v5/account/balance response
export interface OkxBalanceResponse {
    code: string;
    msg: string;
    data: OkxAccountBalance[];
}

// --- Flattened Interface for easier consumption ---
export interface FlattenedOkxAssetBalance {
    accountType: string;
    currency: string;
    totalBalance: string;
    availableBalance: string;
    frozenBalance: string;
    equity?: string; // Optional as not all account types have it
    usdValue?: string; // Optional as not all account types have it
}

// --- Configuration ---
// It's highly recommended to use environment variables for sensitive API keys
const API_KEY = process.env.OKX_API_KEY;
const API_SECRET = process.env.OKX_API_SECRET;
const PASSPHRASE = process.env.OKX_PASSPHRASE;
const BASE_URL = 'https://www.okx.com'; // Use for production

// Cache for API responses
let spotBalanceCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

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
 * Fetches the spot price for a given instrument (e.g., BTC-USDT) from OKX.
 * @param instId The instrument ID (e.g., 'BTC-USDT').
 * @returns {Promise<number | null>} The last traded price, or null if not found.
 */
async function getSpotPrice(instId: string): Promise<number | null> {
    try {
        const response = await fetch(`${BASE_URL}/api/v5/market/ticker?instId=${instId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.data && data.data[0] && data.data[0].last) {
            return parseFloat(data.data[0].last);
        }
        return null;
    } catch (error: unknown) { // Changed 'any' to 'unknown'
        console.error(`Error fetching spot price for ${instId}: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

/**
 * Fetches the spot balances from OKX and returns only ccy, spotBal, spot_price, and notional_value.
 * @returns {Promise<{ccy: string, spotBal: number, spot_price: number, notional_value: number}[]>}
 */
export async function fetchOkxSpotBalancesWithNotional(): Promise<{
    ccy: string;
    spotBal: number;
    spot_price: number;
    notional_value: number;
}[]> {
    // Check cache first
    const now = Date.now();
    if (spotBalanceCache && (now - spotBalanceCache.timestamp) < CACHE_DURATION) {
        return spotBalanceCache.data;
    }

    if (!API_KEY || !API_SECRET || !PASSPHRASE) {
        throw new Error('OKX API credentials (API_KEY, API_SECRET, PASSPHRASE) are not configured.');
    }

    const endpoint = '/api/v5/account/balance';
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
        if (data.code !== '0' || !data.data || !Array.isArray(data.data)) {
            throw new Error(`API returned an error or no data: Code ${data.code}, Message: ${data.msg || 'N/A'}`);
        }
        // Only use the first account (usually spot)
        const details = data.data[0]?.details || [];
        const stablecoins = ['USDT', 'USDC', 'DAI'];
        const results: { ccy: string; spotBal: number; spot_price: number; notional_value: number }[] = [];
        for (const asset of details) {
            const ccy = asset.ccy;
            const spotBal = parseFloat(asset.availBal);
            if (spotBal <= 0.00000001) continue;
            let spot_price: number;
            if (stablecoins.includes(ccy)) {
                spot_price = 1.0;
            } else {
                const instId = `${ccy}-USDT`;
                const price = await getSpotPrice(instId);
                spot_price = price !== null ? price : 0.0;
            }
            const notional_value = spotBal * spot_price;
            results.push({ ccy, spotBal, spot_price, notional_value });
        }
        
        // Cache the results
        spotBalanceCache = {
            data: results,
            timestamp: now
        };
        
        return results;
    } catch (error: unknown) { // Changed 'any' to 'unknown'
        console.error(`Failed to fetch spot balances: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}