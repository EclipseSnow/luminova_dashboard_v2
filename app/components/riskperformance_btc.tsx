import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL|| '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY|| '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define type
interface EquityData_BTC {
  NAV: number;
  actual_equity: number;
  original_equity: number;
  timestamp: string;
  equity_in_btc: number;
}

export async function calculateNAVMetrics_BTC() {
  const { data, error } = await supabase
    .from('equity_data_btc')
    .select('*') as { data: EquityData_BTC[] | null, error: { message: string } | null };

  if (error) {
    console.error('Error fetching data:', error.message);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No equity data available.');
    return null;
  }

  // Sort by timestamp
  const sorted = data.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const latest = sorted[sorted.length - 1];
  const initial = sorted[0];
  const originalEquity = latest.original_equity || 1; // Avoid division by zero
  const equity_in_btc = latest.equity_in_btc || 1;
  const pnl = equity_in_btc - originalEquity;
  const pnlPercent = (pnl / originalEquity) * 100;

  // Calculate the number of days since inception
  const inceptionDate = new Date(initial.timestamp);
  const latestDate = new Date(latest.timestamp);
  const daysSinceInception = (latestDate.getTime() - inceptionDate.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate annualized return
  const annualizedReturn_1Y = (pnlPercent / daysSinceInception) * 365

  // Max drawdown calculation using NAVs
  let peak = sorted[0].NAV;
  let maxDrawdown = 0;

  for (const d of sorted) {
    if (d.NAV > peak) peak = d.NAV;
    const drawdown = ((peak - d.NAV) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return {
    period_pnl: pnl.toFixed(8),
    period_pnl_percent: pnlPercent.toFixed(2),
    max_drawdown: maxDrawdown.toFixed(2),
    annualized_return_1Y: annualizedReturn_1Y.toFixed(3)
  };
}

// Run it
calculateNAVMetrics_BTC();
