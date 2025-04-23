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
import 'chartjs-adapter-date-fns'; // If using date-fns
// or
// import 'chartjs-adapter-moment'; // If using moment

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface EquityData {
  actual_equity: number;
  timestamp: string;
}

const EquityChart: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const fetchEquityData = async () => {
      const { data, error } = await supabase
        .from('equity_data')
        .select('*') as { data: EquityData[] | null, error: any };

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      if (!data) return;

      const sorted = data.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const formattedData = {
        labels: sorted.map((d) => new Date(d.timestamp)),
        datasets: [
          {
            label: 'Actual Equity',
            data: sorted.map((d) => d.actual_equity),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0,
            pointRadius: 4,
          },
        ],
      };

      setChartData(formattedData);
    };

    fetchEquityData();
  }, []);

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: 'Actual Equity Over Time',
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'dd-MM-yyyy h a',
          },
        },
        ticks: {
          stepSize: 12,
        },
        title: {
          display: true,
          text: 'Timestamp',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Actual Equity',
        },
      },
    },
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {chartData ? <Line data={chartData} options={options} /> : <p>Loading...</p>}
    </div>
  );
};

export default EquityChart;
