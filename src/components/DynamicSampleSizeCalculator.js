import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiUsers, FiClock, FiTrendingUp, FiTarget, FiBarChart2 } from 'react-icons/fi';

const CalculatorContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin: 16px 0;
`;

const Title = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #718096;
  margin-bottom: 24px;
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const InputGroup = styled.div`
  background: linear-gradient(135deg, ${props => props.color}10, ${props => props.color}05);
  border: 2px solid ${props => props.color}20;
  border-radius: 12px;
  padding: 16px;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.color};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #2d3748;
  background: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.color || '#667eea'};
    box-shadow: 0 0 0 3px ${props => props.color || '#667eea'}20;
  }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 24px 0;
`;

const ResultCard = styled(motion.div)`
  background: linear-gradient(135deg, ${props => props.color}15, ${props => props.color}05);
  border: 2px solid ${props => props.color}30;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const ResultValue = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: ${props => props.color};
  margin-bottom: 8px;
`;

const ResultLabel = styled.div`
  font-size: 12px;
  color: #718096;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const VisualChart = styled.div`
  background: #f7fafc;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  border-left: 4px solid #667eea;
`;

const ChartTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, ${props => props.color1}, ${props => props.color2});
  border-radius: 4px;
`;

const TimelineContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 12px;
  color: #718096;
`;

const RecommendationBox = styled(motion.div)`
  background: ${props => props.type === 'success' ? 
    'linear-gradient(135deg, #10b981, #059669)' : 
    'linear-gradient(135deg, #f59e0b, #d97706)'};
  color: white;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
