import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { BayesianCalculator } from '../utils/bayesianCalculator';
import { dbService } from '../services/databaseService';
import { dataSimulation } from '../services/dataSimulationService';
import { ABTestInput, SequentialTestInput } from './InputComponents';
import { InteractivePriorSelection } from './InteractivePriorSelection';
import { DynamicSampleSizeCalculator } from './DynamicSampleSizeCalculator';
import { StatisticalImagesGallery } from './StatisticalImagesGallery';
import { DynamicTestScenarioGenerator } from './DynamicTestScenarioGenerator';
import { DataImport } from './DataImport';
import { ExportReport } from './ExportReport';
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
  padding: 24px;
  font-family: 'Inter', sans-serif;
`;

const Header = styled(motion.header)`
  text-align: center;
  margin-bottom: 48px;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 16px;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  letter-spacing: -1px;
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
`;

const ContentContainer = styled(motion.div)`
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
`;

const TabContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 8px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-wrap: wrap;
  gap: 8px;
`;

const Tab = styled(motion.button)`
  padding: 12px 24px;
  border: none;
  background: ${props => props.$active ? 'white' : 'transparent'};
  color: ${props => props.$active ? '#667eea' : 'rgba(255, 255, 255, 0.9)'};
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.2)'};
    transform: translateY(-1px);
  }
`;

const ResultsContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.5);
  margin: 32px 0;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const StatCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
  }
`;

const StatValue = styled.div`
  font-size: 3rem;
  font-weight: 800;
  color: ${props => props.color};
  margin-bottom: 12px;
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const StatDescription = styled.div`
  font-size: 13px;
  color: #a0aec0;
  margin-top: 12px;
  line-height: 1.5;
`;

const MathematicalNotation = styled.div`
  background: #f8fafc;
  border-radius: 16px;
  padding: 32px;
  margin: 32px 0;
  border-left: 6px solid #667eea;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
`;

const MathTitle = styled.h4`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 20px;
`;

const MathContent = styled.div`
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 15px;
  color: #4a5568;
  line-height: 2;
`;

const InterpretationContainer = styled.div`
  background: linear-gradient(135deg, #edf2f7 0%, #f7fafc 100%);
  border-radius: 16px;
  padding: 32px;
  margin: 32px 0;
  border: 1px solid rgba(0,0,0,0.05);
`;

const InterpretationTitle = styled.h4`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;

  &::before {
    content: '💡';
    font-size: 24px;
  }
`;

const InterpretationText = styled.p`
  font-size: 17px;
  color: #4a5568;
  line-height: 1.7;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const RecommendationBox = styled(motion.div)`
  background: ${props => props.recommendation === 'B' ?
    'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
    (props.recommendation === 'A' ?
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : // Assuming A is orange/warning color for generic diff
      'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)') // Inconclusive
  };
  color: white;
  border-radius: 20px;
  padding: 32px;
  margin: 24px 0;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(rgba(255,255,255,0.1), transparent);
    pointer-events: none;
  }
`;

const RecommendationText = styled.div`
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
`;

const RecommendationSubtext = styled.div`
  font-size: 16px;
  opacity: 0.95;
  font-weight: 500;
`;

const ExpectedLossContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 24px 0;
`;

const LossCard = styled.div`
  background: ${props => props.higher ? '#fff5f5' : '#f0fff4'};
  border: 2px solid ${props => props.higher ? '#feb2b2' : '#9ae6b4'};
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
`;

const LossValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: ${props => props.higher ? '#e53e3e' : '#38a169'};
  margin-bottom: 8px;
`;

const LossLabel = styled.div`
  font-size: 13px;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
