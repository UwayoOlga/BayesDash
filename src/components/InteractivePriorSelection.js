import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Slider from 'react-slider';
import { motion } from 'framer-motion';
import { FiSettings, FiTrendingUp, FiTrendingDown, FiTarget } from 'react-icons/fi';

const PriorContainer = styled.div`
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

const PriorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const PriorCard = styled(motion.div)`
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

const PriorName = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.color};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PriorDescription = styled.p`
  font-size: 12px;
  color: #718096;
  margin-bottom: 12px;
`;

const PriorParams = styled.div`
  font-size: 14px;
  color: #4a5568;
  font-family: 'Courier New', monospace;
`;

const CustomPriorSection = styled.div`
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
`;

const SliderContainer = styled.div`
  margin: 16px 0;
`;

const SliderLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
`;

const SliderWrapper = styled.div`
  margin: 8px 0;
`;

const SliderValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  text-align: center;
  margin-top: 8px;
`;

const VisualIndicator = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #718096;
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

const ImpactPreview = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
`;

const ImpactCard = styled.div`
  background: ${props => props.color}15;
  border: 1px solid ${props => props.color}30;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const ImpactValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.color};
`;

const ImpactLabel = styled.div`
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
`;

/**
 * Interactive Prior Selection Component
 * Allows users to dynamically adjust prior parameters with visual feedback
 */
export const InteractivePriorSelection = ({ onPriorChange, calculator }) => {
  const [selectedPrior, setSelectedPrior] = useState('uniform');
  const [customAlpha, setCustomAlpha] = useState(1.0);
  const [customBeta, setCustomBeta] = useState(1.0);
  const [showCustom, setShowCustom] = useState(false);

  const priorPresets = {
    uniform: {
      name: 'Uniform (Non-informative)',
      description: 'Equal probability for all conversion rates',
      alpha: 1,
      beta: 1,
      color: '#6366f1',
      icon: <FiTarget />
    },
    jeffreys: {
      name: 'Jeffreys Prior',
      description: 'Objective Bayesian approach',
      alpha: 0.5,
      beta: 0.5,
      color: '#8b5cf6',
      icon: <FiSettings />
    },
    conservative: {
      name: 'Conservative',
      description: 'Moderate confidence in low conversion rates',
      alpha: 2,
      beta: 2,
      color: '#f59e0b',
      icon: <FiTrendingDown />
    },
    optimistic: {
      name: 'Optimistic (20% baseline)',
      description: 'Expects higher conversion rates',
      alpha: 2,
      beta: 8,
      color: '#10b981',
      icon: <FiTrendingUp />
    },
    pessimistic: {
      name: 'Pessimistic (10% baseline)',
      description: 'Expects lower conversion rates',
      alpha: 1,
      beta: 9,
      color: '#ef4444',
      icon: <FiTrendingDown />
    }
  };

  useEffect(() => {
    const prior = showCustom ? 
      { alpha: customAlpha, beta: customBeta } : 
      priorPresets[selectedPrior];

    // propagate to parent
    onPriorChange(prior);

    // also sync the shared calculator so downstream computations use this prior
    if (calculator) {
      calculator.alpha = prior.alpha;
      calculator.beta = prior.beta;
    }
  }, [selectedPrior, customAlpha, customBeta, showCustom, onPriorChange, calculator]);

  const handlePriorSelect = (priorKey) => {
    setSelectedPrior(priorKey);
    setShowCustom(false);
  };

  const handleCustomToggle = () => {
    setShowCustom(!showCustom);
    if (!showCustom) {
      setCustomAlpha(priorPresets[selectedPrior].alpha);
      setCustomBeta(priorPresets[selectedPrior].beta);
    }
  };

  const calculatePriorImpact = (alpha, beta) => {
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
    const effectiveSampleSize = alpha + beta - 2;
    
    return {
      mean: mean,
      variance: variance,
      effectiveSampleSize: Math.max(0, effectiveSampleSize),
      confidence: Math.min(1, effectiveSampleSize / 10) // Confidence based on effective sample size
    };
  };

  const currentPrior = showCustom ? 
    { alpha: customAlpha, beta: customBeta } : 
    priorPresets[selectedPrior];
  
  const impact = calculatePriorImpact(currentPrior.alpha, currentPrior.beta);

  return (
    <PriorContainer>
      <Title>
        <FiSettings />
        Interactive Prior Selection
      </Title>
      <Subtitle>
        Choose your prior distribution or create a custom one. The prior represents your initial beliefs about conversion rates.
      </Subtitle>

      <PriorGrid>
        {Object.entries(priorPresets).map(([key, prior]) => (
          <PriorCard
            key={key}
            color={prior.color}
            className={selectedPrior === key && !showCustom ? 'active' : ''}
            onClick={() => handlePriorSelect(key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PriorName color={prior.color}>
              {prior.icon}
              {prior.name}
            </PriorName>
            <PriorDescription>{prior.description}</PriorDescription>
            <PriorParams>
              Beta(α = {prior.alpha}, β = {prior.beta})
            </PriorParams>
          </PriorCard>
        ))}
      </PriorGrid>

      <CustomPriorSection>
        <button
          onClick={handleCustomToggle}
          style={{
            background: showCustom ? '#667eea' : 'transparent',
            color: showCustom ? 'white' : '#667eea',
            border: '2px solid #667eea',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer',
            fontWeight: '600',
            width: '100%',
            transition: 'all 0.3s ease'
          }}
        >
          {showCustom ? 'Hide Custom Prior' : 'Create Custom Prior'}
        </button>

        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SliderContainer>
              <SliderLabel>Alpha Parameter (α)</SliderLabel>
              <SliderWrapper>
                <Slider
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={customAlpha}
                  onChange={setCustomAlpha}
                  className="horizontal-slider"
                  thumbClassName="slider-thumb"
                  trackClassName="slider-track"
                />
                <SliderValue>{customAlpha.toFixed(1)}</SliderValue>
                <VisualIndicator>
                  <span>Low confidence</span>
                  <span>High confidence</span>
                </VisualIndicator>
              </SliderWrapper>
            </SliderContainer>

            <SliderContainer>
              <SliderLabel>Beta Parameter (β)</SliderLabel>
              <SliderWrapper>
                <Slider
                  min={0.1}
                  max={20}
                  step={0.1}
                  value={customBeta}
                  onChange={setCustomBeta}
                  className="horizontal-slider"
                  thumbClassName="slider-thumb"
                  trackClassName="slider-track"
                />
                <SliderValue>{customBeta.toFixed(1)}</SliderValue>
                <VisualIndicator>
                  <span>High conversion expected</span>
                  <span>Low conversion expected</span>
                </VisualIndicator>
              </SliderWrapper>
            </SliderContainer>

            <ImpactPreview>
              <ImpactCard color="#10b981">
                <ImpactValue color="#10b981">{(impact.mean * 100).toFixed(1)}%</ImpactValue>
                <ImpactLabel>Expected Rate</ImpactLabel>
              </ImpactCard>
              <ImpactCard color="#3b82f6">
                <ImpactValue color="#3b82f6">{impact.effectiveSampleSize.toFixed(0)}</ImpactValue>
                <ImpactLabel>Effective Sample Size</ImpactLabel>
              </ImpactCard>
            </ImpactPreview>
          </motion.div>
        )}
      </CustomPriorSection>

      <MathNotation>
        <strong>Current Prior:</strong> θ ~ Beta(α = {currentPrior.alpha.toFixed(1)}, β = {currentPrior.beta.toFixed(1)})<br/>
        <strong>Expected Value:</strong> E[θ] = α/(α+β) = {(impact.mean * 100).toFixed(1)}%<br/>
        <strong>Variance:</strong> Var[θ] = αβ/[(α+β)²(α+β+1)] = {(impact.variance * 10000).toFixed(2)} (×10⁻⁴)<br/>
        <strong>Effective Sample Size:</strong> α + β - 2 = {impact.effectiveSampleSize.toFixed(1)}
      </MathNotation>
    </PriorContainer>
  );
};
