import { fetchPortfolioMarginAccountInfo } from '../services/portfoliomarginaccountinfo_usdt';
import { fetchUMPositionInfo } from '../services/currentcmposition_usdt';
import { UMPositionInfo } from '../services/currentcmposition_usdt';
import { fetchAllPrices } from '../services/accountbalance_usdt'; // ✅ now importing fetchAllPrices
import { fetchAccountBalanceWithoutUSDT } from '../services/accountbalancewithoutusdt_usdt';
import EquityChartCyberBinance1 from './totalequity_cyberX_binance1';
import NAVCyberBinance1 from './nav_graph_cyberX_binance1';
import { calculateNAVMetricsCyberBinance1 } from './riskperformance_cyberX_binance1';

import { fetchPortfolioMarginAccountInfo2 } from '../services/portfoliomarginaccountinfo_usdt_2';
import { fetchUMPositionInfo2 } from '../services/currentcmposition_usdt_2';
import { UMPositionInfo2 } from '../services/currentcmposition_usdt_2';
import { fetchAccountBalanceWithoutUSDT2 } from '../services/accountbalancewithoutusdt_usdt_2';
import EquityChartCyberBinance2 from './totalequity_cyberX_binance2';
import NAVCyberBinance2 from './nav_graph_cyberX_binance2';
import { calculateNAVMetricsCyberBinance2 } from './riskperformance_cyberX_binance2';

import { fetchPortfolioMarginAccountInfo3 } from '../services/portfoliomarginaccountinfo_usdt_3';
import { fetchUMPositionInfo3 } from '../services/currentcmposition_usdt_3';
import { UMPositionInfo3 } from '../services/currentcmposition_usdt_3';
import { fetchAccountBalanceWithoutUSDT3 } from '../services/accountbalancewithoutusdt_usdt_3';
import EquityChartCyberBinance3 from './totalequity_cyberX_binance3';
import NAVCyberBinance3 from './nav_graph_cyberX_binance3';
import { calculateNAVMetricsCyberBinance3 } from './riskperformance_cyberX_binance3';

import { fetchOkxSpotBalancesWithNotional } from '../services/okxspotbalance';
import { fetchOkxFuturesPositions, OkxFuturesPosition } from '../services/okxfuturesbalance';
import { fetchOkxAccountSummary } from '../services/okxaccountbalance';
import EquityChartCyberOKX1 from './totalequity_cyberX_OKX1';
import NAVChartOKX1 from './nav_graph_cyberX_OKX1';
import { calculateNAVMetricsCyberOKX1 } from './riskperformance_cyberX_OKX1';


