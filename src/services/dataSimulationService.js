import { BayesianCalculator } from '../utils/bayesianCalculator';

/**
 * Dynamic Data Simulation Service
 * Generates realistic A/B test scenarios and data
 */
export class DataSimulationService {
  constructor() {
    this.calculator = new BayesianCalculator();
    this.scenarios = [
      {
        name: "E-commerce Checkout Button",
        description: "Testing different button colors for checkout conversion",
        baselineRate: 0.12,
        expectedLift: 0.15,
        variability: 0.02
      },
      {
        name: "Email Subject Line",
        description: "A/B testing email open rates with different subject lines",
        baselineRate: 0.25,
        expectedLift: 0.08,
        variability: 0.03
      },
      {
        name: "Landing Page Headline",
        description: "Testing different headlines for sign-up conversion",
        baselineRate: 0.08,
        expectedLift: 0.20,
        variability: 0.015
      },
      {
        name: "Pricing Page Layout",
        description: "Testing different pricing page designs for subscription conversion",
        baselineRate: 0.15,
        expectedLift: 0.12,
        variability: 0.025
      },
      {
        name: "Mobile App Onboarding",
        description: "Testing different onboarding flows for user retention",
        baselineRate: 0.35,
        expectedLift: 0.10,
        variability: 0.04
      }
    ];
  }

  /**
   * Generate realistic test data based on scenario
   */
  generateTestData(scenarioIndex = 0, sampleSize = 1000, days = 7) {
    const scenario = this.scenarios[scenarioIndex] || this.scenarios[0];
    const { baselineRate, expectedLift, variability } = scenario;
    
    // Generate realistic conversion rates with some randomness
    const variantARate = baselineRate + (Math.random() - 0.5) * variability;
    const variantBRate = baselineRate * (1 + expectedLift) + (Math.random() - 0.5) * variability;
    
    // Ensure rates are between 0 and 1
    const safeARate = Math.max(0.01, Math.min(0.99, variantARate));
    const safeBRate = Math.max(0.01, Math.min(0.99, variantBRate));
    
    // Generate daily data
    const dailyData = [];
    for (let day = 0; day < days; day++) {
      // Add some daily variation
      const dayVariation = 0.8 + Math.random() * 0.4; // 80% to 120% of normal
      const dailySampleSize = Math.floor(sampleSize / days * dayVariation);
      
      // Generate successes using binomial distribution approximation
      const aSuccesses = Math.floor(dailySampleSize * safeARate * (0.9 + Math.random() * 0.2));
      const bSuccesses = Math.floor(dailySampleSize * safeBRate * (0.9 + Math.random() * 0.2));
      
      dailyData.push({
        day: day + 1,
        variantA: {
          successes: aSuccesses,
          trials: dailySampleSize,
          rate: aSuccesses / dailySampleSize
        },
        variantB: {
          successes: bSuccesses,
          trials: dailySampleSize,
          rate: bSuccesses / dailySampleSize
        }
      });
    }
    
    return {
      scenario,
      dailyData,
      totalA: {
        successes: dailyData.reduce((sum, day) => sum + day.variantA.successes, 0),
        trials: dailyData.reduce((sum, day) => sum + day.variantA.trials, 0)
      },
      totalB: {
        successes: dailyData.reduce((sum, day) => sum + day.variantB.successes, 0),
        trials: dailyData.reduce((sum, day) => sum + day.variantB.trials, 0)
      }
    };
  }

