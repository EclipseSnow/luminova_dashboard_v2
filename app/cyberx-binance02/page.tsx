import { fetchAccountBalanceWithoutUSDT } from '../../services/accountbalancewithoutusdt_usdt';
import { fetchUMPositionInfo, UMPositionInfo } from '../../services/currentcmposition_usdt';
import { fetchAllPrices, AccountBalance } from '../../services/accountbalance_usdt';
import CSVDownloadButton from '../CSVDownloadButton';
import Link from 'next/link';

// Asset normalization function
function normalizeAssetName(assetName: string): string {
  const normalizationMap: Record<string, string> = {
    'BETH': 'ETH',
    // Add more normalization rules here as needed
  };
  return normalizationMap[assetName] || assetName;
}

export default async function CyberXBinance01Details() {
  try {
    // Fetch data
    const accountBalances = await fetchAccountBalanceWithoutUSDT();
    const futuresPositions = await fetchUMPositionInfo();
    const prices = await fetchAllPrices();

    // Create a map to combine spot and futures data by asset
    const assetMap = new Map<string, {
      asset: string;
      spotBalance: number;
      spotNotional: number;
      futuresSide: string;
      futuresNotional: number;
      entryPrice: number;
      unRealizedProfit: number;
      leverage: number;
      liquidationPrice: number;
    }>();

    // Add spot balances with normalization
    accountBalances.forEach((balance: AccountBalance) => {
      const normalizedAsset = normalizeAssetName(balance.asset);
      const spotBalance = parseFloat(balance.crossMarginAsset);
      const spotPrice = normalizedAsset === 'USDT' ? 1 : prices.get(`${normalizedAsset}USDT`) ?? 0;
      const spotNotional = spotBalance * spotPrice;

      if (assetMap.has(normalizedAsset)) {
        // Combine with existing asset
        const existing = assetMap.get(normalizedAsset)!;
        existing.spotBalance += spotBalance;
        existing.spotNotional += spotNotional;
      } else {
        assetMap.set(normalizedAsset, {
          asset: normalizedAsset,
          spotBalance: spotBalance,
          spotNotional: spotNotional,
          futuresSide: '',
          futuresNotional: 0,
          entryPrice: 0,
          unRealizedProfit: 0,
          leverage: 0,
          liquidationPrice: 0
        });
      }
    });

    // Add futures positions with normalization
    futuresPositions.forEach((futures: UMPositionInfo) => {
      // Extract base asset from symbol (e.g., "BTCUSDT" -> "BTC")
      const baseAsset = futures.symbol.replace('USDT', '');
      const normalizedAsset = normalizeAssetName(baseAsset);
      
      if (assetMap.has(normalizedAsset)) {
        // Update existing asset entry
        const existing = assetMap.get(normalizedAsset)!;
        existing.futuresSide = parseFloat(futures.positionAmt) > 0 ? 'long' : 'short';
        // Ensure notional is negative for short positions
        existing.futuresNotional = parseFloat(futures.positionAmt) > 0 ? 
          Math.abs(parseFloat(futures.notional)) : -Math.abs(parseFloat(futures.notional));
        existing.entryPrice = parseFloat(futures.entryPrice);
        existing.unRealizedProfit = parseFloat(futures.unRealizedProfit);
        existing.leverage = parseFloat(futures.leverage);
        existing.liquidationPrice = parseFloat(futures.liquidationPrice);
      } else {
        // Create new asset entry for futures-only positions
        assetMap.set(normalizedAsset, {
          asset: normalizedAsset,
          spotBalance: 0,
          spotNotional: 0,
          futuresSide: parseFloat(futures.positionAmt) > 0 ? 'long' : 'short',
          futuresNotional: parseFloat(futures.positionAmt) > 0 ? 
            Math.abs(parseFloat(futures.notional)) : -Math.abs(parseFloat(futures.notional)),
          entryPrice: parseFloat(futures.entryPrice),
          unRealizedProfit: parseFloat(futures.unRealizedProfit),
          leverage: parseFloat(futures.leverage),
          liquidationPrice: parseFloat(futures.liquidationPrice)
        });
      }
    });

    // Convert map to array and sort by asset name
    const combinedData = Array.from(assetMap.values())
      .filter(item => item.spotBalance >= 1 || Math.abs(item.futuresNotional) > 0) // Filter out assets with no significant balance
      .sort((a, b) => a.asset.localeCompare(b.asset));

    return (
      <div className="w-full p-4">
        <div className="bg-gray-50 shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">CyberX CTA 币安 01 - Detailed View</h1>
              <p className="text-gray-600">This is the detailed view for CyberX CTA 币安 01 portfolio.</p>
            </div>
            <CSVDownloadButton data={combinedData} filename="cyberx-binance01-positions.csv" type="binance" />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unrealized P&L</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leverage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liquidation Price</th>
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
                        {item.entryPrice > 0 ? (
                          <span className="font-medium text-gray-900">
                            ${item.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.unRealizedProfit !== 0 ? (
                          <span className={`font-medium ${item.unRealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${item.unRealizedProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.leverage > 0 ? item.leverage.toFixed(2) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.liquidationPrice > 0 ? (
                          <span className="font-medium text-gray-900">
                            ${item.liquidationPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          
          <div className="mt-6">
            <Link 
              href="/" 
              className="text-blue-500 hover:underline"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading Binance data:', error);
    return (
      <div className="w-full p-4">
        <div className="bg-gray-50 shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">CyberX CTA 币安 01 - Error</h1>
          <p className="text-red-600 mb-4">
            Failed to load portfolio data. Please check your API credentials and try again.
          </p>
          <div className="mt-6">
            <Link 
              href="/" 
              className="text-blue-500 hover:underline"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
} 