export default async function PositionsList() {
  // Fetch all data
  // Fetch account balances;
  const okxSpotBalances = await fetchOkxSpotBalancesWithNotional();
  const okxFuturesPositions: OkxFuturesPosition[] = await fetchOkxFuturesPositions();
  const accountbalanceOKX = await fetchOkxAccountSummary();
  const navMetricsOKX1 = await calculateNAVMetricsCyberOKX1();
  
  const accountBalanceWithoutUSDT = await fetchAccountBalanceWithoutUSDT();
  const portfoliomarginaccountinfo = await fetchPortfolioMarginAccountInfo();
  const positions: UMPositionInfo[] = await fetchUMPositionInfo();
  const navMetrics1 = await calculateNAVMetricsCyberBinance1();
  const prices = await fetchAllPrices(); // ✅ fetch spot prices once here

  const accountBalanceWithoutUSDT2 = await fetchAccountBalanceWithoutUSDT2();
  const portfoliomarginaccountinfo2 = await fetchPortfolioMarginAccountInfo2();
  const positions2: UMPositionInfo2[] = await fetchUMPositionInfo2();
  const navMetrics2 = await calculateNAVMetricsCyberBinance2();
  // Calculate USDT notional value
  // const usdtEntry = accountBalance.find(balance => balance.asset === 'USDT');
  // const usdtPrice = prices.get('USDTUSDT') ?? 1;

  const accountBalanceWithoutUSDT3 = await fetchAccountBalanceWithoutUSDT3();
  const portfoliomarginaccountinfo3 = await fetchPortfolioMarginAccountInfo3();
  const positions3: UMPositionInfo3[] = await fetchUMPositionInfo3();
  const navMetrics3 = await calculateNAVMetricsCyberBinance3();
  

  // Calculate USDCUSDT futures amount
  const usdcusdtPosition = positions.find(position => position.symbol === 'USDCUSDT');
  const usdcusdtAmount = usdcusdtPosition ? parseFloat(usdcusdtPosition.notional) : 0;

  const usdcusdtPosition2 = positions2.find(position => position.symbol === 'USDCUSDT');
  const usdcusdtAmount2 = usdcusdtPosition2 ? parseFloat(usdcusdtPosition2.notional) : 0;

  const usdcusdtPosition3 = positions3.find(position => position.symbol === 'USDCUSDT');
  const usdcusdtAmount3 = usdcusdtPosition3 ? parseFloat(usdcusdtPosition3.notional) : 0;
  

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

  const accountBalanceWithNotional3 = accountBalanceWithoutUSDT3.map((balance) => {
    const spotPrice = balance.asset === 'USDT' ? 1 : prices.get(`${balance.asset}USDT`) ?? 0;
    const totalNotionalValue = spotPrice * parseFloat(balance.crossMarginAsset);
    return { ...balance, totalNotionalValue };
  });

  // Calculate spot value excluding BTC
  const spotValue = accountBalanceWithNotional
    .reduce((total, position) => total + position.totalNotionalValue, 0);

  const spotValue2 = accountBalanceWithNotional2
    .reduce((total, position) => total + position.totalNotionalValue, 0);

  const spotValue3 = accountBalanceWithNotional3
    .reduce((total, position) => total + position.totalNotionalValue, 0);

  const spotValueOKX = okxSpotBalances
    .reduce((total, position) => total + parseFloat(position.notional_value), 0);

  const totalFuturesNotionalOKX = okxFuturesPositions.reduce((total, position) => {
      // Ensure 'position.notional' is parsed as a float
      return total + parseFloat(position.notional);
  }, 0);
  

  // const futuresValue = positions.reduce((total, position) => total + parseFloat(position.notional), 0) - usdcusdtAmount;
  // const futuresValue2 = positions2.reduce((total, position) => total + parseFloat(position.notional), 0) - usdcusdtAmount2;

  const futuresValue = positions.reduce((total, position) => total + parseFloat(position.notional), 0);
  const futuresValue2 = positions2.reduce((total, position) => total + parseFloat(position.notional), 0);
  const futuresValue3 = positions3.reduce((total, position) => total + parseFloat(position.notional), 0);

  const totalEquity = parseFloat(portfoliomarginaccountinfo.actualEquity);
  const totalPositionalExposure = spotValue + futuresValue;
  const totalLeverage = totalEquity > 0 ? (spotValue + Math.abs(futuresValue)) / totalEquity : 0;
  const totalDirectionalLeverage = totalEquity > 0 ? (spotValue + futuresValue) / totalEquity : 0;

  const totalEquity2 = parseFloat(portfoliomarginaccountinfo2.actualEquity);
  const totalPositionalExposure2 = spotValue2 + futuresValue2;
  const totalLeverage2 = totalEquity2 > 0 ? (spotValue2 + Math.abs(futuresValue2)) / totalEquity2 : 0;
  const totalDirectionalLeverage2 = totalEquity2 > 0 ? (spotValue2 + futuresValue2) / totalEquity2 : 0;

  const totalEquity3 = parseFloat(portfoliomarginaccountinfo3.actualEquity);
  const totalPositionalExposure3 = spotValue3 + futuresValue3;
  const totalLeverage3 = totalEquity3 > 0 ? (spotValue3 + Math.abs(futuresValue3)) / totalEquity3 : 0;
  const totalDirectionalLeverage3 = totalEquity3 > 0 ? (spotValue3 + futuresValue3) / totalEquity3 : 0;

  const totalequityOKX = accountbalanceOKX.totalEq
  const totalIMROKX = accountbalanceOKX.imr
  const totalMMROKX = accountbalanceOKX.mmr
  const totalPositionalExposureOKX = spotValueOKX + totalFuturesNotionalOKX
  const totalLeverageOKX = (spotValueOKX+Math.abs(totalFuturesNotionalOKX))/totalequityOKX
  const totalDirectionalLeverageOKX = (totalPositionalExposureOKX)/totalequityOKX

  // Get today's date

  const inceptionDate1 = navMetrics1?.inceptionDate || 'N/A';
  const inceptionDate2 = navMetrics2?.inceptionDate || 'N/A';

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
          <h2 className="text-lg font-semibold">CyberX OKX 01</h2>
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
                  ['总权益 (USDT)', `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalequityOKX)}`],
                  ['总风险暴露 (USDT)', `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPositionalExposureOKX)}`],
                  ['总维持保证金', `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalMMROKX)}`],
                  ['总初始保证金', `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalIMROKX)}`],
                  ['总杠杆', totalLeverageOKX.toFixed(2)],
                  ['总方向性杠杆', totalDirectionalLeverageOKX.toFixed(2)]
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
                  ['时间窗口', `${inceptionDate1} to ${formattedToday}`],
                  ['窗口内盈亏 (USDT)', navMetricsOKX1?.period_pnl != null
                    ? `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(navMetricsOKX1.period_pnl))}`
                    : '—'],
                  ['窗口内盈亏率 %', `${navMetricsOKX1?.period_pnl_percent}%`],
                  ['最大回撤', `${navMetricsOKX1?.max_drawdown}%`],
                  ['年化收益率 (1Y)', `${navMetricsOKX1?.annualized_return_1Y}%`]
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
              <EquityChartCyberOKX1/>
            </div>

            {/* NAV Chart */}
            <div className="w-full lg:w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVChartOKX1 color="orange" />
            </div>

          </div>

        </div>
      </div>

      <div className="h-4" />
      {/* Divider */}

      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">CyberX CTA 币安 01</h2>
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
                  ['总权益 (USDT)', `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalEquity)}`],
                  ['总风险暴露 (USDT)', `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPositionalExposure)}`],
                  ['总维持保证金', `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(portfoliomarginaccountinfo.accountMaintMargin)}`],
                  ['总初始保证金', `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(portfoliomarginaccountinfo.accountInitialMargin)}`],
                  ['总杠杆', totalLeverage.toFixed(2)],
                  ['总方向性杠杆', totalDirectionalLeverage.toFixed(2)]
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
                  ['时间窗口', `${inceptionDate1} to ${formattedToday}`],
                  ['窗口内盈亏 (USDT)', navMetrics1?.period_pnl != null
                    ? `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(navMetrics1.period_pnl))}`
                    : '—'],
                  ['窗口内盈亏率 %', `${navMetrics1?.period_pnl_percent}%`],
                  ['最大回撤', `${navMetrics1?.max_drawdown}%`],
                  ['年化收益率 (1Y)', `${navMetrics1?.annualized_return_1Y}%`]
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
              <EquityChartCyberBinance1/>
            </div>

            {/* NAV Chart */}
            <div className="w-full lg:w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVCyberBinance1 color="orange" />
            </div>

          </div>

        </div>
      </div>

      <div className="h-4" />
      {/* Divider */}

      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">CyberX 币安 02</h2>
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
                  ['总权益 (USDT)', `$${totalEquity2.toLocaleString()}`],
                  ['总风险暴露 (USDT)', `$${totalPositionalExposure2.toLocaleString()}`],
                  ['总维持保证金', `$${parseFloat(portfoliomarginaccountinfo2.accountMaintMargin).toLocaleString()}`],
                  ['总初始保证金', `$${parseFloat(portfoliomarginaccountinfo2.accountInitialMargin).toLocaleString()}`],
                  ['总杠杆', totalLeverage2.toFixed(2)],
                  ['总方向性杠杆', totalDirectionalLeverage2.toFixed(2)]
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
                  ['时间窗口', `${inceptionDate2} to ${formattedToday}`],
                  ['窗口内盈亏 (USDT)', navMetrics2?.period_pnl != null
                    ? `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(navMetrics2.period_pnl))}`
                    : '—'],
                  ['窗口内盈亏率 %', `${navMetrics2?.period_pnl_percent}%`],
                  ['最大回撤', `${navMetrics2?.max_drawdown}%`],
                  ['年化收益率 (1Y)', `${navMetrics2?.annualized_return_1Y}%`]
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
              <EquityChartCyberBinance2 />
            </div>

            {/* NAV Chart */}
            <div className="w-full lg:w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVCyberBinance2 color="orange" />
            </div>

          </div>

        </div>
      </div>

      <div className="h-4" />
      {/* Divider */}

      <div className="bg-gray-50 shadow-md rounded-lg p-6 w-full flex flex-col space-y-5 ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">CyberX 币安 03</h2>
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
                  ['总权益 (USDT)', `$${totalEquity3.toLocaleString()}`],
                  ['总风险暴露 (USDT)', `$${totalPositionalExposure3.toLocaleString()}`],
                  ['总维持保证金', `$${parseFloat(portfoliomarginaccountinfo3.accountMaintMargin).toLocaleString()}`],
                  ['总初始保证金', `$${parseFloat(portfoliomarginaccountinfo3.accountInitialMargin).toLocaleString()}`],
                  ['总杠杆', totalLeverage3.toFixed(2)],
                  ['总方向性杠杆', totalDirectionalLeverage3.toFixed(2)]
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
                  ['时间窗口', `${inceptionDate2} to ${formattedToday}`],
                  ['窗口内盈亏 (USDT)', navMetrics2?.period_pnl != null
                    ? `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(navMetrics2.period_pnl))}`
                    : '—'],
                  ['窗口内盈亏率 %', `${navMetrics2?.period_pnl_percent}%`],
                  ['最大回撤', `${navMetrics2?.max_drawdown}%`],
                  ['年化收益率 (1Y)', `${navMetrics2?.annualized_return_1Y}%`]
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
              <EquityChartCyberBinance3 />
            </div>

            {/* NAV Chart */}
            <div className="w-full lg:w-1/2 h-[280px] bg-gray-50 p-2 rounded-md border flex items-center">
              <NAVCyberBinance3 color="orange" />
            </div>

          </div>

        </div>
      </div>

      <div className="h-4" />
      {/* Divider */}

      



    </div>

  );
}
