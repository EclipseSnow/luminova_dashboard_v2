import { fetchPortfolioMarginAccountInfo } from '../services/portfoliomarginaccountinfo_usdt';
import { fetchUMPositionInfo } from '../services/currentcmposition_usdt';
import { UMPositionInfo } from '../services/currentcmposition_usdt';
import { fetchAllPrices } from '../services/accountbalance_usdt'; // ✅ now importing fetchAllPrices
import { fetchAccountBalanceWithoutUSDT } from '../services/accountbalancewithoutusdt_usdt';
import EquityChart1 from './wabit_total_equity_usdt1';
import NAVChart1 from './wabit_nav_graph_usdt2';
import { calculateNAVMetrics1 } from './wabit_riskperformance_usdt1';

import { fetchPortfolioMarginAccountInfo2 } from '../services/portfoliomarginaccountinfo_usdt_2';
import { fetchUMPositionInfo2 } from '../services/currentcmposition_usdt_2';
import { UMPositionInfo2 } from '../services/currentcmposition_usdt_2';
import { fetchAccountBalanceWithoutUSDT2 } from '../services/accountbalancewithoutusdt_usdt_2';
import EquityChart2 from './wabit_total_equity_usdt2';
import NAVChart2 from './wabit_nav_graph_usdt2';
import { calculateNAVMetrics2 } from './wabit_riskperformance_usdt2';

import { fetchPortfolioMarginAccountInfoCyber1 } from '../services/portfoliomarginaccountinfo_cyber1';
import { fetchPositionInfoCyber1 } from '../services/futurespositioncyber1';
import { fetchAccountBalanceCyber1 } from '../services/spotpositioncyber1';
import { fetchAccountBalanceWithoutUSDTCyber1 } from '../services/accountbalancewithoutusdt_cyber1';
import EquityChartCyber1 from './wabit_total_equity_cyber1';
import NAVChartCyber1 from './wabit_nav_graph_cyber1';
import { calculateNAVMetricsCyber1 } from './wabit_riskperformance_cyber1';

import { fetchPortfolioMarginAccountInfoCyber2 } from '../services/portfoliomarginaccountinfo_cyber2';
import { fetchPositionInfoCyber2 } from '../services/futurespositioncyber2';
import { fetchAccountBalanceCyber2 } from '../services/spotpositioncyber2';
import { fetchAccountBalanceWithoutUSDTCyber2 } from '../services/accountbalancewithoutusdt_cyber2';
import EquityChartCyber2 from './wabit_total_equity_cyber2';
import NAVChartCyber2 from './wabit_nav_graph_cyber2';
import { calculateNAVMetricsCyber2 } from './wabit_riskperformance_cyber2';


