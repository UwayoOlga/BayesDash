import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const InputContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin: 16px 0;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
  text-align: center;
`;

const SectionSubtitle = styled.p`
  font-size: 14px;
  color: #718096;
  text-align: center;
  margin-bottom: 24px;
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const VariantContainer = styled.div`
  background: linear-gradient(135deg, ${props => props.color}15, ${props => props.color}05);
  border: 2px solid ${props => props.color}30;
  border-radius: 12px;
  padding: 20px;
`;

const VariantTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.color};
  margin-bottom: 16px;
  text-align: center;
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
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
  
  &:invalid {
    border-color: #e53e3e;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
`;

const StatBox = styled.div`
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.color || '#2d3748'};
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
`;

const PriorContainer = styled.div`
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
`;

const PriorTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
  text-align: center;
`;

const PriorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const PriorPreset = styled.button`
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    color: #667eea;
  }
  
  &.active {
    border-color: #667eea;
    background: #667eea;
    color: white;
  }
`;

const MathNotation = styled.div`
  background: #f7fafc;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #2d3748;
  border-left: 4px solid #667eea;
`;

/**
 * Advanced Input Component for A/B Test Data
 * Features mathematical notation, real-time calculations, and prior selection
 */
export const ABTestInput = ({ onDataChange, calculator }) => {
  const [variantA, setVariantA] = useState({ successes: 0, trials: 0 });
  const [variantB, setVariantB] = useState({ successes: 0, trials: 0 });
  const [prior, setPrior] = useState({ alpha: 1, beta: 1 });
  const [priorPreset, setPriorPreset] = useState('uniform');

  const priorPresets = {
    uniform: { alpha: 1, beta: 1, name: 'Uniform (Non-informative)' },
    jeffreys: { alpha: 0.5, beta: 0.5, name: 'Jeffreys Prior' },
    conservative: { alpha: 2, beta: 2, name: 'Conservative' },
    optimistic: { alpha: 2, beta: 8, name: 'Optimistic (20% baseline)' },
    pessimistic: { alpha: 1, beta: 9, name: 'Pessimistic (10% baseline)' }
  };

  useEffect(() => {
    calculator.alpha = prior.alpha;
    calculator.beta = prior.beta;
    
    if (variantA.trials > 0 && variantB.trials > 0) {
      const posteriorA = calculator.calculatePosterior(variantA.successes, variantA.trials);
      const posteriorB = calculator.calculatePosterior(variantB.successes, variantB.trials);
      
      onDataChange({
        variantA: { ...variantA, posterior: posteriorA },
        variantB: { ...variantB, posterior: posteriorB },
        prior
      });
    }
  }, [variantA, variantB, prior, calculator, onDataChange]);

  const handlePresetChange = (presetName) => {
    const preset = priorPresets[presetName];
    setPrior(preset);
    setPriorPreset(presetName);
  };

  const calculateConversionRate = (successes, trials) => {
    return trials > 0 ? (successes / trials * 100).toFixed(2) : '0.00';
  };

  const calculatePosteriorStats = (successes, trials) => {
    if (trials === 0) return { mean: 0, variance: 0 };
    
    const posterior = calculator.calculatePosterior(successes, trials);
    const mean = calculator.calculateExpectedValue(posterior);
    const variance = calculator.calculateVariance(posterior);
    
    return { mean: (mean * 100).toFixed(2), variance: (variance * 10000).toFixed(4) };
  };

  return (
    <InputContainer>
      <SectionTitle>Bayesian A/B Test Configuration</SectionTitle>
      <SectionSubtitle>
        Input conversion data for both variants. The system will calculate posterior distributions using Bayesian inference.
      </SectionSubtitle>

      <InputGrid>
        <VariantContainer color="#6366f1">
          <VariantTitle color="#6366f1">Variant A (Control)</VariantTitle>
          
          <InputGroup>
            <Label>Successes (Conversions)</Label>
            <Input
              type="number"
              min="0"
              value={variantA.successes}
              onChange={(e) => setVariantA(prev => ({ ...prev, successes: parseInt(e.target.value) || 0 }))}
              color="#6366f1"
            />
          </InputGroup>
          
          <InputGroup>
            <Label>Total Trials</Label>
            <Input
              type="number"
              min="0"
              value={variantA.trials}
              onChange={(e) => setVariantA(prev => ({ ...prev, trials: parseInt(e.target.value) || 0 }))}
              color="#6366f1"
            />
          </InputGroup>
          
          <StatsContainer>
            <StatBox>
              <StatValue color="#6366f1">{calculateConversionRate(variantA.successes, variantA.trials)}%</StatValue>
              <StatLabel>Observed Rate</StatLabel>
            </StatBox>
            <StatBox>
              <StatValue color="#6366f1">{calculatePosteriorStats(variantA.successes, variantA.trials).mean}%</StatValue>
              <StatLabel>Posterior Mean</StatLabel>
            </StatBox>
          </StatsContainer>
        </VariantContainer>

        <VariantContainer color="#ec4899">
          <VariantTitle color="#ec4899">Variant B (Treatment)</VariantTitle>
          
          <InputGroup>
            <Label>Successes (Conversions)</Label>
            <Input
              type="number"
              min="0"
              value={variantB.successes}
              onChange={(e) => setVariantB(prev => ({ ...prev, successes: parseInt(e.target.value) || 0 }))}
              color="#ec4899"
            />
          </InputGroup>
          
          <InputGroup>
            <Label>Total Trials</Label>
            <Input
              type="number"
              min="0"
              value={variantB.trials}
              onChange={(e) => setVariantB(prev => ({ ...prev, trials: parseInt(e.target.value) || 0 }))}
              color="#ec4899"
            />
          </InputGroup>
          
          <StatsContainer>
            <StatBox>
              <StatValue color="#ec4899">{calculateConversionRate(variantB.successes, variantB.trials)}%</StatValue>
              <StatLabel>Observed Rate</StatLabel>
            </StatBox>
            <StatBox>
              <StatValue color="#ec4899">{calculatePosteriorStats(variantB.successes, variantB.trials).mean}%</StatValue>
              <StatLabel>Posterior Mean</StatLabel>
            </StatBox>
          </StatsContainer>
        </VariantContainer>
      </InputGrid>

      <PriorContainer>
        <PriorTitle>Prior Distribution Selection</PriorTitle>
        <PriorGrid>
          {Object.entries(priorPresets).map(([key, preset]) => (
            <PriorPreset
              key={key}
              className={priorPreset === key ? 'active' : ''}
              onClick={() => handlePresetChange(key)}
            >
              {preset.name}
              <br />
              <small>Beta({preset.alpha}, {preset.beta})</small>
            </PriorPreset>
          ))}
        </PriorGrid>
        
        <MathNotation>
          <strong>Mathematical Foundation:</strong><br />
          Prior: θ ~ Beta(α₀ = {prior.alpha}, β₀ = {prior.beta})<br />
          Likelihood: X|θ ~ Binomial(n, θ)<br />
          Posterior: θ|X ~ Beta(α₀ + x, β₀ + n - x)<br />
          <br />
          <strong>Current Posterior Parameters:</strong><br />
          Variant A: Beta(α = {prior.alpha + variantA.successes}, β = {prior.beta + variantA.trials - variantA.successes})<br />
          Variant B: Beta(α = {prior.alpha + variantB.successes}, β = {prior.beta + variantB.trials - variantB.successes})
        </MathNotation>
      </PriorContainer>
    </InputContainer>
  );
};

