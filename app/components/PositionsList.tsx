import { fetchPortfolioMarginAccountInfo } from '../services/portfoliomarginaccountinfo_usdt';
import { fetchUMPositionInfo } from '../services/currentcmposition_usdt';
import { UMPositionInfo } from '../services/currentcmposition_usdt';
import { fetchAccountBalance, fetchAllPrices } from '../services/accountbalance_usdt'; // ✅ now importing fetchAllPrices
import { fetchAccountBalanceWithoutUSDT } from '../services/accountbalancewithoutusdt_usdt';
import EquityChart from './total_equity_usdt';
import NAVChart from './nav_graph_usdt';
import { calculateNAVMetrics } from './riskperformance_usdt';

import EquityChart_BTC from './total_equity_btc';
import NAVChart_BTC from './nav_graph_btc';
import { calculateNAVMetrics_BTC } from './riskperformance_btc';
import { fetchPortfolioMarginAccountInfo_BTC } from '../services/portfoliomarginaccountinfo_btc';
import { fetchUMPositionInfo_BTC } from '../services/currentcmposition_btc';
import { UMPositionInfo_BTC } from '../services/currentcmposition_btc';
import { fetchAccountBalance_BTC, fetchAllPrices_BTC } from '../services/accountbalance_btc'; // ✅ now importing fetchAllPrices
import { fetchAccountBalanceWithoutUSDT_BTC } from '../services/accountbalancewithoutusdt_btc';


