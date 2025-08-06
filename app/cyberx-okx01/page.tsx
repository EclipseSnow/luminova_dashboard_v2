import { fetchOkxSpotBalancesWithNotional } from '../services/okxspotbalance';
import { fetchOkxFuturesPositions, OkxFuturesPosition } from '../services/okxfuturesbalance';
import CSVDownloadButton from '../components/CSVDownloadButton';
import Link from 'next/link';

// Asset normalization function
function normalizeAssetName(assetName: string): string {
  const normalizationMap: Record<string, string> = {
    'BETH': 'ETH',
    // Add more normalization rules here as needed
  };
  return normalizationMap[assetName] || assetName;
}

export default async function CyberXOKX01Details() {
  try {
    // Fetch data
    const spotBalances = await fetchOkxSpotBalancesWithNotional();
    const futuresPositions: OkxFuturesPosition[] = await fetchOkxFuturesPositions();

    // Create a map to combine spot and futures data by asset
    const assetMap = new Map<string, {
      asset: string;
      spotBalance: number;
      spotNotional: number;
      futuresSide: string;
      futuresNotional: number;
      initialMargin: number;
      maintenanceMargin: number;
      leverage: number;
    }>();

    // Add spot balances with normalization
    spotBalances.forEach(spot => {
      const normalizedAsset = normalizeAssetName(spot.ccy);
      if (assetMap.has(normalizedAsset)) {
        // Combine with existing asset
        const existing = assetMap.get(normalizedAsset)!;
        existing.spotBalance += spot.spotBal;
        existing.spotNotional += spot.notional_value;
      } else {
        assetMap.set(normalizedAsset, {
          asset: normalizedAsset,
          spotBalance: spot.spotBal,
          spotNotional: spot.notional_value,
          futuresSide: '',
          futuresNotional: 0,
          initialMargin: 0,
          maintenanceMargin: 0,
          leverage: 0
        });
      }
    });

    // Add futures positions with normalization
    futuresPositions.forEach(futures => {
      // Extract base asset from symbol (e.g., "BTC-USDT-SWAP" -> "BTC")
      const baseAsset = futures.symbol.split('-')[0];
      const normalizedAsset = normalizeAssetName(baseAsset);
      
      if (assetMap.has(normalizedAsset)) {
        // Update existing asset entry
        const existing = assetMap.get(normalizedAsset)!;
        existing.futuresSide = futures.side;
        // Ensure notional is negative for short positions
        existing.futuresNotional = futures.side === 'short' ? -Math.abs(futures.notional) : Math.abs(futures.notional);
        existing.initialMargin = futures.initialMargin;
        existing.maintenanceMargin = futures.maintenanceMargin;
        existing.leverage = futures.leverage;
      } else {
        // Create new asset entry for futures-only positions
        assetMap.set(normalizedAsset, {
          asset: normalizedAsset,
          spotBalance: 0,
          spotNotional: 0,
          futuresSide: futures.side,
          futuresNotional: futures.side === 'short' ? -Math.abs(futures.notional) : Math.abs(futures.notional),
          initialMargin: futures.initialMargin,
          maintenanceMargin: futures.maintenanceMargin,
          leverage: futures.leverage
        });
      }
    });

    // Convert map to array and sort by asset name
    const combinedData = Array.from(assetMap.values())
      .filter(item => item.spotBalance >= 1) // Filter out assets with spot balance less than 1
      .sort((a, b) => a.asset.localeCompare(b.asset));

    return (
      <div className="w-full p-4">
        <div className="bg-gray-50 shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">CyberX OKX 01 - Detailed View</h1>
              <p className="text-gray-600">This is the detailed view for CyberX OKX 01 portfolio.</p>
            </div>
            <CSVDownloadButton data={combinedData} filename="cyberx-okx01-positions.csv" />
          </div>
          
          {/* Positions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Asset Positions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spot Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spot Notional</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Futures Side</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Futures Notional</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Initial Margin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance Margin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leverage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {combinedData.map((item) => (
                    <tr key={item.asset} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{item.asset}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.spotBalance > 0 ? item.spotBalance.toFixed(5) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.spotNotional > 0 ? (
                          <span className="font-medium text-blue-600">
                            ${item.spotNotional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.futuresSide ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.futuresSide === 'long' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.futuresSide}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.futuresNotional !== 0 ? (
                          <span className={`font-medium ${item.futuresNotional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(item.futuresNotional).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.initialMargin > 0 ? `$${item.initialMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.maintenanceMargin > 0 ? `$${item.maintenanceMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.leverage > 0 ? item.leverage.toFixed(2) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          
          <div className="mt-6">
            <a 
              href="/" 
              className="text-blue-500 hover:underline"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading OKX data:', error);
    return (
      <div className="w-full p-4">
        <div className="bg-gray-50 shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">CyberX OKX 01 - Error</h1>
          <p className="text-red-600 mb-4">
            Failed to load portfolio data. Please check your API credentials and try again.
          </p>
          <div className="mt-6">
            <a 
              href="/" 
              className="text-blue-500 hover:underline"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
} 