export default async function PositionsList() {
  // Fetch all data
  // Fetch account balances
  const accountBalanceWithoutUSDT = await fetchAccountBalanceWithoutUSDT();
  const portfoliomarginaccountinfo = await fetchPortfolioMarginAccountInfo();
  const positions: UMPositionInfo[] = await fetchUMPositionInfo();
  const navMetrics1 = await calculateNAVMetrics1();
  const prices = await fetchAllPrices(); // ✅ fetch spot prices once here

  const accountBalanceWithoutUSDT2 = await fetchAccountBalanceWithoutUSDT2();
  const portfoliomarginaccountinfo2 = await fetchPortfolioMarginAccountInfo2();
  const positions2: UMPositionInfo2[] = await fetchUMPositionInfo2();
  const navMetrics2 = await calculateNAVMetrics2();
  // Calculate USDT notional value
  // const usdtEntry = accountBalance.find(balance => balance.asset === 'USDT');
  // const usdtPrice = prices.get('USDTUSDT') ?? 1;

  const PortfolioMarginAccountInfoCyber1 = await fetchPortfolioMarginAccountInfoCyber1();
  const accountBalanceWithoutUSDTCyber1 = await fetchAccountBalanceWithoutUSDTCyber1();
  const PositionInfoCyber1 = await fetchPositionInfoCyber1();
  const accountbalanceCyber1 = await fetchAccountBalanceCyber1();
  const navMetricsCyber1 = await calculateNAVMetricsCyber1();

  const PortfolioMarginAccountInfoCyber2 = await fetchPortfolioMarginAccountInfoCyber2();
  const accountBalanceWithoutUSDTCyber2 = await fetchAccountBalanceWithoutUSDTCyber2();
  const PositionInfoCyber2 = await fetchPositionInfoCyber2();
  const accountbalanceCyber2 = await fetchAccountBalanceCyber2();
  const navMetricsCyber2 = await calculateNAVMetricsCyber2();

  // Calculate USDCUSDT futures amount
  const usdcusdtPosition = positions.find(position => position.symbol === 'USDCUSDT');
  const usdcusdtAmount = usdcusdtPosition ? parseFloat(usdcusdtPosition.notional) : 0;

  const usdcusdtPosition2 = positions2.find(position => position.symbol === 'USDCUSDT');
  const usdcusdtAmount2 = usdcusdtPosition2 ? parseFloat(usdcusdtPosition2.notional) : 0;

  // Calculate total notional price for Cyber account balance
  const accountBalanceWithNotionalCyber1 = accountBalanceWithoutUSDTCyber1.map((balance) => {
    let spotPrice = 0;
    let totalNotionalValue = 0;

    if (balance.asset === 'USDT') {
      spotPrice = 1;
      totalNotionalValue = spotPrice * parseFloat(balance.crossMarginAsset);
    } else if (balance.asset === 'BNSOL') {
      const bnsSolPrice = prices.get('BNSOLSOL') ?? 0;
      const solUsdtPrice = prices.get('SOLUSDT') ?? 0;
      totalNotionalValue = bnsSolPrice * parseFloat(balance.crossMarginAsset) * solUsdtPrice;
    } else if (balance.asset === 'WBETH') {
      const wbethEthPrice = prices.get('WBETHETH') ?? 0;
      const ethUsdtPrice = prices.get('ETHUSDT') ?? 0;
      totalNotionalValue = wbethEthPrice * parseFloat(balance.crossMarginAsset) * ethUsdtPrice;
    } else {
      spotPrice = prices.get(`${balance.asset}USDT`) ?? 0;
      totalNotionalValue = spotPrice * parseFloat(balance.crossMarginAsset);
    }

    return { ...balance, totalNotionalValue };
  });

  // Calculate total notional price for Cyber account balance
  const accountBalanceWithNotionalCyber2 = accountBalanceWithoutUSDTCyber2.map((balance) => {
    let spotPrice = 0;
    let totalNotionalValue = 0;

    if (balance.asset === 'USDT') {
      spotPrice = 1;
      totalNotionalValue = spotPrice * parseFloat(balance.crossMarginAsset);
    } else if (balance.asset === 'BNSOL') {
      const bnsSolPrice = prices.get('BNSOLSOL') ?? 0;
      const solUsdtPrice = prices.get('SOLUSDT') ?? 0;
      totalNotionalValue = bnsSolPrice * parseFloat(balance.crossMarginAsset) * solUsdtPrice;
    } else if (balance.asset === 'WBETH') {
      const wbethEthPrice = prices.get('WBETHETH') ?? 0;
      const ethUsdtPrice = prices.get('ETHUSDT') ?? 0;
      totalNotionalValue = wbethEthPrice * parseFloat(balance.crossMarginAsset) * ethUsdtPrice;
    } else {
      spotPrice = prices.get(`${balance.asset}USDT`) ?? 0;
      totalNotionalValue = spotPrice * parseFloat(balance.crossMarginAsset);
    }

    return { ...balance, totalNotionalValue };
  });

  // Calculate total notional price for each account balance without USDT
  const accountBalanceWithNotional = accountBalanceWithoutUSDT.map((balance) => {
    const spotPrice = balance.asset === 'USDT' ? 1 : prices.get(`${balance.asset}USDT`) ?? 0;
    const totalNotionalValue = spotPrice * parseFloat(balance.crossMarginAsset);
    return { ...balance, totalNotionalValue };
  });

  const accountBalanceWithNotional2 = accountBalanceWithoutUSDT2.map((balance) => {
    const spotPrice = balance.asset === 'USDT' ? 1 : prices.get(`${balance.asset}USDT`) ?? 0;
    const totalNotionalValue = spotPrice * parseFloat(balance.crossMarginAsset);
    return { ...balance, totalNotionalValue };
  });

  // Calculate spot value excluding BTC
  const spotValue = accountBalanceWithNotional
    .reduce((total, position) => total + position.totalNotionalValue, 0);

  const spotValue2 = accountBalanceWithNotional2
    .reduce((total, position) => total + position.totalNotionalValue, 0);

  const spotValueCyber1 = accountBalanceWithNotionalCyber1
    .reduce((total, position) => total + position.totalNotionalValue, 0);
  
  const spotValueCyber2 = accountBalanceWithNotionalCyber2
    .reduce((total, position) => total + position.totalNotionalValue, 0);

  const futuresValue = positions.reduce((total, position) => total + parseFloat(position.notional), 0) - usdcusdtAmount;
  const futuresValue2 = positions2.reduce((total, position) => total + parseFloat(position.notional), 0) - usdcusdtAmount2;

  const futuresValueCyber1 = PositionInfoCyber1.reduce((total, position) => total + parseFloat(position.notional), 0);
  const futuresValueCyber2 = PositionInfoCyber2.reduce((total, position) => total + parseFloat(position.notional), 0);

  const totalEquity = parseFloat(portfoliomarginaccountinfo.actualEquity);
  const totalPositionalExposure = spotValue + futuresValue;
  const totalLeverage = totalEquity > 0 ? (spotValue + Math.abs(futuresValue)) / totalEquity : 0;
  const totalDirectionalLeverage = totalEquity > 0 ? (spotValue + futuresValue) / totalEquity : 0;

  const totalEquity2 = parseFloat(portfoliomarginaccountinfo2.actualEquity);
  const totalPositionalExposure2 = spotValue2 + futuresValue2;
  const totalLeverage2 = totalEquity2 > 0 ? (spotValue2 + Math.abs(futuresValue2)) / totalEquity2 : 0;
  const totalDirectionalLeverage2 = totalEquity2 > 0 ? (spotValue2 + futuresValue2) / totalEquity2 : 0;

  const totalEquityCyber1 = parseFloat(PortfolioMarginAccountInfoCyber1.actualEquity);
  const totalPositionalExposureCyber1 = spotValueCyber1 + futuresValueCyber1;
  const totalLeverageCyber1 = totalEquityCyber1 > 0 ? (spotValueCyber1 + Math.abs(futuresValueCyber1)) / totalEquityCyber1 : 0;
  const totalDirectionalLeverageCyber1 = totalEquityCyber1 > 0 ? (spotValueCyber1 + futuresValueCyber1) / totalEquityCyber1 : 0;

  const totalEquityCyber2 = parseFloat(PortfolioMarginAccountInfoCyber2.actualEquity);
  const totalPositionalExposureCyber2 = spotValueCyber2 + futuresValueCyber2;
  const totalLeverageCyber2 = totalEquityCyber2 > 0 ? (spotValueCyber2 + Math.abs(futuresValueCyber2)) / totalEquityCyber2 : 0;
  const totalDirectionalLeverageCyber2 = totalEquityCyber2 > 0 ? (spotValueCyber2 + futuresValueCyber2) / totalEquityCyber2 : 0;

  // Get today's date

  const inceptionDate1 = navMetrics1?.inceptionDate || 'N/A';
  const inceptionDate2 = navMetrics2?.inceptionDate || 'N/A';
  const inceptionDateCyber1 = navMetricsCyber1?.inceptionDate || 'N/A';
  const inceptionDateCyber2 = navMetricsCyber2?.inceptionDate || 'N/A';

  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

  // Calculate a start date, e.g., 20 days before today

  // Function to get the current date and time in UTC+8
  const getCurrentDateTimeInUTC8 = () => {
    const options = { timeZone: 'Asia/Shanghai', hour12: false };
    return new Date().toLocaleString('en-US', options);
  };


  //CYBERX PORTFOLIO MARGIN PRO

  return (
    <div className="w-full p-4">
      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Wabit Binance USDT 01</h2>
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
                  ['Period', `${inceptionDate1} to ${formattedToday}`],
                  ['Period PnL (USDT)', navMetrics1?.period_pnl != null
                    ? `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(navMetrics1.period_pnl))}`
                    : '—'],
                  ['Period PnL %', `${navMetrics1?.period_pnl_percent}%`],
                  ['Max Drawdown', `${navMetrics1?.max_drawdown}%`],
                  ['Annualized Return (1Y)', `${navMetrics1?.annualized_return_1Y}%`]
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
              <EquityChart2/>
            </div>

            {/* NAV Chart */}
            <div className="w-full lg:w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVChart2 color="orange" />
            </div>

          </div>

        </div>
      </div>

      <div className="h-4" />
      {/* Divider */}

      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Wabit Binance USDT 02</h2>
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
                  ['Total Equity (USDT)', `$${totalEquity2.toLocaleString()}`],
                  ['Total Positional Exposure (USDT)', `$${totalPositionalExposure2.toLocaleString()}`],
                  ['Total Maintenance Margin', `$${parseFloat(portfoliomarginaccountinfo2.accountMaintMargin).toLocaleString()}`],
                  ['Total Initial Margin', `$${parseFloat(portfoliomarginaccountinfo2.accountInitialMargin).toLocaleString()}`],
                  ['Total Leverage', totalLeverage2.toFixed(2)],
                  ['Total Directional Leverage', totalDirectionalLeverage2.toFixed(2)]
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
                  ['Period', `${inceptionDate2} to ${formattedToday}`],
                  ['Period PnL (USDT)', navMetrics2?.period_pnl != null
                    ? `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(navMetrics2.period_pnl))}`
                    : '—'],
                  ['Period PnL %', `${navMetrics2?.period_pnl_percent}%`],
                  ['Max Drawdown', `${navMetrics2?.max_drawdown}%`],
                  ['Annualized Return (1Y)', `${navMetrics2?.annualized_return_1Y}%`]
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
              <EquityChart1 />
            </div>

            {/* NAV Chart */}
            <div className="w-full lg:w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVChart1 color="orange" />
            </div>

          </div>

        </div>
      </div>

      <div className="h-4" />
      {/* Divider */}

      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">CyberX Binance USDT 01</h2>
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
                  ['Total Equity (USDT)', `$${totalEquityCyber1.toLocaleString()}`],
                  ['Total Positional Exposure (USDT)', `$${totalPositionalExposureCyber1.toLocaleString()}`],
                  ['Total Maintenance Margin', `$${parseFloat(PortfolioMarginAccountInfoCyber1.accountMaintMargin).toLocaleString()}`],
                  ['Total Initial Margin', `$${parseFloat(PortfolioMarginAccountInfoCyber1.accountInitialMargin).toLocaleString()}`],
                  ['Total Leverage', totalLeverageCyber1.toFixed(2)],
                  ['Total Directional Leverage', totalDirectionalLeverageCyber1.toFixed(2)]
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
                  ['Period', `${inceptionDateCyber1} to ${formattedToday}`],
                  ['Period PnL (USDT)', navMetricsCyber1?.period_pnl != null
                    ? `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(navMetricsCyber1.period_pnl))}`
                    : '—'],
                  ['Period PnL %', `${navMetricsCyber1?.period_pnl_percent}%`],
                  ['Max Drawdown', `${navMetricsCyber1?.max_drawdown}%`],
                  ['Annualized Return (1Y)', `${navMetricsCyber1?.annualized_return_1Y}%`]
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
              <EquityChartCyber1 />
            </div>

            {/* NAV Chart */}
            <div className="w-full lg:w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVChartCyber1 color="orange" />
            </div>

          </div>

        </div>
      </div>

      <div className="h-4" />
      {/* Divider */}


      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">CyberX Binance USDT 02</h2>
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
                  ['Total Equity (USDT)', `$${totalEquityCyber2.toLocaleString()}`],
                  ['Total Positional Exposure (USDT)', `$${totalPositionalExposureCyber2.toLocaleString()}`],
                  ['Total Maintenance Margin', `$${parseFloat(PortfolioMarginAccountInfoCyber2.accountMaintMargin).toLocaleString()}`],
                  ['Total Initial Margin', `$${parseFloat(PortfolioMarginAccountInfoCyber2.accountInitialMargin).toLocaleString()}`],
                  ['Total Leverage', totalLeverageCyber2.toFixed(2)],
                  ['Total Directional Leverage', totalDirectionalLeverageCyber2.toFixed(2)]
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
                  ['Period', `${inceptionDateCyber1} to ${formattedToday}`],
                  ['Period PnL (USDT)', navMetricsCyber1?.period_pnl != null
                    ? `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(navMetricsCyber1.period_pnl))}`
                    : '—'],
                  ['Period PnL %', `${navMetricsCyber2?.period_pnl_percent}%`],
                  ['Max Drawdown', `${navMetricsCyber2?.max_drawdown}%`],
                  ['Annualized Return (1Y)', `${navMetricsCyber2?.annualized_return_1Y}%`]
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
              <EquityChartCyber2 />
            </div>

            {/* NAV Chart */}
            <div className="w-full lg:w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVChartCyber2 color="orange" />
            </div>

          </div>

        </div>
      </div>


    </div>

  );
}