export default async function PositionsList() {
  // Fetch all data
  const accountBalance = await fetchAccountBalance();
  const accountBalanceWithoutUSDT = await fetchAccountBalanceWithoutUSDT();
  const portfoliomarginaccountinfo = await fetchPortfolioMarginAccountInfo();
  const positions: UMPositionInfo[] = await fetchUMPositionInfo();
  const navMetrics = await calculateNAVMetrics();
  const prices = await fetchAllPrices(); // ✅ fetch spot prices once here

  const accountBalance_BTC = await fetchAccountBalance_BTC();
  const accountBalanceWithoutUSDT_BTC = await fetchAccountBalanceWithoutUSDT_BTC();
  const portfoliomarginaccountinfo_BTC = await fetchPortfolioMarginAccountInfo_BTC();
  const positions_BTC: UMPositionInfo_BTC[] = await fetchUMPositionInfo_BTC();
  const navMetrics_BTC = await calculateNAVMetrics_BTC();
  const prices_BTC = await fetchAllPrices_BTC(); // ✅ fetch spot prices once here

  // Calculate USDT notional value
  const usdtEntry = accountBalance.find(balance => balance.asset === 'USDT');
  const usdtPrice = prices.get('USDTUSDT') ?? 1;
  const usdtNotional = usdtEntry ? parseFloat(usdtEntry.crossMarginAsset) * usdtPrice : 0;

  const usdtEntry_BTC = accountBalance_BTC.find(balance => balance.asset === 'USDT');
  const usdtPrice_BTC = prices_BTC.get('USDTUSDT') ?? 1;
  const usdtNotional_BTC = usdtEntry_BTC ? parseFloat(usdtEntry_BTC.crossMarginAsset) * usdtPrice_BTC : 0;

  // Calculate USDC spot

  const usdcEntry_BTC = accountBalance_BTC.find(balance => balance.asset === 'USDC');
  const usdcSpotAmount_BTC = usdcEntry_BTC ? parseFloat(usdcEntry_BTC.crossMarginAsset) : 0;

  // Calculate USDCUSDT futures amount
  const usdcusdtPosition = positions.find(position => position.symbol === 'USDCUSDT');
  const usdcusdtAmount = usdcusdtPosition ? parseFloat(usdcusdtPosition.notional) : 0;

  const usdcusdtPosition_BTC = positions_BTC.find(position => position.symbol === 'USDCUSDT');
  const usdcusdtAmount_BTC = usdcusdtPosition_BTC ? parseFloat(usdcusdtPosition_BTC.notional) : 0;

  // Calculate total notional price for each account balance without USDT
  const accountBalanceWithNotional = accountBalanceWithoutUSDT.map((balance) => {
    const spotPrice = balance.asset === 'USDT' ? 1 : prices.get(`${balance.asset}USDT`) ?? 0;
    const totalNotionalValue = spotPrice * parseFloat(balance.crossMarginAsset);
    return { ...balance, totalNotionalValue };
  });

  const accountBalanceWithNotional_BTC = accountBalanceWithoutUSDT_BTC.map((balance) => {
    const spotPrice = balance.asset === 'USDT' ? 1 : prices_BTC.get(`${balance.asset}USDT`) ?? 0;
    const totalNotionalValue = spotPrice * parseFloat(balance.crossMarginAsset);
    return { ...balance, totalNotionalValue };
  });

  // Calculate spot value excluding BTC
  const spotValue = accountBalanceWithNotional
    .reduce((total, position) => total + position.totalNotionalValue, 0);

  const spotValue_BTC = accountBalanceWithNotional_BTC
    .filter(position => position.asset !== 'BTC')
    .reduce((total, position) => total + position.totalNotionalValue, 0) - usdtNotional_BTC;

  const futuresValue = positions.reduce((total, position) => total + parseFloat(position.notional), 0) - usdcusdtAmount;

  const totalEquity = parseFloat(portfoliomarginaccountinfo.actualEquity);
  const totalInitialMargin = parseFloat(portfoliomarginaccountinfo.accountInitialMargin);
  const totalPositionalExposure = spotValue + futuresValue;
  const totalLeverage = totalEquity > 0 ? (spotValue + Math.abs(futuresValue)) / totalEquity : 0;
  const totalDirectionalLeverage = totalEquity > 0 ? (spotValue + futuresValue) / totalEquity : 0;

  const futuresValue_BTC = positions_BTC.reduce((total, position) => total + parseFloat(position.notional), 0) - usdcusdtAmount_BTC;
  const totalEquity_BTC = parseFloat(portfoliomarginaccountinfo_BTC.actualEquity);
  const totalInitialMargin_BTC = parseFloat(portfoliomarginaccountinfo_BTC.accountInitialMargin);
  const totalPositionalExposure_BTC = spotValue_BTC + futuresValue_BTC;
  const totalPositionalExposureBTC = totalPositionalExposure_BTC / parseFloat(portfoliomarginaccountinfo_BTC.btcPrice);
  const totalLeverage_BTC = totalEquity_BTC > 0 ? (spotValue_BTC + Math.abs(futuresValue_BTC)) / totalEquity_BTC : 0;
  const totalDirectionalLeverage_BTC = totalEquity_BTC > 0 ? (spotValue_BTC + futuresValue_BTC) / totalEquity_BTC : 0;

  const normalizeAsset = (asset: string) => {
    let normalized = asset.replace('USDT', '').toUpperCase();
    if (normalized.startsWith('10000')) {
      normalized = normalized.slice(5);
    } else if (normalized.startsWith('1000')) {
      normalized = normalized.slice(4);
    } else if (normalized.endsWith('1000')) {
      normalized = normalized.slice(0, -4);
    }
    return normalized;
  };

  const normalizeAsset_BTC = (asset: string) => {
    let normalized = asset.replace('USDT', '').toUpperCase();
    if (normalized.startsWith('10000')) {
      normalized = normalized.slice(5);
    } else if (normalized.startsWith('1000')) {
      normalized = normalized.slice(4);
    } else if (normalized.endsWith('1000')) {
      normalized = normalized.slice(0, -4);
    }
    return normalized;
  };

  // Filter positions
  const filteredPositions = positions.filter(position => position.symbol !== 'USDCUSDT');
  const filteredPositions_BTC = positions_BTC.filter(position => position.symbol !== 'USDCUSDT');

  const futuresMap = new Map(
    filteredPositions.map(position => [normalizeAsset(position.symbol), position.notional])
  );

  const futuresMap_BTC = new Map(
    filteredPositions_BTC.map(position => [normalizeAsset_BTC(position.symbol), position.notional])
  );

  const spotMap = new Map(
    accountBalanceWithNotional
      .filter(position => position.asset !== 'USDC')
      .map(position => [normalizeAsset(position.asset), position.totalNotionalValue])
  );

  const spotMap_BTC = new Map(
    accountBalanceWithNotional_BTC
      .filter(position => position.asset !== 'USDC')
      .map(position => [normalizeAsset_BTC(position.asset), position.totalNotionalValue])
  );

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
    })
    .filter(position => position.asset !== 'BTC');

  const combinedData_BTC = Array.from(new Set([...spotMap_BTC.keys(), ...futuresMap_BTC.keys()]))
    .map(asset => {
      const spot = parseFloat(String(spotMap_BTC.get(asset) || '0'));
      const futures = parseFloat(String(futuresMap_BTC.get(asset) || '0'));
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
    })
    .filter(position => position.asset !== 'BTC');

  const significantPositions = combinedData
    .filter(position => position.grossExposurePercent > 2)
    .sort((a, b) => a.netExposure - b.netExposure);

  const significantPositions_BTC = combinedData_BTC
    .filter(position => position.grossExposurePercent > 2)
    .sort((a, b) => a.netExposure - b.netExposure);

  const insignificantPositions = combinedData
    .filter(position => position.grossExposurePercent <= 2)
    .sort((a, b) => a.netExposure - b.netExposure);

  const insignificantPositions_BTC = combinedData_BTC
    .filter(position => position.grossExposurePercent <= 2)
    .sort((a, b) => a.netExposure - b.netExposure);

  // Get today's date
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

  // Calculate a start date, e.g., 20 days before today
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 20);
  const formattedStartDate = startDate.toISOString().split('T')[0];

  return (
    <div className="w-full p-4">
      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Binance USDT 01</h2>
          <p className="text-sm text-gray-600">Current Date and Time: {new Date().toLocaleString()}</p>
          <button className="text-sm text-blue-500 hover:underline">View Details &gt;&gt;</button>
        </div>

        {/* 3 vertical sections */}
        <div className="flex flex-row w-full space-x-6">

          {/* 1. Combined Left Card */}
          <div className="w-[40%] bg-gray-50 p-4 rounded-md text-[15px] border flex items-center justify-center">
            <div className="flex flex-row justify-center items-start space-x-16 w-full">

              {/* Left: Account Metrics */}
              <div className="flex flex-col space-y-2 w-1/2">
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Equity (USDT)</span>
                  <span>${totalEquity.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Positional Exposure (USDT)</span>
                  <span>${totalPositionalExposure.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Maintenance Margin</span>
                  <span>${parseFloat(portfoliomarginaccountinfo.accountMaintMargin).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Initial Margin</span>
                  <span>${parseFloat(portfoliomarginaccountinfo.accountInitialMargin).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Leverage</span>
                  <span>{totalLeverage.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Directional Leverage</span>
                  <span>{totalDirectionalLeverage.toFixed(2)}</span>
                </div>
              </div>

              {/* Right: PnL Metrics */}
              <div className="flex flex-col space-y-2 w-1/2">
                <div className="flex gap-2">
                  <span className="w-[140px] font-semibold">Period</span>
                  <span>{formattedStartDate} - {formattedToday}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[140px] font-semibold">Period PnL</span>
                  <span>{navMetrics?.period_pnl}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[140px] font-semibold">Period PnL %</span>
                  <span>{navMetrics?.period_pnl_percent}%</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[140px] font-semibold">Max Drawdown</span>
                  <span>{navMetrics?.max_drawdown}%</span>
                </div>
              </div>

            </div>
          </div>
          {/* 2. Charts Section (Right) */}
          <div className="w-[60%] flex flex-row space-x-4">

            {/* Net Assets Chart */}
            <div className="w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <EquityChart />
            </div>

            {/* NAV Chart */}
            <div className="w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVChart color="orange" />
            </div>

          </div>

        </div>
      </div>

      <div className="h-4" /> 
      {/* Divider */}

      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Binance BTC 01</h2>
          <p className="text-sm text-gray-600">Current Date and Time: {new Date().toLocaleString()}</p>
          <button className="text-sm text-blue-500 hover:underline">View Details &gt;&gt;</button>
        </div>

        {/* 3 vertical sections */}
        <div className="flex flex-row w-full space-x-6">

          {/* 1. Combined Left Card */}
          <div className="w-[40%] bg-gray-50 p-4 rounded-md text-[15px] border flex items-center justify-center">
            <div className="flex flex-row justify-center items-start space-x-16 w-full">

              {/* Left: Account Metrics */}
              <div className="flex flex-col space-y-2 w-1/2">
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Equity (BTC)</span>
                  <span>${totalEquity_BTC.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Positional Exposure (BTC)</span>
                  <span>{totalPositionalExposureBTC.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Maintenance Margin</span>
                  <span>${parseFloat(portfoliomarginaccountinfo_BTC.accountMaintMargin).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Initial Margin</span>
                  <span>${parseFloat(portfoliomarginaccountinfo_BTC.accountInitialMargin).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Leverage</span>
                  <span>{totalLeverage_BTC.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[200px] font-semibold">Total Directional Leverage</span>
                  <span>{totalDirectionalLeverage_BTC.toFixed(2)}</span>
                </div>
              </div>

              {/* Right: PnL Metrics */}
              <div className="flex flex-col space-y-2 w-1/2">
                <div className="flex gap-2">
                  <span className="w-[140px] font-semibold">Period</span>
                  <span>{formattedStartDate} - {formattedToday}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[140px] font-semibold">Period PnL</span>
                  <span>{navMetrics_BTC?.period_pnl}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[140px] font-semibold">Period PnL %</span>
                  <span>{navMetrics_BTC?.period_pnl_percent}%</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-[140px] font-semibold">Max Drawdown</span>
                  <span>{navMetrics_BTC?.max_drawdown}%</span>
                </div>
              </div>

            </div>
          </div>
          {/* 2. Charts Section (Right) */}
          <div className="w-[60%] flex flex-row space-x-4">

            {/* Net Assets Chart */}
            <div className="w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <EquityChart_BTC />
            </div>

            {/* NAV Chart */}
            <div className="w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVChart_BTC color="orange" />
            </div>

          </div>

        </div>
      </div>
    </div>

  );
}
