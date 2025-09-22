import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { BayesianCalculator } from '../utils/bayesianCalculator';
import { dbService } from '../services/databaseService';
import { dataSimulation } from '../services/dataSimulationService';
import { ABTestInput, SequentialTestInput } from './InputComponents';
import { InteractivePriorSelection } from './InteractivePriorSelection';
import { DynamicSampleSizeCalculator } from './DynamicSampleSizeCalculator';
import { StatisticalImagesGallery } from './StatisticalImagesGallery';
import { DynamicTestScenarioGenerator } from './DynamicTestScenarioGenerator';
import {
  PosteriorDistributionChart,
  CredibleIntervalChart,
  MonteCarloChart,
  ProbabilityGaugeChart
} from './Charts';
import toast, { Toaster } from 'react-hot-toast';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin-bottom: 16px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
`;

const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px;
  backdrop-filter: blur(10px);
`;

const Tab = styled.button`
  padding: 12px 24px;
  border: none;
  background: ${props => props.active ? 'white' : 'transparent'};
  color: ${props => props.active ? '#667eea' : 'white'};
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 4px;
  
  &:hover {
    background: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const ResultsContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin: 24px 0;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, ${props => props.color}15, ${props => props.color}05);
  border: 2px solid ${props => props.color}30;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.color};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #718096;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatDescription = styled.div`
  font-size: 12px;
  color: #a0aec0;
  margin-top: 8px;
`;

const MathematicalNotation = styled.div`
  background: #f7fafc;
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0;
  border-left: 4px solid #667eea;
`;

const MathTitle = styled.h4`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 16px;
`;

const MathContent = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #4a5568;
  line-height: 1.8;
`;

const InterpretationContainer = styled.div`
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0;
`;

const InterpretationTitle = styled.h4`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 16px;
`;

const InterpretationText = styled.p`
  font-size: 16px;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 12px;
`;

const RecommendationBox = styled.div`
  background: ${props => props.recommendation === 'B' ? 
    'linear-gradient(135deg, #10b981, #059669)' : 
    'linear-gradient(135deg, #f59e0b, #d97706)'};
  color: white;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  text-align: center;
`;

const RecommendationText = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const RecommendationSubtext = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const ExpectedLossContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 16px 0;
`;

const LossCard = styled.div`
  background: ${props => props.higher ? '#fef2f2' : '#f0fdf4'};
  border: 2px solid ${props => props.higher ? '#fecaca' : '#bbf7d0'};
  border-radius: 8px;
  padding: 16px;
  text-align: center;
`;

const LossValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.higher ? '#dc2626' : '#16a34a'};
`;

const LossLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`;

/**
 * Main Bayesian A/B Testing Dashboard Component
 * Features advanced statistical analysis, real-time updates, and comprehensive reporting
 */
export const BayesianABDashboard = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [testData, setTestData] = useState(null);
  const [sequentialData, setSequentialData] = useState({ variantA: [], variantB: [] });
  const [calculator] = useState(() => new BayesianCalculator());
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [currentPrior, setCurrentPrior] = useState({ alpha: 1, beta: 1 });
  const [sampleSizeData, setSampleSizeData] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [generatedData, setGeneratedData] = useState(null);

  // Initialize database on component mount
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await dbService.initialize();
        setIsDbInitialized(true);
        toast.success('Database initialized successfully!');
      } catch (error) {
        console.error('Database initialization failed:', error);
        toast.error('Database initialization failed, using fallback mode');
        setIsDbInitialized(true); // Still allow the app to work
      }
    };
    
    initializeDatabase();
  }, []);

  // Handle generated data from scenario generator
  useEffect(() => {
    if (generatedData) {
      // Auto-populate the test data with generated scenario data
      const newTestData = {
        variantA: {
          successes: generatedData.variantA.successes,
          trials: generatedData.variantA.trials,
          posterior: calculator.calculatePosterior(generatedData.variantA.successes, generatedData.variantA.trials)
        },
        variantB: {
          successes: generatedData.variantB.successes,
          trials: generatedData.variantB.trials,
          posterior: calculator.calculatePosterior(generatedData.variantB.successes, generatedData.variantB.trials)
        },
        prior: currentPrior
      };
      setTestData(newTestData);
      toast.success(`Generated data for ${generatedData.scenario} scenario!`);
    }
  }, [generatedData, calculator, currentPrior]);

  const results = useMemo(() => {
    if (!testData) return null;

    const { variantA, variantB, prior } = testData;
    const posteriorA = variantA.posterior;
    const posteriorB = variantB.posterior;

    // Calculate all statistical measures
    const probBGreater = calculator.calculateProbabilityBGreaterThanAMonteCarlo(posteriorA, posteriorB);
    const expectedLoss = calculator.calculateExpectedLoss(posteriorA, posteriorB);
    const credibleIntervalA = calculator.calculateCredibleInterval(posteriorA, 0.95);
    const credibleIntervalB = calculator.calculateCredibleInterval(posteriorB, 0.95);
    const bayesFactor = calculator.calculateBayesFactor(posteriorA, posteriorB);
    
    // Posterior predictive distributions
    const predictiveA = calculator.posteriorPredictive(posteriorA, 1000);
    const predictiveB = calculator.posteriorPredictive(posteriorB, 1000);

    return {
      probBGreater,
      expectedLoss,
      credibleIntervalA,
      credibleIntervalB,
      bayesFactor,
      predictiveA,
      predictiveB,
      posteriorA,
      posteriorB,
      prior
    };
  }, [testData, calculator]);

  const sequentialResults = useMemo(() => {
    if (sequentialData.variantA.length === 0 || sequentialData.variantB.length === 0) {
      return null;
    }

    return calculator.sequentialTest(sequentialData.variantA, sequentialData.variantB, 0.95);
  }, [sequentialData, calculator]);

  const getRecommendation = () => {
    if (!results) return null;
    
    const { probBGreater, expectedLoss } = results;
    
    if (probBGreater > 0.8) {
      return {
        variant: 'B',
        confidence: 'High',
        probability: probBGreater,
        expectedLoss: expectedLoss.lossA
      };
    } else if (probBGreater < 0.2) {
      return {
        variant: 'A',
        confidence: 'High',
        probability: 1 - probBGreater,
        expectedLoss: expectedLoss.lossB
      };
    } else {
      return {
        variant: 'Inconclusive',
        confidence: 'Low',
        probability: Math.max(probBGreater, 1 - probBGreater),
        expectedLoss: Math.min(expectedLoss.lossA, expectedLoss.lossB)
      };
    }
  };

  const recommendation = getRecommendation();

  return (
    <DashboardContainer>
      <Header>
        <Title>Bayesian A/B Testing Dashboard</Title>
        <Subtitle>
          Advanced statistical analysis using Bayesian inference, Monte Carlo simulation, 
          and sequential testing methodologies for rigorous conversion rate optimization
        </Subtitle>
      </Header>

      <ContentContainer>
        <TabContainer>
          <Tab 
            active={activeTab === 'basic'} 
            onClick={() => setActiveTab('basic')}
          >
            Basic Analysis
          </Tab>
          <Tab 
            active={activeTab === 'scenarios'} 
            onClick={() => setActiveTab('scenarios')}
          >
            Test Scenarios
          </Tab>
          <Tab 
            active={activeTab === 'calculator'} 
            onClick={() => setActiveTab('calculator')}
          >
            Sample Calculator
          </Tab>
          <Tab 
            active={activeTab === 'sequential'} 
            onClick={() => setActiveTab('sequential')}
          >
            Sequential Testing
          </Tab>
          <Tab 
            active={activeTab === 'gallery'} 
            onClick={() => setActiveTab('gallery')}
          >
            Resources
          </Tab>
          <Tab 
            active={activeTab === 'advanced'} 
            onClick={() => setActiveTab('advanced')}
          >
            Advanced Analytics
          </Tab>
        </TabContainer>

        {activeTab === 'basic' && (
          <>
            <InteractivePriorSelection 
              onPriorChange={setCurrentPrior} 
              calculator={calculator} 
            />
            <ABTestInput onDataChange={setTestData} calculator={calculator} />
            
            {results && (
              <ResultsContainer>
                <h2 style={{ textAlign: 'center', marginBottom: '32px', color: '#2d3748' }}>
                  Bayesian Analysis Results
                </h2>
                
                <ResultsGrid>
                  <StatCard color="#10b981">
                    <StatValue color="#10b981">
                      {(results.probBGreater * 100).toFixed(1)}%
                    </StatValue>
                    <StatLabel>P(B > A)</StatLabel>
                    <StatDescription>
                      Probability that Variant B outperforms Variant A
                    </StatDescription>
                  </StatCard>

                  <StatCard color="#3b82f6">
                    <StatValue color="#3b82f6">
                      {results.bayesFactor.toFixed(2)}
                    </StatValue>
                    <StatLabel>Bayes Factor</StatLabel>
                    <StatDescription>
                      Evidence strength for model comparison
                    </StatDescription>
                  </StatCard>

                  <StatCard color="#8b5cf6">
                    <StatValue color="#8b5cf6">
                      {(results.credibleIntervalA.lower * 100).toFixed(1)}% - {(results.credibleIntervalA.upper * 100).toFixed(1)}%
                    </StatValue>
                    <StatLabel>A 95% Credible Interval</StatLabel>
                    <StatDescription>
                      Bayesian confidence interval for Variant A
                    </StatDescription>
                  </StatCard>

                  <StatCard color="#ec4899">
                    <StatValue color="#ec4899">
                      {(results.credibleIntervalB.lower * 100).toFixed(1)}% - {(results.credibleIntervalB.upper * 100).toFixed(1)}%
                    </StatValue>
                    <StatLabel>B 95% Credible Interval</StatLabel>
                    <StatDescription>
                      Bayesian confidence interval for Variant B
                    </StatDescription>
                  </StatCard>
                </ResultsGrid>

                {recommendation && (
                  <RecommendationBox recommendation={recommendation.variant}>
                    <RecommendationText>
                      {recommendation.variant === 'Inconclusive' 
                        ? 'Insufficient Evidence' 
                        : `Recommendation: Choose Variant ${recommendation.variant}`}
                    </RecommendationText>
                    <RecommendationSubtext>
                      {recommendation.variant === 'Inconclusive' 
                        ? 'Collect more data to reach statistical significance'
                        : `${recommendation.confidence} confidence (${(recommendation.probability * 100).toFixed(1)}% probability)`}
                    </RecommendationSubtext>
                  </RecommendationBox>
                )}

                <ExpectedLossContainer>
                  <LossCard higher={results.expectedLoss.lossA > results.expectedLoss.lossB}>
                    <LossValue higher={results.expectedLoss.lossA > results.expectedLoss.lossB}>
                      {(results.expectedLoss.lossA * 100).toFixed(2)}%
                    </LossValue>
                    <LossLabel>Expected Loss (Choose A)</LossLabel>
                  </LossCard>
                  <LossCard higher={results.expectedLoss.lossB > results.expectedLoss.lossA}>
                    <LossValue higher={results.expectedLoss.lossB > results.expectedLoss.lossA}>
                      {(results.expectedLoss.lossB * 100).toFixed(2)}%
                    </LossValue>
                    <LossLabel>Expected Loss (Choose B)</LossLabel>
                  </LossCard>
                </ExpectedLossContainer>

                <MathematicalNotation>
                  <MathTitle>Mathematical Summary</MathTitle>
                  <MathContent>
                    <strong>Prior Distribution:</strong> θ ~ Beta(α₀ = {results.prior.alpha}, β₀ = {results.prior.beta})<br/>
                    <strong>Posterior A:</strong> θ_A|X_A ~ Beta(α = {results.posteriorA.alpha.toFixed(2)}, β = {results.posteriorA.beta.toFixed(2)})<br/>
                    <strong>Posterior B:</strong> θ_B|X_B ~ Beta(α = {results.posteriorB.alpha.toFixed(2)}, β = {results.posteriorB.beta.toFixed(2)})<br/>
                    <strong>Expected Values:</strong> E[θ_A] = {(calculator.calculateExpectedValue(results.posteriorA) * 100).toFixed(2)}%, E[θ_B] = {(calculator.calculateExpectedValue(results.posteriorB) * 100).toFixed(2)}%<br/>
                    <strong>Posterior Predictive (1000 trials):</strong> A ~ {(results.predictiveA.expectedSuccesses).toFixed(0)} ± {(Math.sqrt(results.predictiveA.variance)).toFixed(0)}, B ~ {(results.predictiveB.expectedSuccesses).toFixed(0)} ± {(Math.sqrt(results.predictiveB.variance)).toFixed(0)}
                  </MathContent>
                </MathematicalNotation>

                <InterpretationContainer>
                  <InterpretationTitle>Statistical Interpretation</InterpretationTitle>
                  <InterpretationText>
                    The Bayesian analysis provides a probabilistic framework for decision-making under uncertainty. 
                    Unlike frequentist methods that provide p-values, Bayesian inference directly answers the question: 
                    "What is the probability that Variant B outperforms Variant A?"
                  </InterpretationText>
                  <InterpretationText>
                    The credible intervals represent the range of conversion rates that are most plausible given the observed data, 
                    incorporating both the prior knowledge and the likelihood of the observed outcomes.
                  </InterpretationText>
                  <InterpretationText>
                    Expected loss quantifies the potential cost of making the wrong decision, providing a risk-aware approach 
                    to variant selection that considers both the probability of being correct and the magnitude of potential errors.
                  </InterpretationText>
                </InterpretationContainer>
              </ResultsContainer>
            )}

            {results && (
              <>
                <ProbabilityGaugeChart probability={results.probBGreater} />
                <PosteriorDistributionChart 
                  posteriorA={results.posteriorA} 
                  posteriorB={results.posteriorB} 
                  calculator={calculator} 
                />
                <CredibleIntervalChart 
                  posteriorA={results.posteriorA} 
                  posteriorB={results.posteriorB} 
                  calculator={calculator} 
                />
                <MonteCarloChart 
                  posteriorA={results.posteriorA} 
                  posteriorB={results.posteriorB} 
                  calculator={calculator} 
                />
              </>
            )}
          </>
        )}

        {activeTab === 'scenarios' && (
          <DynamicTestScenarioGenerator 
            onScenarioSelect={setSelectedScenario}
            onDataGenerated={setGeneratedData}
          />
        )}

        {activeTab === 'calculator' && (
          <DynamicSampleSizeCalculator 
            onSampleSizeChange={setSampleSizeData}
          />
        )}

        {activeTab === 'gallery' && (
          <StatisticalImagesGallery />
        )}

        {activeTab === 'sequential' && (
          <>
            <SequentialTestInput onSequentialDataChange={setSequentialData} />
            
            {sequentialResults && (
              <ResultsContainer>
                <h2 style={{ textAlign: 'center', marginBottom: '32px', color: '#2d3748' }}>
                  Sequential Testing Analysis
                </h2>
                
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ color: '#2d3748', marginBottom: '16px' }}>Early Stopping Analysis</h3>
                  {sequentialResults.map((result, index) => (
                    <div key={index} style={{
                      background: result.shouldStop ? '#fef2f2' : '#f0fdf4',
                      border: `2px solid ${result.shouldStop ? '#fecaca' : '#bbf7d0'}`,
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', color: '#2d3748' }}>
                          Step {result.step}
                        </span>
                        <span style={{ 
                          fontWeight: '700', 
                          color: result.shouldStop ? '#dc2626' : '#16a34a',
                          fontSize: '18px'
                        }}>
                          {(result.probBGreater * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                        Expected Loss A: {(result.expectedLoss.lossA * 100).toFixed(2)}% | 
                        Expected Loss B: {(result.expectedLoss.lossB * 100).toFixed(2)}%
                        {result.shouldStop && (
                          <span style={{ color: '#dc2626', fontWeight: '600', marginLeft: '12px' }}>
                            → STOP: Sufficient evidence reached
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ResultsContainer>
            )}
          </>
        )}

        {activeTab === 'advanced' && (
          <ResultsContainer>
            <h2 style={{ textAlign: 'center', marginBottom: '32px', color: '#2d3748' }}>
              Advanced Bayesian Analytics
            </h2>
            
            <MathematicalNotation>
              <MathTitle>Advanced Statistical Methods</MathTitle>
              <MathContent>
                <strong>Monte Carlo Integration:</strong> Used for calculating P(B > A) with 10,000 samples<br/>
                <strong>Cheng's Algorithm:</strong> Efficient Beta distribution sampling for posterior simulation<br/>
                <strong>Sequential Testing:</strong> Early stopping rules based on posterior probabilities<br/>
                <strong>Expected Loss:</strong> Bayesian risk quantification for decision theory<br/>
                <strong>Credible Intervals:</strong> Bayesian alternative to confidence intervals<br/>
                <strong>Posterior Predictive:</strong> Future outcome prediction using current posterior<br/>
                <strong>Sensitivity Analysis:</strong> Prior selection impact assessment<br/>
                <strong>Bayes Factors:</strong> Model comparison using marginal likelihoods
              </MathContent>
            </MathematicalNotation>

            <InterpretationContainer>
              <InterpretationTitle>Methodological Advantages</InterpretationTitle>
              <InterpretationText>
                <strong>Probabilistic Interpretation:</strong> Direct probability statements about parameters, 
                unlike frequentist confidence intervals that are not probability statements about the parameter.
              </InterpretationText>
              <InterpretationText>
                <strong>Prior Knowledge Integration:</strong> Incorporates existing knowledge through prior distributions, 
                allowing for more informed decision-making when historical data is available.
              </InterpretationText>
              <InterpretationText>
                <strong>Sequential Analysis:</strong> Enables early stopping when sufficient evidence is accumulated, 
                reducing the cost and time of experimentation while maintaining statistical rigor.
              </InterpretationText>
              <InterpretationText>
                <strong>Decision-Theoretic Framework:</strong> Provides expected loss calculations that directly 
                inform business decisions by quantifying the cost of making incorrect choices.
              </InterpretationText>
            </InterpretationContainer>
          </ResultsContainer>
        )}
      </ContentContainer>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </DashboardContainer>
  );
};
