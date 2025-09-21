import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import styled from 'styled-components';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin: 16px 0;
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
  text-align: center;
`;

const ChartSubtitle = styled.p`
  font-size: 14px;
  color: #718096;
  text-align: center;
  margin-bottom: 20px;
`;

/**
 * Posterior Distribution Chart Component
 * Displays the probability density functions for both variants
 */
export const PosteriorDistributionChart = ({ posteriorA, posteriorB, calculator }) => {
  const chartData = useMemo(() => {
    const dataA = calculator.generateDistributionData(posteriorA, 200);
    const dataB = calculator.generateDistributionData(posteriorB, 200);
    
    return {
      labels: dataA.map(point => (point.x * 100).toFixed(1) + '%'),
      datasets: [
        {
          label: 'Variant A',
          data: dataA.map(point => point.y),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4
        },
        {
          label: 'Variant B',
          data: dataB.map(point => point.y),
          borderColor: 'rgb(236, 72, 153)',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    };
  }, [posteriorA, posteriorB, calculator]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toFixed(4);
            const xValue = (context.parsed.x * 100).toFixed(1) + '%';
            return `${label}: ${value} at ${xValue}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Conversion Rate',
          font: {
            size: 12,
            weight: '600'
          },
          color: '#4a5568'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Probability Density',
          font: {
            size: 12,
            weight: '600'
          },
          color: '#4a5568'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <ChartContainer>
      <ChartTitle>Posterior Probability Distributions</ChartTitle>
      <ChartSubtitle>
        Beta(α={posteriorA.alpha.toFixed(1)}, β={posteriorA.beta.toFixed(1)}) vs Beta(α={posteriorB.alpha.toFixed(1)}, β={posteriorB.beta.toFixed(1)})
      </ChartSubtitle>
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
    </ChartContainer>
  );
};

/**
 * Credible Interval Chart Component
 * Shows credible intervals for both variants
 */
export const CredibleIntervalChart = ({ posteriorA, posteriorB, calculator }) => {
  const chartData = useMemo(() => {
    const ciA = calculator.calculateCredibleInterval(posteriorA, 0.95);
    const ciB = calculator.calculateCredibleInterval(posteriorB, 0.95);
    const meanA = calculator.calculateExpectedValue(posteriorA);
    const meanB = calculator.calculateExpectedValue(posteriorB);
    
    return {
      labels: ['Variant A', 'Variant B'],
      datasets: [
        {
          label: '95% Credible Interval',
          data: [
            {
              x: 'A',
              y: [ciA.lower * 100, ciA.upper * 100],
              mean: meanA * 100
            },
            {
              x: 'B',
              y: [ciB.lower * 100, ciB.upper * 100],
              mean: meanB * 100
            }
          ],
          backgroundColor: ['rgba(99, 102, 241, 0.3)', 'rgba(236, 72, 153, 0.3)'],
          borderColor: ['rgb(99, 102, 241)', 'rgb(236, 72, 153)'],
          borderWidth: 2
        }
      ]
    };
  }, [posteriorA, posteriorB, calculator]);

  return (
    <ChartContainer>
      <ChartTitle>95% Credible Intervals</ChartTitle>
      <ChartSubtitle>
        Bayesian credible intervals showing uncertainty in conversion rate estimates
      </ChartSubtitle>
      <div style={{ height: '300px' }}>
        <Bar data={chartData} />
      </div>
    </ChartContainer>
  );
};

/**
 * Monte Carlo Simulation Chart
 * Shows the distribution of differences B - A
 */
export const MonteCarloChart = ({ posteriorA, posteriorB, calculator }) => {
  const chartData = useMemo(() => {
    const samplesA = calculator.monteCarloSample(posteriorA, 10000);
    const samplesB = calculator.monteCarloSample(posteriorB, 10000);
    
    const differences = samplesB.map((b, i) => b - samplesA[i]);
    const histogram = new Array(50).fill(0);
    const minDiff = Math.min(...differences);
    const maxDiff = Math.max(...differences);
    const binWidth = (maxDiff - minDiff) / 50;
    
    differences.forEach(diff => {
      const binIndex = Math.min(49, Math.floor((diff - minDiff) / binWidth));
      histogram[binIndex]++;
    });
    
    const labels = histogram.map((_, i) => {
      const binStart = minDiff + i * binWidth;
      const binEnd = minDiff + (i + 1) * binWidth;
      return `${(binStart * 100).toFixed(1)}% - ${(binEnd * 100).toFixed(1)}%`;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Frequency',
          data: histogram,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        }
      ]
    };
  }, [posteriorA, posteriorB, calculator]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Frequency: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Difference (B - A)',
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Frequency',
          font: {
            size: 12,
            weight: '600'
          }
        },
        beginAtZero: true
      }
    }
  };

  return (
    <ChartContainer>
      <ChartTitle>Monte Carlo Simulation: B - A Distribution</ChartTitle>
      <ChartSubtitle>
        10,000 samples showing the distribution of conversion rate differences
      </ChartSubtitle>
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartContainer>
  );
};

/**
 * Probability Gauge Chart
 * Shows the probability that B > A
 */
export const ProbabilityGaugeChart = ({ probability }) => {
  const chartData = {
    labels: ['B > A', 'A ≥ B'],
    datasets: [
      {
        data: [probability * 100, (1 - probability) * 100],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2,
        cutout: '70%'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.toFixed(1)}%`;
          }
        }
      }
    }
  };

  return (
    <ChartContainer>
      <ChartTitle>Probability that B > A</ChartTitle>
      <ChartSubtitle>
        {probability > 0.5 ? 'Variant B is likely superior' : 'Variant A is likely superior'}
      </ChartSubtitle>
      <div style={{ height: '300px', position: 'relative' }}>
        <Doughnut data={chartData} options={options} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#2d3748'
        }}>
          {(probability * 100).toFixed(1)}%
        </div>
      </div>
    </ChartContainer>
  );
};