  /**
   * Generate sequential test data with early stopping simulation
   */
  generateSequentialData(scenarioIndex = 0, maxDays = 30) {
    const scenario = this.scenarios[scenarioIndex] || this.scenarios[0];
    const { baselineRate, expectedLift, variability } = scenario;
    
    const variantARate = baselineRate + (Math.random() - 0.5) * variability;
    const variantBRate = baselineRate * (1 + expectedLift) + (Math.random() - 0.5) * variability;
    
    const safeARate = Math.max(0.01, Math.min(0.99, variantARate));
    const safeBRate = Math.max(0.01, Math.min(0.99, variantBRate));
    
    const sequentialData = [];
    let cumulativeA = { successes: 0, trials: 0 };
    let cumulativeB = { successes: 0, trials: 0 };
    
    for (let day = 1; day <= maxDays; day++) {
      // Daily sample size with some variation
      const dailySampleSize = 200 + Math.floor(Math.random() * 100);
      
      // Generate daily successes
      const aSuccesses = Math.floor(dailySampleSize * safeARate * (0.9 + Math.random() * 0.2));
      const bSuccesses = Math.floor(dailySampleSize * safeBRate * (0.9 + Math.random() * 0.2));
      
      // Update cumulative totals
      cumulativeA.successes += aSuccesses;
      cumulativeA.trials += dailySampleSize;
      cumulativeB.successes += bSuccesses;
      cumulativeB.trials += dailySampleSize;
      
      // Calculate Bayesian probability
      const posteriorA = this.calculator.calculatePosterior(cumulativeA.successes, cumulativeA.trials);
      const posteriorB = this.calculator.calculatePosterior(cumulativeB.successes, cumulativeB.trials);
      const probBGreater = this.calculator.calculateProbabilityBGreaterThanAMonteCarlo(posteriorA, posteriorB);
      
      sequentialData.push({
        day,
        variantA: {
          successes: aSuccesses,
          trials: dailySampleSize,
          cumulative: { ...cumulativeA }
        },
        variantB: {
          successes: bSuccesses,
          trials: dailySampleSize,
          cumulative: { ...cumulativeB }
        },
        probabilityBGreater: probBGreater,
        shouldStop: probBGreater >= 0.95 || probBGreater <= 0.05
      });
      
      // Early stopping
      if (probBGreater >= 0.95 || probBGreater <= 0.05) {
        break;
      }
    }
    
    return {
      scenario,
      sequentialData,
      finalResults: {
        variantA: cumulativeA,
        variantB: cumulativeB,
        probabilityBGreater: sequentialData[sequentialData.length - 1]?.probabilityBGreater || 0
      }
    };
  }

  /**
   * Generate sample size recommendations
   */
  calculateSampleSize(baselineRate, expectedLift, power = 0.8, alpha = 0.05) {
    // Using power analysis for binomial proportions
    const zAlpha = 1.96; // 95% confidence
    const zBeta = 0.84; // 80% power
    
    const p1 = baselineRate;
    const p2 = baselineRate * (1 + expectedLift);
    const pPooled = (p1 + p2) / 2;
    
    const numerator = Math.pow(zAlpha * Math.sqrt(2 * pPooled * (1 - pPooled)) + 
                              zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
    const denominator = Math.pow(p2 - p1, 2);
    
    const sampleSize = Math.ceil(numerator / denominator);
    
    return {
      perVariant: sampleSize,
      total: sampleSize * 2,
      expectedDuration: Math.ceil(sampleSize * 2 / 1000), // Assuming 1000 visitors per day
      baselineRate: p1,
      expectedRate: p2,
      expectedLift: expectedLift
    };
  }

  /**
   * Generate realistic user behavior patterns
   */
  generateUserBehaviorPatterns() {
    return {
      hourly: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        traffic: this.getHourlyTraffic(hour),
        conversionRate: this.getHourlyConversionRate(hour)
      })),
      weekly: Array.from({ length: 7 }, (_, day) => ({
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
        traffic: this.getWeeklyTraffic(day),
        conversionRate: this.getWeeklyConversionRate(day)
      }))
    };
  }

  getHourlyTraffic(hour) {
    // Simulate realistic traffic patterns
    if (hour >= 9 && hour <= 17) return 0.8 + Math.random() * 0.4; // Business hours
    if (hour >= 19 && hour <= 22) return 0.6 + Math.random() * 0.3; // Evening
    return 0.2 + Math.random() * 0.2; // Night/early morning
  }

  getHourlyConversionRate(hour) {
    // Conversion rates vary by time of day
    if (hour >= 10 && hour <= 14) return 0.9 + Math.random() * 0.2; // Peak hours
    if (hour >= 20 && hour <= 22) return 0.8 + Math.random() * 0.3; // Evening
    return 0.7 + Math.random() * 0.3; // Other times
  }

  getWeeklyTraffic(day) {
    // Weekend vs weekday patterns
    if (day === 0 || day === 6) return 0.6 + Math.random() * 0.2; // Weekend
    return 0.8 + Math.random() * 0.3; // Weekday
  }

  getWeeklyConversionRate(day) {
    // Conversion rates by day of week
    if (day === 1) return 0.7 + Math.random() * 0.2; // Monday blues
    if (day === 5) return 0.9 + Math.random() * 0.1; // Friday excitement
    return 0.8 + Math.random() * 0.2; // Other days
  }

  /**
   * Get available scenarios
   */
  getScenarios() {
    return this.scenarios;
  }

  /**
   * Generate realistic test names
   */
  generateTestName(scenarioIndex = 0) {
    const scenario = this.scenarios[scenarioIndex] || this.scenarios[0];
    const variations = [
      `Q4 ${scenario.name} Optimization`,
      `${scenario.name} Performance Test`,
      `Winter ${scenario.name} Campaign`,
      `${scenario.name} Conversion Boost`,
      `Holiday ${scenario.name} Experiment`
    ];
    
    return variations[Math.floor(Math.random() * variations.length)];
  }
}

// Create singleton instance
export const dataSimulation = new DataSimulationService();
