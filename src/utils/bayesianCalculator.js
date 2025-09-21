import { evaluate } from 'mathjs';

/**
 * Advanced Bayesian A/B Testing Calculator
 * 
 * Implements sophisticated Bayesian inference for conversion rate testing using:
 * - Beta-Binomial conjugate priors
 * - Monte Carlo simulation for complex posterior distributions
 * - Sequential testing with early stopping rules
 * - Credible intervals and posterior predictive distributions
 * - Sensitivity analysis for prior selection
 * 
 * Mathematical Foundation:
 * Prior: θ ~ Beta(α₀, β₀)
 * Likelihood: X|θ ~ Binomial(n, θ)
 * Posterior: θ|X ~ Beta(α₀ + x, β₀ + n - x)
 * 
 * Where θ is the conversion rate, n is trials, x is successes
 */

export class BayesianCalculator {
  constructor(alpha = 1, beta = 1) {
    this.alpha = alpha;
    this.beta = beta;
    this.monteCarloSamples = 10000;
  }

  /**
   * Calculate posterior parameters for a variant
   * @param {number} successes - Number of successful conversions
   * @param {number} trials - Total number of trials
   * @returns {Object} Posterior parameters {alpha, beta}
   */
  calculatePosterior(successes, trials) {
    const failures = trials - successes;
    return {
      alpha: this.alpha + successes,
      beta: this.beta + failures
    };
  }

  /**
   * Calculate probability density function for Beta distribution
   * @param {number} x - Value to evaluate
   * @param {number} alpha - Alpha parameter
   * @param {number} beta - Beta parameter
   * @returns {number} PDF value
   */
  betaPDF(x, alpha, beta) {
    if (x <= 0 || x >= 1) return 0;
    
    // Beta function: B(α,β) = Γ(α)Γ(β)/Γ(α+β)
    const logBeta = this.logGamma(alpha) + this.logGamma(beta) - this.logGamma(alpha + beta);
    
    // PDF: f(x) = x^(α-1) * (1-x)^(β-1) / B(α,β)
    const logPDF = (alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logBeta;
    
    return Math.exp(logPDF);
  }

  /**
   * Calculate log of gamma function using Stirling's approximation
   * @param {number} x - Input value
   * @returns {number} log(Γ(x))
   */
  logGamma(x) {
    if (x < 0.5) {
      return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * x)) - this.logGamma(1 - x);
    }
    
    x -= 1;
    let a = x + 5.5;
    let b = x + 0.5;
    let c = 0.99999999999980993;
    
    const coefficients = [
      676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012,
      9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    
    for (let i = 0; i < coefficients.length; i++) {
      c += coefficients[i] / (x + i + 1);
    }
    
    return Math.log(c) + b * Math.log(a) - a;
  }

  /**
   * Calculate probability that B > A
   * @param {Object} posteriorA - Posterior parameters for variant A
   * @param {Object} posteriorB - Posterior parameters for variant B
   * @returns {number} Probability that B > A
   */
  calculateProbabilityBGreaterThanA(posteriorA, posteriorB) {
    const { alpha: alphaA, beta: betaA } = posteriorA;
    const { alpha: alphaB, beta: betaB } = posteriorB;
    
    // Using numerical integration
    const numPoints = 1000;
    let probability = 0;
    
    for (let i = 0; i < numPoints; i++) {
      const x = i / numPoints;
      const pdfA = this.betaPDF(x, alphaA, betaA);
      const cdfB = this.betaCDF(x, alphaB, betaB);
      probability += pdfA * cdfB / numPoints;
    }
    
    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Calculate cumulative distribution function for Beta distribution
   * @param {number} x - Value to evaluate
   * @param {number} alpha - Alpha parameter
   * @param {number} beta - Beta parameter
   * @returns {number} CDF value
   */
  betaCDF(x, alpha, beta) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    
    // Using numerical integration for CDF
    const numPoints = 1000;
    let cdf = 0;
    
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * x;
      cdf += this.betaPDF(t, alpha, beta) * x / numPoints;
    }
    
