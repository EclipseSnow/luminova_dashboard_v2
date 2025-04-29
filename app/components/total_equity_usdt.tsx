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

// Define the type for the chart data
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

const EquityChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    const fetchEquityData = async () => {
      const { data, error } = await supabase
        .from('equity_data')
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
      legend: { display: false },
      title: {
        display: true,
        text: 'Net Assets',
        font: {
          size: 18,
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
          stepSize: 1,
        },
        title: {
          display: true,
          // text: 'Timestamp',
        },
      },
      y: {
        title: {
          display: true,
          // text: 'Actual Equity',
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

export default EquityChart;
