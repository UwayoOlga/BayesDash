import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiPlay, FiRefreshCw, FiTrendingUp, FiUsers, FiTarget, FiZap } from 'react-icons/fi';

const ScenarioContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
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

const ScenarioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const ScenarioCard = styled(motion.div)`
  background: linear-gradient(135deg, ${props => props.color}15, ${props => props.color}05);
  border: 2px solid ${props => props.color}30;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${props => props.color}20;
  }
  
  &.active {
    border-color: ${props => props.color};
    background: ${props => props.color}20;
  }
`;

const ScenarioTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.color};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ScenarioDescription = styled.p`
  font-size: 12px;
  color: #718096;
  margin-bottom: 12px;
`;

const ScenarioStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
`;

const StatBox = styled.div`
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  padding: 8px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${props => props.color || '#2d3748'};
`;

const StatLabel = styled.div`
  font-size: 10px;
  color: #718096;
  margin-top: 2px;
`;

const ControlPanel = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const ControlButton = styled.button`
  padding: 12px 20px;
  border: 2px solid ${props => props.color || '#667eea'};
  background: ${props => props.active ? props.color || '#667eea' : 'transparent'};
  color: ${props => props.active ? 'white' : props.color || '#667eea'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.color || '#667eea'};
    color: white;
  }
`;

const LiveDataContainer = styled.div`
  background: #f7fafc;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
`;

const LiveDataTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const DataCard = styled(motion.div)`
  background: white;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid ${props => props.color || '#667eea'};
`;

const DataValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.color || '#2d3748'};
  margin-bottom: 4px;
`;

const DataLabel = styled.div`
  font-size: 12px;
  color: #718096;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin: 12px 0;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, ${props => props.color1}, ${props => props.color2});
  border-radius: 3px;
`;

/**
 * Dynamic Test Scenario Generator Component
 * Generates realistic A/B test scenarios with live data simulation
 */
