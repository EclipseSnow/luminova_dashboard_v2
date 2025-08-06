'use client';

interface CSVDataItem {
  asset: string;
  spotBalance: number;
  spotNotional: number;
  futuresSide?: string;
  futuresNotional: number;
  entryPrice?: number;
  unRealizedProfit?: number;
  leverage?: number;
  liquidationPrice?: number;
  initialMargin?: number;
  maintenanceMargin?: number;
}

interface CSVDownloadButtonProps {
  data: CSVDataItem[];
  filename: string;
  type?: 'binance' | 'okx';
}

export default function CSVDownloadButton({ data, filename, type = 'okx' }: CSVDownloadButtonProps) {
  const downloadCSV = () => {
    let headers: string[];
    let csvRows: string[];
    
    if (type === 'binance') {
      // Binance headers with additional fields
      headers = ['Asset', 'Spot Balance', 'Spot Notional ($)', 'Futures Side', 'Futures Notional ($)', 'Entry Price ($)', 'Unrealized P&L ($)', 'Leverage', 'Liquidation Price ($)'];
      
      // Convert data to CSV format for Binance
      csvRows = data.map(item => [
        item.asset,
        item.spotBalance > 0 ? item.spotBalance.toFixed(5) : '',
        item.spotNotional > 0 ? item.spotNotional.toFixed(2) : '',
        item.futuresSide || '',
        item.futuresNotional !== 0 ? item.futuresNotional.toFixed(2) : '',
        (item.entryPrice && item.entryPrice > 0) ? item.entryPrice.toFixed(2) : '',
        (item.unRealizedProfit && item.unRealizedProfit !== 0) ? item.unRealizedProfit.toFixed(2) : '',
        (item.leverage && item.leverage > 0) ? item.leverage.toFixed(2) : '',
        (item.liquidationPrice && item.liquidationPrice > 0) ? item.liquidationPrice.toFixed(2) : ''
      ].join(','));
    } else {
      // OKX headers
      headers = ['Asset', 'Spot Balance', 'Spot Notional ($)', 'Futures Side', 'Futures Notional ($)', 'Initial Margin ($)', 'Maintenance Margin ($)', 'Leverage'];
      
      // Convert data to CSV format for OKX
      csvRows = data.map(item => [
        item.asset,
        item.spotBalance > 0 ? item.spotBalance.toFixed(5) : '',
        item.spotNotional > 0 ? item.spotNotional.toFixed(2) : '',
        item.futuresSide || '',
        item.futuresNotional !== 0 ? item.futuresNotional.toFixed(2) : '',
        (item.initialMargin && item.initialMargin > 0) ? item.initialMargin.toFixed(2) : '',
        (item.maintenanceMargin && item.maintenanceMargin > 0) ? item.maintenanceMargin.toFixed(2) : '',
        (item.leverage && item.leverage > 0) ? item.leverage.toFixed(2) : ''
      ].join(','));
    }
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={downloadCSV}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download CSV
    </button>
  );
} 
