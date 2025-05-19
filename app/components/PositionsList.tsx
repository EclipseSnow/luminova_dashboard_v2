import { fetchPortfolioMarginAccountInfo } from '../services/portfoliomarginaccountinfo_usdt';
import { fetchUMPositionInfo } from '../services/currentcmposition_usdt';
import { UMPositionInfo } from '../services/currentcmposition_usdt';
import { fetchAllPrices } from '../services/accountbalance_usdt'; // ✅ now importing fetchAllPrices
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

import { getWalletBalance } from '../services/bybit';
import { fetchSpotNotional } from '../services/bybitspot';
import { getBybitPositionInfo, PositionInfo } from '../services/bybitfutures';
import { fetchUsdtDebt } from '../services/bybit_usdt_debt';
import { getBybitLastPriceInfo, LastPriceInfo } from '../services/bybitlastprice';




export default async function PositionsList() {
  // Fetch all data
  // const accountBalance = await fetchAccountBalance(); // Removed unused variable
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
  // const usdtEntry = accountBalance.find(balance => balance.asset === 'USDT');
  // const usdtPrice = prices.get('USDTUSDT') ?? 1;

  const usdtEntry_BTC = accountBalance_BTC.find(balance => balance.asset === 'USDT');
  const usdtPrice_BTC = prices_BTC.get('USDTUSDT') ?? 1;
  const usdtNotional_BTC = usdtEntry_BTC ? parseFloat(usdtEntry_BTC.crossMarginAsset) * usdtPrice_BTC : 0;

  // const usdcEntry_BTC = accountBalance_BTC.find(balance => balance.asset === 'USDC'); // Removed unused variable

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
  const totalPositionalExposure = spotValue + futuresValue;
  const totalLeverage = totalEquity > 0 ? (spotValue + Math.abs(futuresValue)) / totalEquity : 0;
  const totalDirectionalLeverage = totalEquity > 0 ? (spotValue + futuresValue) / totalEquity : 0;

  const futuresValue_BTC = positions_BTC.reduce((total, position) => total + parseFloat(position.notional), 0) - usdcusdtAmount_BTC;
  const totalEquity_BTC = parseFloat(portfoliomarginaccountinfo_BTC.actualEquity);
  const totalPositionalExposure_BTC = spotValue_BTC + futuresValue_BTC;
  const totalPositionalExposureBTC = totalPositionalExposure_BTC / parseFloat(portfoliomarginaccountinfo_BTC.btcPrice);
  const totalLeverage_BTC = totalEquity_BTC > 0 ? (spotValue_BTC + Math.abs(futuresValue_BTC)) / totalEquity_BTC : 0;
  const totalDirectionalLeverage_BTC = totalEquity_BTC > 0 ? (spotValue_BTC + futuresValue_BTC) / totalEquity_BTC : 0;

  //BYBIT

  const bybitWalletBalanceResponse = await getWalletBalance();
  const bybitWalletBalance = bybitWalletBalanceResponse.result; // Assuming getWalletBalance returns the full BybitResponse

  // Parallelize other API calls
  const [
    futuresPositions,
    spotPositions,
    usdtDebtData,
    lastPriceInfo,
  ] = await Promise.all([
    getBybitPositionInfo(),
    fetchSpotNotional(),
    fetchUsdtDebt(),
    getBybitLastPriceInfo(),
  ]);

  // Normalize asset identifiers to ensure consistency
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
  const futuresMap_BYBIT = new Map(futuresPositions.map(position => [normalizeAsset(position.asset), position.notionalValue]));

  // Create a map for quick lookup of spot positions by asset
  const spotMap_BYBIT = new Map(spotPositions.map(position => [normalizeAsset(position.asset), position.notional]));

  // Now bybitWalletBalance is fetched within the component
  if (!bybitWalletBalance || !bybitWalletBalance.list || bybitWalletBalance.list.length < 1) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No wallet balance data available.</p>
        </div>
      </div>
    );
  }

  const walletData_BYBIT = bybitWalletBalance.list[0];
  const totalEquity_BYBIT = parseFloat(walletData_BYBIT.totalEquity);

  // Extract the USDT debt notional
  const usdtDebtNotional = usdtDebtData.length > 0 ? usdtDebtData[0].notional : 0;

  // Calculate spot value by summing up all spot positions
  const spotValue_BYBIT = spotPositions.reduce((total, position) => total + position.notional, 0);

  // Calculate futures value by summing up all futures positions
  const futuresValue_BYBIT = futuresPositions.reduce((total, position) => total + position.notionalValue, 0);

  // Calculate total positional exposure
  const totalPositionalExposure_BYBIT = spotValue_BYBIT + futuresValue_BYBIT;

  // Calculate total leverage
  const totalLeverage_BYBIT = totalEquity_BYBIT > 0 ? (spotValue_BYBIT + Math.abs(futuresValue_BYBIT)) / totalEquity_BYBIT : 0;

  // Calculate total directional leverage
  const totalInitialMargin_BYBIT = parseFloat(walletData_BYBIT.totalInitialMargin);
  const totalDirectionalLeverage_BYBIT = totalEquity_BYBIT > 0 ? (spotValue_BYBIT + futuresValue_BYBIT) / totalEquity_BYBIT : 0;

  // Combine spot and futures data into a single array for table display
  const combinedData_BYBIT = Array.from(new Set([...spotMap_BYBIT.keys(), ...futuresMap_BYBIT.keys()])).map(asset => {
    const spot = spotMap_BYBIT.get(asset) || 0;
    const futures = futuresMap_BYBIT.get(asset) || 0;
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

  // Filter significant positions (>2% gross exposure) instead of >1%
  // const significantPositions = combinedData
  //   .filter(position => position.grossExposurePercent > 2)
  //   .sort((a, b) => a.netExposure - b.netExposure);

  // const insignificantPositions = combinedData
  //   .filter(position => position.grossExposurePercent <= 2)
  //   .sort((a, b) => a.netExposure - b.netExposure);

  //BYBIT END

  // Filter positions
  // const filteredPositions = positions.filter(position => position.symbol !== 'USDCUSDT');
  // const filteredPositions_BTC = positions_BTC.filter(position => position.symbol !== 'USDCUSDT');

  // const futuresMap = new Map( // Removed unused variable
  //   filteredPositions.map(position => [normalizeAsset(position.symbol), position.notional])
  // );

  // const futuresMap_BTC = new Map( // Removed unused variable
  //   filteredPositions_BTC.map(position => [normalizeAsset_BTC(position.symbol), position.notional])
  // );

  // const spotMap = new Map( // Removed unused variable
  //   accountBalanceWithNotional
  //     .filter(position => position.asset !== 'USDC')
  //     .map(position => [normalizeAsset(position.asset), position.totalNotionalValue])
  // );

  // const spotMap_BTC = new Map( // Removed unused variable
  //   accountBalanceWithNotional_BTC
  //     .filter(position => position.asset !== 'USDC')
  //     .map(position => [normalizeAsset_BTC(position.asset), position.totalNotionalValue])
  // );

  // Get today's date
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

  // Calculate a start date, e.g., 20 days before today
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 20);
  const formattedStartDate = startDate.toISOString().split('T')[0];

  // Function to get the current date and time in UTC+8
  const getCurrentDateTimeInUTC8 = () => {
    const options = { timeZone: 'Asia/Shanghai', hour12: false };
    return new Date().toLocaleString('en-US', options);
  };

  return (
    <div className="w-full p-4">
      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Binance USDT 01</h2>
          <p className="text-sm text-gray-600">Current Date and Time: {getCurrentDateTimeInUTC8()}</p>
          <button className="text-sm text-blue-500 hover:underline">View Details &gt;&gt;</button>
        </div>

        {/* 3 vertical sections */}
        <div className="flex flex-col lg:flex-row w-full space-y-4 lg:space-y-0 lg:space-x-6">

          <div className="w-full lg:w-[45%] bg-gray-50 p-4 rounded-md text-[15px] border flex items-center justify-center">
            {/* This inner container now stacks columns on small screens and makes them row on large screens */}
            <div className="flex flex-col lg:flex-row justify-start items-start w-full">

              {/* Left: Account Metrics */}
              {/* On small screens, pr-0. On lg screens, it will have pr-4 if it's not the last item in a row. */}
              <div className="w-full lg:w-1/2 flex flex-col space-y-3 pr-0 lg:pr-2"> {/* Reduced right padding for lg when side-by-side */}
                {[
                  ['Total Equity (USDT)', `$${totalEquity.toLocaleString()}`],
                  ['Total Positional Exposure (USDT)', `$${totalPositionalExposure.toLocaleString()}`],
                  ['Total Maintenance Margin', `$${parseFloat(portfoliomarginaccountinfo.accountMaintMargin).toLocaleString()}`],
                  ['Total Initial Margin', `$${parseFloat(portfoliomarginaccountinfo.accountInitialMargin).toLocaleString()}`],
                  ['Total Leverage', totalLeverage.toFixed(2)],
                  ['Total Directional Leverage', totalDirectionalLeverage.toFixed(2)]
                ].map(([label, value]) => (
                  // Using CSS Grid for robust label-value alignment
                  // Adjust minmax(100px, auto) if you need more or less space for labels minimally
                  <div className="grid grid-cols-[minmax(100px,_auto)_1fr] gap-x-2 items-baseline" key={label}>
                    <span className="font-semibold break-words text-left">{label}:</span>
                    <span className="break-words text-left lg:text-right">{value}</span>
                  </div>
                ))}
              </div>

              {/* Separator for small screens (top border) and large screens (left border) */}
              <div className="w-full lg:w-auto lg:h-full my-4 lg:my-0 lg:mx-2"> {/* Adjusted margin/padding for separator */}
                <div className="border-t border-gray-200 lg:border-t-0 lg:border-l lg:h-full"></div>
              </div>

              {/* Right: PnL Metrics */}
              {/* On small screens, pt-4. On lg screens, pl-2. */}
              <div className="w-full lg:w-1/2 flex flex-col space-y-3 pt-4 lg:pt-0 lg:pl-0 lg:pl-2">
                {[
                  ['Period', `${formattedStartDate} to ${formattedToday}`],
                  ['Period PnL (USDT)', navMetrics?.period_pnl != null
                    ? `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(navMetrics.period_pnl))}`
                    : '—'],
                  ['Period PnL %', `${navMetrics?.period_pnl_percent}%`],
                  ['Max Drawdown', `${navMetrics?.max_drawdown}%`],
                  ['Annualized Return (1Y)', `${navMetrics?.annualized_return_1Y}%`]
                ].map(([label, value]) => (
                  <div className="grid grid-cols-[minmax(100px,_auto)_1fr] gap-x-2 items-baseline" key={label}>
                    <span className="font-semibold break-words text-left">{label}:</span>
                    <span className="break-words text-left lg:text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* 2. Charts Section (Right) */}
          <div className="w-full lg:w-[55%] flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">

            {/* Net Assets Chart */}
            <div className="w-full lg:w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <EquityChart />
            </div>

            {/* NAV Chart */}
            <div className="w-full lg:w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVChart color="orange" />
            </div>

          </div>

        </div>
      </div>

      <div className="h-4" />
      {/* Divider */}
      
      {/* BINANCE */}
      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Binance BTC 01</h2>
          <p className="text-sm text-gray-600">
            Current Date and Time: {getCurrentDateTimeInUTC8()} | BTC Price: ${parseFloat(portfoliomarginaccountinfo_BTC.btcPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <button className="text-sm text-blue-500 hover:underline">View Details &gt;&gt;</button>
        </div>

        {/* 3 vertical sections */}
        <div className="flex flex-row w-full space-x-6">

          {/* 1. Combined Left Card */}
          <div className="w-full lg:w-[45%] bg-gray-50 p-4 rounded-md text-[15px] border flex items-center justify-center">
            {/* This inner container now stacks columns on small screens and makes them row on large screens */}
            <div className="flex flex-col lg:flex-row justify-start items-start w-full">

              {/* Left: BTC Account Metrics */}
              <div className="w-full lg:w-1/2 flex flex-col space-y-3 pr-0 lg:pr-2"> {/* Reduced right padding for lg when side-by-side */}
                {[
                  ['Total Equity (BTC)', parseFloat(portfoliomarginaccountinfo_BTC.accountEquityinBTC).toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })],
                  ['Total Positional Exposure (BTC)', totalPositionalExposureBTC.toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })],
                  ['Total Maintenance Margin', `$${parseFloat(portfoliomarginaccountinfo_BTC.accountMaintMargin).toLocaleString()}`],
                  ['Total Initial Margin', `$${parseFloat(portfoliomarginaccountinfo_BTC.accountInitialMargin).toLocaleString()}`],
                  ['Total Leverage', totalLeverage_BTC.toFixed(2)],
                  ['Total Directional Leverage', totalDirectionalLeverage_BTC.toFixed(2)]
                ].map(([label, value]) => (
                  // Using CSS Grid for robust label-value alignment
                  // Adjust minmax(100px, auto) if you need more or less space for labels minimally
                  <div className="grid grid-cols-[minmax(100px,_auto)_1fr] gap-x-2 items-baseline" key={label}>
                    <span className="font-semibold break-words text-left">{label}:</span>
                    <span className="break-words text-left lg:text-right">{value}</span>
                  </div>
                ))}
              </div>

              {/* Separator for small screens (top border) and large screens (left border) */}
              <div className="w-full lg:w-auto lg:h-full my-4 lg:my-0 lg:mx-2"> {/* Adjusted margin/padding for separator */}
                <div className="border-t border-gray-200 lg:border-t-0 lg:border-l lg:h-full"></div>
              </div>

              {/* Right: BTC PnL & Performance Metrics */}
              <div className="w-full lg:w-1/2 flex flex-col space-y-3 pt-4 lg:pt-0 lg:pl-2"> {/* Reduced left padding for lg when side-by-side */}
                {[
                  ['Period', `${formattedStartDate} to ${formattedToday}`],
                  ['Period PnL (BTC)', navMetrics_BTC?.period_pnl ? parseFloat(navMetrics_BTC.period_pnl).toFixed(8) : 'N/A'],
                  ['Period PnL %', `${navMetrics_BTC?.period_pnl_percent}%`],
                  ['Max Drawdown', `${navMetrics_BTC?.max_drawdown}%`],
                  ['Annualized Return (1Y)', `${navMetrics_BTC?.annualized_return_1Y}%`]
                ].map(([label, value]) => (
                  // Using CSS Grid for robust label-value alignment
                  <div className="grid grid-cols-[minmax(100px,_auto)_1fr] gap-x-2 items-baseline" key={label}>
                    <span className="font-semibold break-words text-left">{label}:</span>
                    <span className="break-words text-left lg:text-right">{value}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>


          {/* 2. Charts Section (Right) */}
          <div className="w-[55%] flex flex-row space-x-4">

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

      <div className="h-4" />
      {/* Divider */}

      {/* BYBIT */}
      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">BYBIT 01</h2>
          <p className="text-sm text-gray-600">
            Current Date and Time: {getCurrentDateTimeInUTC8()}
          </p>
          <button className="text-sm text-blue-500 hover:underline">View Details &gt;&gt;</button>
        </div>

        {/* 3 vertical sections */}
        <div className="flex flex-row w-full space-x-6">

          {/* 1. Combined Left Card */}
          <div className="w-full lg:w-[45%] bg-gray-50 p-4 rounded-md text-[15px] border flex items-center justify-center">
            {/* This inner container now stacks columns on small screens and makes them row on large screens */}
            <div className="flex flex-col lg:flex-row justify-start items-start w-full">

              {/* Left: BTC Account Metrics */}
              <div className="w-full lg:w-1/2 flex flex-col space-y-3 pr-0 lg:pr-2"> {/* Reduced right padding for lg when side-by-side */}
                {[
                  ['Total Equity', `$${parseFloat(walletData_BYBIT.totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                  ['Total Positional Exposure', totalPositionalExposure_BYBIT.toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })],
                  ['Total Maintenance Margin', `$${parseFloat(walletData_BYBIT.totalMaintenanceMargin).toLocaleString()}`],
                  ['Total Initial Margin', `$${parseFloat(walletData_BYBIT.totalInitialMargin).toLocaleString()}`],
                  ['Total Leverage', totalLeverage_BYBIT.toFixed(2)],
                  ['Total Directional Leverage', totalDirectionalLeverage_BYBIT.toFixed(2)]
                ].map(([label, value]) => (
                  // Using CSS Grid for robust label-value alignment
                  // Adjust minmax(100px, auto) if you need more or less space for labels minimally
                  <div className="grid grid-cols-[minmax(100px,_auto)_1fr] gap-x-2 items-baseline" key={label}>
                    <span className="font-semibold break-words text-left">{label}:</span>
                    <span className="break-words text-left lg:text-right">{value}</span>
                  </div>
                ))}
              </div>

              {/* Separator for small screens (top border) and large screens (left border) */}
              <div className="w-full lg:w-auto lg:h-full my-4 lg:my-0 lg:mx-2"> {/* Adjusted margin/padding for separator */}
                <div className="border-t border-gray-200 lg:border-t-0 lg:border-l lg:h-full"></div>
              </div>

              {/* Right: BTC PnL & Performance Metrics */}
              <div className="w-full lg:w-1/2 flex flex-col space-y-3 pt-4 lg:pt-0 lg:pl-2"> {/* Reduced left padding for lg when side-by-side */}
                {[
                  ['Period', `${formattedStartDate} to ${formattedToday}`],
                  ['Period PnL (BTC)', navMetrics_BTC?.period_pnl ? parseFloat(navMetrics_BTC.period_pnl).toFixed(8) : 'N/A'],
                  ['Period PnL %', `${navMetrics_BTC?.period_pnl_percent}%`],
                  ['Max Drawdown', `${navMetrics_BTC?.max_drawdown}%`],
                  ['Annualized Return (1Y)', `${navMetrics_BTC?.annualized_return_1Y}%`]
                ].map(([label, value]) => (
                  // Using CSS Grid for robust label-value alignment
                  <div className="grid grid-cols-[minmax(100px,_auto)_1fr] gap-x-2 items-baseline" key={label}>
                    <span className="font-semibold break-words text-left">{label}:</span>
                    <span className="break-words text-left lg:text-right">{value}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>


          {/* 2. Charts Section (Right) */}
          <div className="w-[55%] flex flex-row space-x-4">

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