export const DynamicTestScenarioGenerator = ({ onScenarioSelect, onDataGenerated }) => {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  const scenarios = [
    {
      id: 1,
      name: 'E-commerce Checkout',
      description: 'Testing checkout button colors and placement',
      category: 'conversion',
      color: '#6366f1',
      icon: <FiTarget />,
      baselineRate: 0.12,
      expectedLift: 0.15,
      dailyTraffic: 2000,
      seasonality: 'moderate'
    },
    {
      id: 2,
      name: 'Email Campaign',
      description: 'A/B testing email subject lines and content',
      category: 'engagement',
      color: '#ec4899',
      icon: <FiUsers />,
      baselineRate: 0.25,
      expectedLift: 0.08,
      dailyTraffic: 5000,
      seasonality: 'low'
    },
    {
      id: 3,
      name: 'Landing Page',
      description: 'Testing headlines and call-to-action buttons',
      category: 'conversion',
      color: '#10b981',
      icon: <FiTrendingUp />,
      baselineRate: 0.08,
      expectedLift: 0.20,
      dailyTraffic: 1500,
      seasonality: 'high'
    },
    {
      id: 4,
      name: 'Mobile App',
      description: 'Testing onboarding flow and feature placement',
      category: 'retention',
      color: '#f59e0b',
      icon: <FiZap />,
      baselineRate: 0.35,
      expectedLift: 0.10,
      dailyTraffic: 3000,
      seasonality: 'moderate'
    },
    {
      id: 5,
      name: 'Pricing Page',
      description: 'Testing pricing display and subscription options',
      category: 'conversion',
      color: '#8b5cf6',
      icon: <FiTarget />,
      baselineRate: 0.15,
      expectedLift: 0.12,
      dailyTraffic: 800,
      seasonality: 'high'
    },
    {
      id: 6,
      name: 'Social Media',
      description: 'Testing ad creatives and targeting strategies',
      category: 'engagement',
      color: '#06b6d4',
      icon: <FiUsers />,
      baselineRate: 0.18,
      expectedLift: 0.14,
      dailyTraffic: 4000,
      seasonality: 'moderate'
    }
  ];

  const generateLiveData = async (scenario) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate data generation with progress updates
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Generate realistic data based on scenario
    const data = {
      scenario: scenario.name,
      currentDay: Math.floor(Math.random() * 30) + 1,
      variantA: {
        successes: Math.floor(scenario.baselineRate * scenario.dailyTraffic * 0.9 + Math.random() * scenario.dailyTraffic * 0.2),
        trials: scenario.dailyTraffic,
        rate: scenario.baselineRate * (0.9 + Math.random() * 0.2)
      },
      variantB: {
        successes: Math.floor(scenario.baselineRate * (1 + scenario.expectedLift) * scenario.dailyTraffic * 0.9 + Math.random() * scenario.dailyTraffic * 0.2),
        trials: scenario.dailyTraffic,
        rate: scenario.baselineRate * (1 + scenario.expectedLift) * (0.9 + Math.random() * 0.2)
      },
      confidence: 0.7 + Math.random() * 0.25,
      expectedDuration: Math.ceil(1000 / scenario.dailyTraffic),
      seasonality: scenario.seasonality
    };

    setTimeout(() => {
      setLiveData(data);
      onDataGenerated(data);
    }, 2000);
  };

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
    onScenarioSelect(scenario);
    generateLiveData(scenario);
  };

  const refreshData = () => {
    if (selectedScenario) {
      generateLiveData(selectedScenario);
    }
  };

  return (
    <ScenarioContainer>
      <Title>
        <FiPlay />
        Dynamic Test Scenario Generator
      </Title>
      <Subtitle>
        Generate realistic A/B test scenarios with live data simulation. Click on a scenario to start generating data.
      </Subtitle>

      <ScenarioGrid>
        {scenarios.map((scenario, index) => (
          <ScenarioCard
            key={scenario.id}
            color={scenario.color}
            className={selectedScenario?.id === scenario.id ? 'active' : ''}
            onClick={() => handleScenarioSelect(scenario)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ScenarioTitle color={scenario.color}>
              {scenario.icon}
              {scenario.name}
            </ScenarioTitle>
            <ScenarioDescription>{scenario.description}</ScenarioDescription>
            
            <ScenarioStats>
              <StatBox>
                <StatValue color={scenario.color}>{(scenario.baselineRate * 100).toFixed(1)}%</StatValue>
                <StatLabel>Baseline Rate</StatLabel>
              </StatBox>
              <StatBox>
                <StatValue color={scenario.color}>{(scenario.expectedLift * 100).toFixed(1)}%</StatValue>
                <StatLabel>Expected Lift</StatLabel>
              </StatBox>
              <StatBox>
                <StatValue color={scenario.color}>{scenario.dailyTraffic.toLocaleString()}</StatValue>
                <StatLabel>Daily Traffic</StatLabel>
              </StatBox>
              <StatBox>
                <StatValue color={scenario.color}>{scenario.seasonality}</StatValue>
                <StatLabel>Seasonality</StatLabel>
              </StatBox>
            </ScenarioStats>
          </ScenarioCard>
        ))}
      </ScenarioGrid>

      <ControlPanel>
        <ControlButton
          color="#10b981"
          onClick={refreshData}
          disabled={!selectedScenario || isGenerating}
        >
          <FiRefreshCw />
          Refresh Data
        </ControlButton>
        
        <ControlButton
          color="#667eea"
          onClick={() => setSelectedScenario(null)}
        >
          Clear Selection
        </ControlButton>
      </ControlPanel>

      {isGenerating && (
        <LiveDataContainer>
          <LiveDataTitle>
            <FiZap />
            Generating Live Data...
          </LiveDataTitle>
          <ProgressBar>
            <ProgressFill
              color1="#10b981"
              color2="#059669"
              initial={{ width: 0 }}
              animate={{ width: `${generationProgress}%` }}
              transition={{ duration: 0.2 }}
            />
          </ProgressBar>
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px', color: '#718096' }}>
            {generationProgress}% Complete
          </div>
        </LiveDataContainer>
      )}

      {liveData && !isGenerating && (
        <LiveDataContainer>
          <LiveDataTitle>
            <FiTrendingUp />
            Live Test Data - {liveData.scenario}
          </LiveDataTitle>
          
          <DataGrid>
            <DataCard color="#6366f1">
              <DataValue color="#6366f1">{liveData.variantA.successes}</DataValue>
              <DataLabel>Variant A Successes</DataLabel>
            </DataCard>
            
            <DataCard color="#ec4899">
              <DataValue color="#ec4899">{liveData.variantB.successes}</DataValue>
              <DataLabel>Variant B Successes</DataLabel>
            </DataCard>
            
            <DataCard color="#10b981">
              <DataValue color="#10b981">{(liveData.variantA.rate * 100).toFixed(1)}%</DataValue>
              <DataLabel>Variant A Rate</DataLabel>
            </DataCard>
            
            <DataCard color="#f59e0b">
              <DataValue color="#f59e0b">{(liveData.variantB.rate * 100).toFixed(1)}%</DataValue>
              <DataLabel>Variant B Rate</DataLabel>
            </DataCard>
            
            <DataCard color="#8b5cf6">
              <DataValue color="#8b5cf6">{(liveData.confidence * 100).toFixed(0)}%</DataValue>
              <DataLabel>Confidence Level</DataLabel>
            </DataCard>
            
            <DataCard color="#06b6d4">
              <DataValue color="#06b6d4">Day {liveData.currentDay}</DataValue>
              <DataLabel>Test Progress</DataLabel>
            </DataCard>
          </DataGrid>
        </LiveDataContainer>
      )}
    </ScenarioContainer>
  );
};
