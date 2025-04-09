import { fetchPortfolioMarginAccountInfo } from '../services/portfoliomarginaccountinfo';
import { fetchUMPositionInfo } from '../services/currentcmposition';
import { UMPositionInfo } from '../services/currentcmposition';
import { fetchAccountBalance, fetchSpotPrice as fetchSpotPriceFromService } from '../services/accountbalance';
import { fetchAccountBalanceWithoutUSDT } from '../services/accountbalancewithoutusdt';
import { fetchInterestHistory } from '../services/interest';

export default async function PositionsList() {
  // Fetch account balance
  const accountBalance = await fetchAccountBalance();
  // Fetch account balance without USDT
  const accountBalanceWithoutUSDT = await fetchAccountBalanceWithoutUSDT();
  // Fetch portfolio margin account info
  const portfoliomarginaccountinfo = await fetchPortfolioMarginAccountInfo();
  // Fetch positions
  const positions: UMPositionInfo[] = await fetchUMPositionInfo();
  // Fetch interest history
  const interestHistory = await fetchInterestHistory();

  // Calculate USDT notional value
  const usdtEntry = accountBalance.find(balance => balance.asset === 'USDT');
  const usdtNotional = usdtEntry ? parseFloat(usdtEntry.crossMarginAsset) * await fetchSpotPrice('USDT') : 0;

  // Calculate total notional price for each account balance without USDT
  const accountBalanceWithNotional = await Promise.all(
    accountBalanceWithoutUSDT.map(async (balance) => {
      const spotPrice = await fetchSpotPrice(balance.asset);
      const totalNotionalValue = spotPrice * parseFloat(balance.crossMarginAsset);
      return { ...balance, totalNotionalValue };
    })
  );

  const spotValue = accountBalanceWithNotional.reduce((total, position) => total + position.totalNotionalValue, 0);

  const futuresValue = positions.reduce((total, position) => total + parseFloat(position.notional), 0);

  const totalEquity = parseFloat(portfoliomarginaccountinfo.actualEquity);

  const totalInitialMargin = parseFloat(portfoliomarginaccountinfo.accountInitialMargin);

  const totalMaintenanceMargin = parseFloat(portfoliomarginaccountinfo.accountMaintMargin);

  const totalLeverage = totalEquity > 0 ? (spotValue + Math.abs(futuresValue)) / totalEquity : 0;

  const totalDirectionalLeverage = totalEquity > 0 ? (spotValue + futuresValue) / totalEquity : 0;

  const totalPositionalExposure = spotValue + futuresValue;

  const normalizeAsset = (asset: string) => {
    // Remove 'USDT' and convert to uppercase
    let normalized = asset.replace('USDT', '').toUpperCase();

    // Handle specific cases where futures and spot have different prefixes or suffixes
    if (normalized.startsWith('10000')) {
      normalized = normalized.slice(5); // Remove '1000' prefix
    } else if (normalized.startsWith('1000')) {
      normalized = normalized.slice(4); // Remove '10000' prefix
    } else if (normalized.endsWith('1000')) {
      normalized = normalized.slice(0, -4); // Remove '1000' suffix
    }

    return normalized;
  };

  // Create a map for quick lookup of futures positions by asset
  const futuresMap = new Map(
    positions.map(position => [normalizeAsset(position.symbol), position.notional])
  );

  // Create a map for quick lookup of spot positions by asset
  const spotMap = new Map(
    accountBalanceWithNotional.map(position => [normalizeAsset(position.asset), position.totalNotionalValue])
  );

  // Combine spot and futures data into a single array for table display
  const combinedData = Array.from(new Set([...spotMap.keys(), ...futuresMap.keys()]))
    .map(asset => {
      const spot = parseFloat(String(spotMap.get(asset) || '0'));
      const futures = parseFloat(String(futuresMap.get(asset) || '0'));
      const netExposure = spot + futures;
      const grossExposure = spot + Math.abs(futures);
      return {
        asset,
        spot,
        futures,
        netExposure,
        netExposurePercent: totalEquity > 0 ? (netExposure / totalEquity) * 100 : 0,
        grossExposure,
        grossExposurePercent: totalEquity > 0 ? (grossExposure / totalEquity) * 100 : 0,
      };
    });

  // Filter significant positions (>2% gross exposure)
  const significantPositions = combinedData
    .filter(position => position.grossExposurePercent > 2)
    .sort((a, b) => a.netExposure - b.netExposure);

  // Filter insignificant positions (<=2% gross exposure)
  const insignificantPositions = combinedData
    .filter(position => position.grossExposurePercent <= 2)
    .sort((a, b) => a.netExposure - b.netExposure);

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      {/* Account Summary Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center mb-4">Account Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column */}
          <div className="col-span-1 md:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="bg-indigo-100 border border-indigo-300 rounded-lg shadow p-4 flex items-center justify-center">
              <div>
                <h3 className="text-sm text-indigo-700 font-medium text-center">Total Equity</h3>
                <p className="text-xl font-bold text-indigo-900 text-center">
                  ${parseFloat(portfoliomarginaccountinfo.actualEquity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-pink-100 border border-pink-300 rounded-lg shadow p-4 flex items-center justify-center">
                <div>
                  <h3 className="text-sm text-pink-700 font-medium text-center">Total Maintenance Margin</h3>
                  <p className="text-xl font-bold text-pink-900 text-center">
                    ${parseFloat(portfoliomarginaccountinfo.accountMaintMargin).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg shadow p-4 flex items-center justify-center">
                <div>
                  <h3 className="text-sm text-yellow-700 font-medium text-center">Total Initial Margin</h3>
                  <p className="text-xl font-bold text-yellow-900 text-center">
                    ${totalInitialMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="bg-teal-100 border border-teal-300 rounded-lg shadow p-4 flex items-center justify-center">
                <div>
                  <h3 className="text-sm text-teal-700 font-medium text-center">Total Leverage</h3>
                  <p className="text-xl font-bold text-teal-900 text-center">
                    {totalLeverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="bg-orange-100 border border-orange-300 rounded-lg shadow p-4 flex items-center justify-center">
                <div>
                  <h3 className="text-sm text-orange-700 font-medium text-center">Total Directional Leverage</h3>
                  <p className="text-xl font-bold text-orange-900 text-center">
                    {totalDirectionalLeverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-1 md:col-span-5 space-y-4 flex flex-col justify-between">
            {/* First Card: Total Positional Exposure */}
            <div className="bg-blue-100 border border-blue-300 rounded-lg shadow p-4 flex items-center justify-center h-full">
              <div>
                <h3 className="text-sm text-blue-700 font-medium text-center">Total Positional Exposure</h3>
                <p className="text-xl font-bold text-blue-900 text-center">
                  ${totalPositionalExposure.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Second Card: Spot, Futures, and USDT Debt */}
            <div className="bg-purple-100 border border-purple-300 rounded-lg shadow p-4">
              <div>
                <h3 className="text-sm text-purple-700 font-medium text-center">Spot (including Margin) Value</h3>
                <p className="text-lg font-bold text-purple-900 text-center">
                  ${spotValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-green-700 font-medium text-center">Futures Value</h3>
                <p className="text-lg font-bold text-green-900 text-center">
                  ${futuresValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-red-700 font-medium text-center">USDT Notional Balance</h3>
                <p className="text-lg font-bold text-red-900 text-center">
                  ${usdtNotional.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Positional Exposure Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-center mb-4">Exposure Info</h2>

        {/* Show count of filtered positions and sorting info */}
        <div className="mb-4 text-gray-600 text-sm">
          <p>Showing {significantPositions.length} positions with &gt;2% gross exposure (sorted from most negative)</p>
          {insignificantPositions.length > 0 && (
            <p className="text-gray-400">
              ({insignificantPositions.length} smaller positions hidden)
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Currency</th>
                <th className="text-right py-2 px-4">Spot & Margin</th>
                <th className="text-right py-2 px-4">Futures</th>
                <th className="text-right py-2 px-4">Net Exposure($)</th>
                <th className="text-right py-2 px-4">Net Exposure%</th>
                <th className="text-right py-2 px-4">Gross Exposure($)</th>
                <th className="text-right py-2 px-4">Gross Exposure%</th>
              </tr>
            </thead>
            <tbody>
              {significantPositions.map(({ asset, spot, futures, netExposure, netExposurePercent, grossExposure, grossExposurePercent }) => (
                <tr key={asset} className="even:bg-gray-100 hover:bg-gray-50">
                  <td className="py-1.5 px-4">{asset}</td>
                  <td className="py-1.5 px-4 text-right">{spot.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
                  <td className="py-1.5 px-4 text-right">{futures.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
                  <td className="py-1.5 px-4 text-right">{netExposure.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-1.5 px-4 text-right">{netExposurePercent.toFixed(2)}%</td>
                  <td className="py-1.5 px-4 text-right">{grossExposure.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-1.5 px-4 text-right font-medium">{grossExposurePercent.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// Updated function to fetch spot price for a given asset
export async function fetchSpotPrice(asset: string): Promise<number> {
  if (asset === 'USDT') {
    return 1; // Set spot price to 1 for USDT
  }

  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${asset}USDT`);
    if (!response.ok) {
      throw new Error(`Failed to fetch spot price for ${asset}. Status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching spot price for ${asset}:`, error);
    throw error;
  }
}
