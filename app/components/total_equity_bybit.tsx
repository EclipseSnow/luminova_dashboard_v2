'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { supabase } from '../lib/supabase';
import 'chartjs-adapter-date-fns';

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface EquityData_BTC {
  actual_equity: number;
  timestamp: string;
  equity_in_btc: number;
}

interface ChartData_BTC {
  labels: Date[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    pointRadius: number;
  }[];
}

const EquityChart_BTC: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData_BTC | null>(null);

  useEffect(() => {
    const fetchEquityData = async () => {
      const { data, error } = await supabase
        .from('equity_data_btc')
        .select('*') as { data: EquityData_BTC[] | null, error: { message: string } | null };

      if (error) {
        console.error('Error fetching data:', error.message);
        return;
      }

      if (!data) return;

      const sorted = data.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const formattedData: ChartData_BTC = {
        labels: sorted.map((d) => new Date(d.timestamp)),
        datasets: [
          {
            label: 'Equity in BTC',
            data: sorted.map((d) => d.equity_in_btc),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.2,
            pointRadius: 2,
          },
        ],
      };

      setChartData(formattedData);
    };

    fetchEquityData();
  }, []);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false, // 👈 Crucial for dynamic sizing
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Net Assets (BTC)',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'dd-MM-yyyy',
          },
        },
        ticks: {
          maxTicksLimit: 6,
        },
      },
      y: {
        title: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="w-full h-full"> {/* 👈 Ensure it fills the parent container */}
      {chartData ? <Line data={chartData} options={options} /> : <p>Loading...</p>}
    </div>
  );
};

export default EquityChart_BTC;