    return cdf;
  }

  /**
   * Generate data points for plotting posterior distributions
   * @param {Object} posterior - Posterior parameters
   * @param {number} numPoints - Number of points to generate
   * @returns {Array} Array of {x, y} points
   */
  generateDistributionData(posterior, numPoints = 100) {
    const { alpha, beta } = posterior;
    const data = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints;
      const y = this.betaPDF(x, alpha, beta);
      data.push({ x, y });
    }
    
    return data;
  }

  /**
   * Calculate credible interval for posterior distribution
   * @param {Object} posterior - Posterior parameters
   * @param {number} confidence - Confidence level (e.g., 0.95 for 95%)
   * @returns {Object} {lower, upper} bounds
   */
  calculateCredibleInterval(posterior, confidence = 0.95) {
    const { alpha, beta } = posterior;
    const alpha_level = (1 - confidence) / 2;
    
    // Using approximation for credible interval
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
    const stdDev = Math.sqrt(variance);
    
    // Normal approximation for credible interval
    const z = this.inverseNormalCDF(1 - alpha_level);
    const margin = z * stdDev;
    
    return {
      lower: Math.max(0, mean - margin),
      upper: Math.min(1, mean + margin)
    };
  }

  /**
   * Inverse normal CDF approximation
   * @param {number} p - Probability
   * @returns {number} Z-score
   */
  inverseNormalCDF(p) {
    // Approximation using Beasley-Springer-Moro algorithm
    const a = [0, -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
    const b = [0, -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    const c = [0, -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0, 7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    
    const p_low = 0.02425;
    const p_high = 1 - p_low;
    
    if (p < p_low) {
      const q = Math.sqrt(-2 * Math.log(p));
      return (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
             ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    } else if (p <= p_high) {
      const q = p - 0.5;
      const r = q * q;
      return (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q /
             (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1);
    } else {
      const q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
              ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    }
  }

  /**
   * Calculate expected value (mean) of posterior distribution
   * @param {Object} posterior - Posterior parameters
   * @returns {number} Expected value
   */
  calculateExpectedValue(posterior) {
    const { alpha, beta } = posterior;
    return alpha / (alpha + beta);
  }

  /**
   * Calculate variance of posterior distribution
   * @param {Object} posterior - Posterior parameters
   * @returns {number} Variance
   */
  calculateVariance(posterior) {
    const { alpha, beta } = posterior;
    return (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  }

  /**
   * Monte Carlo simulation for posterior sampling
   * @param {Object} posterior - Posterior parameters
   * @param {number} samples - Number of samples to generate
   * @returns {Array} Array of sampled values
   */
  monteCarloSample(posterior, samples = this.monteCarloSamples) {
    const { alpha, beta } = posterior;
    const samples_array = [];
    
    // Using rejection sampling for Beta distribution
    for (let i = 0; i < samples; i++) {
      samples_array.push(this.sampleBeta(alpha, beta));
    }
    
    return samples_array;
  }

  /**
   * Sample from Beta distribution using rejection sampling
   * @param {number} alpha - Alpha parameter
   * @param {number} beta - Beta parameter
   * @returns {number} Sampled value
   */
  sampleBeta(alpha, beta) {
    // Using Cheng's algorithm for Beta sampling
    if (alpha <= 1 && beta <= 1) {
      return this.sampleBetaRejection(alpha, beta);
    } else {
      return this.sampleBetaCheng(alpha, beta);
    }
  }

  /**
   * Cheng's algorithm for Beta sampling
   * @param {number} alpha - Alpha parameter
   * @param {number} beta - Beta parameter
   * @returns {number} Sampled value
   */
  sampleBetaCheng(alpha, beta) {
    const a = Math.min(alpha, beta);
    const b = Math.max(alpha, beta);
    const gamma = a + b;
    const lambda = Math.sqrt((gamma - 2) / (2 * a * b - gamma));
    const mu = a + 1 / lambda;
    
    while (true) {
      const u1 = Math.random();
      const u2 = Math.random();
      const v = lambda * Math.log(u1 / (1 - u1));
      const w = a * Math.exp(v);
      
      if (gamma * Math.log(gamma / (b + w)) + mu * v - 1.3862944 >= Math.log(u1 * u1 * u2)) {
        return alpha === a ? w / (b + w) : b / (b + w);
      }
    }
  }

  /**
   * Rejection sampling for Beta distribution
   * @param {number} alpha - Alpha parameter
   * @param {number} beta - Beta parameter
   * @returns {number} Sampled value
   */
  sampleBetaRejection(alpha, beta) {
    while (true) {
      const u1 = Math.random();
      const u2 = Math.random();
      const x = Math.pow(u1, 1 / alpha);
      const y = Math.pow(u2, 1 / beta);
      
      if (x + y <= 1) {
        return x / (x + y);
      }
    }
  }

  /**
   * Calculate probability that B > A using Monte Carlo
   * @param {Object} posteriorA - Posterior parameters for variant A
   * @param {Object} posteriorB - Posterior parameters for variant B
   * @returns {number} Probability that B > A
   */
  calculateProbabilityBGreaterThanAMonteCarlo(posteriorA, posteriorB) {
    const samplesA = this.monteCarloSample(posteriorA, this.monteCarloSamples);
    const samplesB = this.monteCarloSample(posteriorB, this.monteCarloSamples);
    
    let count = 0;
    for (let i = 0; i < this.monteCarloSamples; i++) {
      if (samplesB[i] > samplesA[i]) {
        count++;
      }
    }
    
    return count / this.monteCarloSamples;
  }

  /**
   * Calculate Expected Loss (Bayesian Risk)
   * @param {Object} posteriorA - Posterior parameters for variant A
   * @param {Object} posteriorB - Posterior parameters for variant B
   * @returns {Object} Expected loss for choosing A or B
   */
  calculateExpectedLoss(posteriorA, posteriorB) {
    const probBGreater = this.calculateProbabilityBGreaterThanAMonteCarlo(posteriorA, posteriorB);
    const samplesA = this.monteCarloSample(posteriorA, this.monteCarloSamples);
    const samplesB = this.monteCarloSample(posteriorB, this.monteCarloSamples);
    
    let lossA = 0;
    let lossB = 0;
    
    for (let i = 0; i < this.monteCarloSamples; i++) {
      lossA += Math.max(0, samplesB[i] - samplesA[i]);
      lossB += Math.max(0, samplesA[i] - samplesB[i]);
    }
    
    return {
      lossA: lossA / this.monteCarloSamples,
      lossB: lossB / this.monteCarloSamples,
      probBGreater
    };
  }

  /**
   * Sequential testing with early stopping
   * @param {Array} dataA - Array of {successes, trials} for variant A
   * @param {Array} dataB - Array of {successes, trials} for variant B
   * @param {number} threshold - Probability threshold for stopping
   * @returns {Object} Sequential test results
   */
  sequentialTest(dataA, dataB, threshold = 0.95) {
    const results = [];
    
    for (let i = 0; i < Math.min(dataA.length, dataB.length); i++) {
      const posteriorA = this.calculatePosterior(dataA[i].successes, dataA[i].trials);
      const posteriorB = this.calculatePosterior(dataB[i].successes, dataB[i].trials);
      
      const probBGreater = this.calculateProbabilityBGreaterThanAMonteCarlo(posteriorA, posteriorB);
      const expectedLoss = this.calculateExpectedLoss(posteriorA, posteriorB);
      
      results.push({
        step: i + 1,
        probBGreater,
        expectedLoss,
        posteriorA,
        posteriorB,
        shouldStop: probBGreater >= threshold || probBGreater <= (1 - threshold)
      });
      
      if (probBGreater >= threshold || probBGreater <= (1 - threshold)) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Posterior Predictive Distribution
   * @param {Object} posterior - Posterior parameters
   * @param {number} futureTrials - Number of future trials
   * @returns {Object} Predictive distribution parameters
   */
  posteriorPredictive(posterior, futureTrials) {
    const { alpha, beta } = posterior;
    
    // Beta-Binomial predictive distribution
    return {
      alpha: alpha,
      beta: beta,
      trials: futureTrials,
      expectedSuccesses: (alpha / (alpha + beta)) * futureTrials,
      variance: futureTrials * (alpha * beta * (alpha + beta + futureTrials)) / 
                ((alpha + beta) ** 2 * (alpha + beta + 1))
    };
  }

  /**
   * Sensitivity Analysis for Prior Selection
   * @param {number} successes - Number of successes
   * @param {number} trials - Number of trials
   * @param {Array} priors - Array of {alpha, beta} prior parameters
   * @returns {Array} Results for each prior
   */
  sensitivityAnalysis(successes, trials, priors) {
    return priors.map(prior => {
      const posterior = this.calculatePosterior(successes, trials, prior.alpha, prior.beta);
      return {
        prior,
        posterior,
        expectedValue: this.calculateExpectedValue(posterior),
        credibleInterval: this.calculateCredibleInterval(posterior)
      };
    });
  }

  /**
   * Calculate posterior with custom prior
   * @param {number} successes - Number of successes
   * @param {number} trials - Number of trials
   * @param {number} alpha - Prior alpha
   * @param {number} beta - Prior beta
   * @returns {Object} Posterior parameters
   */
  calculatePosterior(successes, trials, alpha = this.alpha, beta = this.beta) {
    const failures = trials - successes;
    return {
      alpha: alpha + successes,
      beta: beta + failures
    };
  }

  /**
   * Calculate Bayes Factor for model comparison
   * @param {Object} posteriorA - Posterior for model A
   * @param {Object} posteriorB - Posterior for model B
   * @returns {number} Bayes Factor
   */
  calculateBayesFactor(posteriorA, posteriorB) {
    // Simplified Bayes Factor calculation
    const evidenceA = this.calculateEvidence(posteriorA);
    const evidenceB = this.calculateEvidence(posteriorB);
    
    return evidenceB / evidenceA;
  }

  /**
   * Calculate marginal likelihood (evidence)
   * @param {Object} posterior - Posterior parameters
   * @returns {number} Marginal likelihood
   */
  calculateEvidence(posterior) {
    const { alpha, beta } = posterior;
    return this.betaFunction(alpha, beta);
  }

  /**
   * Beta function calculation
   * @param {number} alpha - Alpha parameter
   * @param {number} beta - Beta parameter
   * @returns {number} Beta function value
   */
  betaFunction(alpha, beta) {
    return Math.exp(this.logGamma(alpha) + this.logGamma(beta) - this.logGamma(alpha + beta));
  }
}