/**
 * Sequential Testing Input Component
 * Allows users to input time-series data for sequential analysis
 */
export const SequentialTestInput = ({ onSequentialDataChange }) => {
  const [timeSeriesData, setTimeSeriesData] = useState({
    variantA: [],
    variantB: []
  });

  const addDataPoint = (variant) => {
    const newDataPoint = { successes: 0, trials: 0 };
    setTimeSeriesData(prev => ({
      ...prev,
      [variant]: [...prev[variant], newDataPoint]
    }));
  };

  const updateDataPoint = (variant, index, field, value) => {
    setTimeSeriesData(prev => ({
      ...prev,
      [variant]: prev[variant].map((point, i) => 
        i === index ? { ...point, [field]: parseInt(value) || 0 } : point
      )
    }));
  };

  const removeDataPoint = (variant, index) => {
    setTimeSeriesData(prev => ({
      ...prev,
      [variant]: prev[variant].filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    onSequentialDataChange(timeSeriesData);
  }, [timeSeriesData, onSequentialDataChange]);

  return (
    <InputContainer>
      <SectionTitle>Sequential Testing Data</SectionTitle>
      <SectionSubtitle>
        Input time-series data to analyze sequential testing with early stopping rules
      </SectionSubtitle>
      
      <InputGrid>
        <div>
          <h4 style={{ color: '#6366f1', marginBottom: '16px' }}>Variant A Time Series</h4>
          {timeSeriesData.variantA.map((point, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '8px',
              alignItems: 'center'
            }}>
              <Input
                type="number"
                placeholder="Successes"
                value={point.successes}
                onChange={(e) => updateDataPoint('variantA', index, 'successes', e.target.value)}
                style={{ width: '100px' }}
              />
              <Input
                type="number"
                placeholder="Trials"
                value={point.trials}
                onChange={(e) => updateDataPoint('variantA', index, 'trials', e.target.value)}
                style={{ width: '100px' }}
              />
              <button
                onClick={() => removeDataPoint('variantA', index)}
                style={{
                  padding: '8px 12px',
                  background: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => addDataPoint('variantA')}
            style={{
              padding: '12px 16px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Add Data Point
          </button>
        </div>

        <div>
          <h4 style={{ color: '#ec4899', marginBottom: '16px' }}>Variant B Time Series</h4>
          {timeSeriesData.variantB.map((point, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '8px',
              alignItems: 'center'
            }}>
              <Input
                type="number"
                placeholder="Successes"
                value={point.successes}
                onChange={(e) => updateDataPoint('variantB', index, 'successes', e.target.value)}
                style={{ width: '100px' }}
              />
              <Input
                type="number"
                placeholder="Trials"
                value={point.trials}
                onChange={(e) => updateDataPoint('variantB', index, 'trials', e.target.value)}
                style={{ width: '100px' }}
              />
              <button
                onClick={() => removeDataPoint('variantB', index)}
                style={{
                  padding: '8px 12px',
                  background: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => addDataPoint('variantB')}
            style={{
              padding: '12px 16px',
              background: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Add Data Point
          </button>
        </div>
      </InputGrid>
    </InputContainer>
  );
};