`;

const RecommendationText = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const RecommendationSubtext = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

/**
 * Dynamic Sample Size Calculator Component
 * Calculates required sample sizes based on user inputs with real-time updates
 */
export const DynamicSampleSizeCalculator = ({ onSampleSizeChange }) => {
  const [baselineRate, setBaselineRate] = useState(0.12);
  const [expectedLift, setExpectedLift] = useState(0.15);
  const [power, setPower] = useState(0.8);
  const [alpha, setAlpha] = useState(0.05);
  const [dailyTraffic, setDailyTraffic] = useState(1000);
  const [maxDuration, setMaxDuration] = useState(30);

  const [results, setResults] = useState(null);

  useEffect(() => {
    calculateSampleSize();
  }, [baselineRate, expectedLift, power, alpha, dailyTraffic, maxDuration]);

  const calculateSampleSize = () => {
    // Power analysis for binomial proportions
    const zAlpha = 1.96; // 95% confidence
    const zBeta = 0.84; // 80% power
    
    const p1 = baselineRate;
    const p2 = baselineRate * (1 + expectedLift);
    const pPooled = (p1 + p2) / 2;
    
    const numerator = Math.pow(
      zAlpha * Math.sqrt(2 * pPooled * (1 - pPooled)) + 
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2
    );
    const denominator = Math.pow(p2 - p1, 2);
    
    const sampleSizePerVariant = Math.ceil(numerator / denominator);
    const totalSampleSize = sampleSizePerVariant * 2;
    
    const expectedDuration = Math.ceil(totalSampleSize / dailyTraffic);
    const actualDuration = Math.min(expectedDuration, maxDuration);
    const actualSampleSize = Math.min(totalSampleSize, dailyTraffic * actualDuration);
    
    const results = {
      perVariant: sampleSizePerVariant,
      total: totalSampleSize,
      actualTotal: actualSampleSize,
      expectedDuration,
      actualDuration,
      baselineRate: p1,
      expectedRate: p2,
      expectedLift,
      power,
      alpha,
      dailyTraffic,
      feasibility: actualDuration <= maxDuration ? 'feasible' : 'challenging'
    };
    
    setResults(results);
    onSampleSizeChange(results);
  };

  const getFeasibilityColor = (feasibility) => {
    switch (feasibility) {
      case 'feasible': return '#10b981';
      case 'challenging': return '#f59e0b';
      case 'infeasible': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getFeasibilityMessage = (feasibility, duration) => {
    switch (feasibility) {
      case 'feasible': return `✅ Test can be completed in ${duration} days`;
      case 'challenging': return `⚠️ Test will take ${duration} days (consider increasing traffic or duration)`;
      case 'infeasible': return `❌ Test duration too long (${duration} days)`;
      default: return 'Calculating...';
    }
  };

  return (
    <CalculatorContainer>
      <Title>
        <FiTarget />
        Dynamic Sample Size Calculator
      </Title>
      <Subtitle>
        Calculate the optimal sample size for your A/B test based on your expected conversion rates and traffic.
      </Subtitle>

      <InputGrid>
        <InputGroup color="#6366f1">
          <InputLabel color="#6366f1">
            <FiTarget />
            Baseline Conversion Rate
          </InputLabel>
          <Input
            type="number"
            min="0.01"
            max="0.99"
            step="0.01"
            value={baselineRate}
            onChange={(e) => setBaselineRate(parseFloat(e.target.value))}
            color="#6366f1"
          />
          <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
            Current: {(baselineRate * 100).toFixed(1)}%
          </div>
        </InputGroup>

        <InputGroup color="#ec4899">
          <InputLabel color="#ec4899">
            <FiTrendingUp />
            Expected Lift
          </InputLabel>
          <Input
            type="number"
            min="0.01"
            max="2.0"
            step="0.01"
            value={expectedLift}
            onChange={(e) => setExpectedLift(parseFloat(e.target.value))}
            color="#ec4899"
          />
          <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
            Expected: {(expectedLift * 100).toFixed(1)}% improvement
          </div>
        </InputGroup>

        <InputGroup color="#10b981">
          <InputLabel color="#10b981">
            <FiUsers />
            Daily Traffic
          </InputLabel>
          <Input
            type="number"
            min="100"
            max="100000"
            step="100"
            value={dailyTraffic}
            onChange={(e) => setDailyTraffic(parseInt(e.target.value))}
            color="#10b981"
          />
          <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
            Visitors per day
          </div>
        </InputGroup>

        <InputGroup color="#f59e0b">
          <InputLabel color="#f59e0b">
            <FiClock />
            Max Duration (days)
          </InputLabel>
          <Input
            type="number"
            min="1"
            max="365"
            step="1"
            value={maxDuration}
            onChange={(e) => setMaxDuration(parseInt(e.target.value))}
            color="#f59e0b"
          />
          <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
            Maximum test duration
          </div>
        </InputGroup>
      </InputGrid>

      {results && (
        <>
          <ResultsGrid>
            <ResultCard color="#6366f1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ResultValue color="#6366f1">{results.perVariant.toLocaleString()}</ResultValue>
              <ResultLabel>Per Variant</ResultLabel>
            </ResultCard>

            <ResultCard color="#ec4899" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <ResultValue color="#ec4899">{results.total.toLocaleString()}</ResultValue>
              <ResultLabel>Total Sample Size</ResultLabel>
            </ResultCard>

            <ResultCard color="#10b981" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <ResultValue color="#10b981">{results.actualDuration}</ResultValue>
              <ResultLabel>Test Duration (days)</ResultLabel>
            </ResultCard>

            <ResultCard color="#f59e0b" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <ResultValue color="#f59e0b">{(results.expectedRate * 100).toFixed(1)}%</ResultValue>
              <ResultLabel>Expected Rate</ResultLabel>
            </ResultCard>
          </ResultsGrid>

          <VisualChart>
            <ChartTitle>
              <FiBarChart2 />
              Test Feasibility Timeline
            </ChartTitle>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>Progress</span>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>
                  {Math.min(100, (results.actualDuration / maxDuration) * 100).toFixed(0)}%
                </span>
              </div>
              <ProgressBar>
                <ProgressFill
                  color1="#10b981"
                  color2="#059669"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (results.actualDuration / maxDuration) * 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </ProgressBar>
            </div>

            <TimelineContainer>
              <span>Day 1</span>
              <span>Day {Math.floor(maxDuration / 2)}</span>
              <span>Day {maxDuration}</span>
            </TimelineContainer>
          </VisualChart>

          <RecommendationBox
            type={results.feasibility === 'feasible' ? 'success' : 'warning'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <RecommendationText>
              {getFeasibilityMessage(results.feasibility, results.actualDuration)}
            </RecommendationText>
            <RecommendationSubtext>
              {results.feasibility === 'feasible' 
                ? `You'll need ${results.total.toLocaleString()} total visitors to achieve ${(power * 100).toFixed(0)}% statistical power.`
                : `Consider increasing daily traffic to ${Math.ceil(results.total / maxDuration).toLocaleString()} visitors or extending the test duration.`
              }
            </RecommendationSubtext>
          </RecommendationBox>
        </>
      )}
    </CalculatorContainer>
  );
};