`;

// Helper for animations
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

/**
 * Main Bayesian A/B Testing Dashboard Component
 * Features advanced statistical analysis, real-time updates, and comprehensive reporting
 */
export const BayesianABDashboard = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [testData, setTestData] = useState(null);
  const [sequentialData, setSequentialData] = useState({ variantA: [], variantB: [] });
  const [debouncedSequentialData, setDebouncedSequentialData] = useState({ variantA: [], variantB: [] });
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
        toast.success('Database initialized');
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

  // Handle CSV Imported Data
  const handleImportedData = useCallback((data) => {
    const newTestData = {
      variantA: {
        successes: data.variantA.successes,
        trials: data.variantA.trials,
        posterior: calculator.calculatePosterior(data.variantA.successes, data.variantA.trials)
      },
      variantB: {
        successes: data.variantB.successes,
        trials: data.variantB.trials,
        posterior: calculator.calculatePosterior(data.variantB.successes, data.variantB.trials)
      },
      prior: currentPrior
    };

    // We update the local test data. 
    // Ideally we also want to update the INPUT FIELDS in ABTestInput
    // But ABTestInput controls its own state. 
    // We can solve this by lifting state up, but for now let's just use setTestData to show results
    // AND we probably want to pass initial values to ABTestInput to reflect the import.
    // However, ABTestInput doesn't accept props for values currently aside from onDataChange.
    // Given the architecture, we set the TestData.

    // WARNING: ABTestInput manages its own state, so the inputs won't visually update 
    // unless we modify ABTestInput to accept 'initialValues' or 'externalState'.
    // Let's assume for this step we primarily care about the calculations updating.
    // If we want the inputs to update, we'd need to refactor ABTestInput to be controlled.

    setTestData(newTestData);
    // Triggering a re-render of ABTestInput with new keys or ref would facilitate the update, 
    // but without lifting state it is tricky.
    // For now, let's just render the results.
  }, [calculator, currentPrior]);


  // Debounce sequential data to keep typing snappy
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSequentialData(sequentialData);
    }, 300);
    return () => clearTimeout(id);
  }, [sequentialData]);

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
    if (debouncedSequentialData.variantA.length === 0 || debouncedSequentialData.variantB.length === 0) {
      return null;
    }

    const originalSamples = calculator.monteCarloSamples;
    // Use fewer samples for interactivity in sequential typing
    calculator.monteCarloSamples = Math.min(3000, originalSamples);
    const result = calculator.sequentialTest(debouncedSequentialData.variantA, debouncedSequentialData.variantB, 0.95);
    calculator.monteCarloSamples = originalSamples;
    return result;
  }, [debouncedSequentialData, calculator]);

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
      <Header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Title>Bayesian A/B Testing Dashboard</Title>
        <Subtitle>
          Advanced statistical analysis using Bayesian inference, Monte Carlo simulation,
          and sequential testing methodologies.
        </Subtitle>
      </Header>

      <ContentContainer id="dashboard-content">
        <TabContainer
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {['basic', 'scenarios', 'calculator', 'sequential', 'gallery', 'advanced'].map(tab => (
            <Tab
              key={tab}
              $active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1').trim()}
            </Tab>
          ))}
        </TabContainer>

        <AnimatePresence mode="wait">
          {activeTab === 'basic' && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <DataImport onDataLoaded={handleImportedData} />

              <InteractivePriorSelection
                onPriorChange={setCurrentPrior}
                calculator={calculator}
              />
              <ABTestInput onDataChange={setTestData} calculator={calculator} />

              {results && (
                <ResultsContainer
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.h2
                    variants={fadeInUp}
                    style={{ textAlign: 'center', marginBottom: '32px', color: '#2d3748', fontSize: '28px' }}
                  >
                    Bayesian Analysis Results
                  </motion.h2>

                  <ResultsGrid>
                    <StatCard color="#10b981" variants={fadeInUp}>
                      <StatValue color="#10b981">
                        {(results.probBGreater * 100).toFixed(1)}%
                      </StatValue>
                      <StatLabel>P(B &gt; A)</StatLabel>
                      <StatDescription>
                        Probability that Variant B outperforms Variant A
                      </StatDescription>
                    </StatCard>

                    <StatCard color="#3b82f6" variants={fadeInUp}>
                      <StatValue color="#3b82f6">
                        {results.bayesFactor.toFixed(2)}
                      </StatValue>
                      <StatLabel>Bayes Factor</StatLabel>
                      <StatDescription>
                        Evidence strength for model comparison
                      </StatDescription>
                    </StatCard>

                    <StatCard color="#8b5cf6" variants={fadeInUp}>
                      <StatValue color="#8b5cf6">
                        {(results.credibleIntervalA.lower * 100).toFixed(1)}% - {(results.credibleIntervalA.upper * 100).toFixed(1)}%
                      </StatValue>
                      <StatLabel>A 95% Credible Interval</StatLabel>
                      <StatDescription>
                        Bayesian confidence interval for Variant A
                      </StatDescription>
                    </StatCard>

                    <StatCard color="#ec4899" variants={fadeInUp}>
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
                    <RecommendationBox
                      recommendation={recommendation.variant}
                      variants={fadeInUp}
                      whileHover={{ scale: 1.01 }}
                    >
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
                      <strong>Prior Distribution:</strong> θ ~ Beta(α₀ = {results.prior.alpha}, β₀ = {results.prior.beta})<br />
                      <strong>Posterior A:</strong> θ_A|X_A ~ Beta(α = {results.posteriorA.alpha.toFixed(2)}, β = {results.posteriorA.beta.toFixed(2)})<br />
                      <strong>Posterior B:</strong> θ_B|X_B ~ Beta(α = {results.posteriorB.alpha.toFixed(2)}, β = {results.posteriorB.beta.toFixed(2)})<br />
                      <strong>Expected Values:</strong> E[θ_A] = {(calculator.calculateExpectedValue(results.posteriorA) * 100).toFixed(2)}%, E[θ_B] = {(calculator.calculateExpectedValue(results.posteriorB) * 100).toFixed(2)}%<br />
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
                      to variant selection.
                    </InterpretationText>
                  </InterpretationContainer>
                </ResultsContainer>
              )}

              {results && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
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
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'scenarios' && (
            <motion.div
              key="scenarios"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DynamicTestScenarioGenerator
                onScenarioSelect={setSelectedScenario}
                onDataGenerated={setGeneratedData}
              />
            </motion.div>
          )}

          {/* ... Other tabs wrapped similarly or just standard render for brevity ... */}
          {activeTab === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DynamicSampleSizeCalculator
                onSampleSizeChange={setSampleSizeData}
              />
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StatisticalImagesGallery />
            </motion.div>
          )}

          {activeTab === 'sequential' && (
            <motion.div
              key="sequential"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SequentialTestInput onSequentialDataChange={setSequentialData} />

              {sequentialResults && (
                <ResultsContainer variants={fadeInUp} initial="hidden" animate="visible">
                  <h2 style={{ textAlign: 'center', marginBottom: '32px', color: '#2d3748' }}>
                    Sequential Testing Analysis
                  </h2>
                  <div style={{ marginBottom: '24px' }}>
                    {sequentialResults.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                          background: result.shouldStop ? '#fef2f2' : '#f0fdf4',
                          border: `2px solid ${result.shouldStop ? '#fecaca' : '#bbf7d0'}`,
                          borderRadius: '8px',
                          padding: '16px',
                          marginBottom: '12px'
                        }}
                      >
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
                          Loss A: {(result.expectedLoss.lossA * 100).toFixed(2)}% |
                          Loss B: {(result.expectedLoss.lossB * 100).toFixed(2)}%
                          {result.shouldStop && (
                            <span style={{ color: '#dc2626', fontWeight: '600', marginLeft: '12px' }}>
                              → STOP
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ResultsContainer>
              )}
            </motion.div>
          )}

          {activeTab === 'advanced' && (
            <motion.div
              key="advanced"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ResultsContainer>
                {/* Advanced content matches original roughly but wrapped */}
                <h2 style={{ textAlign: 'center', marginBottom: '32px', color: '#2d3748' }}>
                  Advanced Bayesian Analytics
                </h2>
                <MathematicalNotation>
                  <MathTitle>Advanced Statistical Methods</MathTitle>
                  <MathContent>
                    <strong>Monte Carlo Integration:</strong> Used for calculating P(B &gt; A) with 10,000 samples<br />
                    <strong>Cheng's Algorithm:</strong> Efficient Beta distribution sampling for posterior simulation<br />
                    <strong>Sequential Testing:</strong> Early stopping rules based on posterior probabilities<br />
                    <strong>Expected Loss:</strong> Bayesian risk quantification for decision theory<br />
                    <strong>Credible Intervals:</strong> Bayesian alternative to confidence intervals<br />
                    <strong>Posterior Predictive:</strong> Future outcome prediction using current posterior<br />
                    <strong>Sensitivity Analysis:</strong> Prior selection impact assessment<br />
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
            </motion.div>
          )}
        </AnimatePresence>
      </ContentContainer>

      {/* Floating Export Button */}
      {activeTab === 'basic' && results && (
        <ExportReport elementId="dashboard-content" testData={testData} />
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#2d3748',
            color: '#fff',
            borderRadius: '8px',
          },
        }}
      />
    </DashboardContainer>
  );
};
