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

interface EquityData {
  NAV: number;
  timestamp: string;
}

interface ChartData {
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

const NAVCyberBinance2: React.FC<{ color?: string }> = ({ color = 'blue' }) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    const fetchEquityData = async () => {
      const { data, error } = await supabase
        .from('luminova_Binance_LTP')
        .select('*') as { data: EquityData[] | null, error: { message: string } | null };

      if (error) {
        console.error('Error fetching data:', error.message);
        return;
      }

      if (!data) return;

      const sorted = data.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const formattedData: ChartData = {
        labels: sorted.map((d) => new Date(d.timestamp)),
        datasets: [
          {
            label: 'NAV',
            data: sorted.map((d) => d.NAV),
            borderColor: color,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            pointRadius: 3,
          },
        ],
      };

      setChartData(formattedData);
    };

    fetchEquityData();
  }, [color]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false, // 👈 Important fix
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'NAV & Accum.NAV',
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
        beginAtZero: false,
        title: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="w-full h-full">
      {chartData ? <Line data={chartData} options={options} /> : <p>Loading...</p>}
    </div>
  );
};

export default NAVCyberBinance2;
