import { BayesianCalculator } from './bayesianCalculator';

describe('BayesianCalculator', () => {
    let calculator;

    beforeEach(() => {
        calculator = new BayesianCalculator();
    });

    test('should initialize with default priors', () => {
        expect(calculator.alpha).toBe(1);
        expect(calculator.beta).toBe(1);
    });

    test('calculatePosterior should correctly update alpha and beta', () => {
        const posteriors = calculator.calculatePosterior(10, 100);
        // alpha = 1 + 10 = 11
        // beta = 1 + (100 - 10) = 91
        expect(posteriors.alpha).toBe(11);
        expect(posteriors.beta).toBe(91);
    });

    test('calculateExpectedValue should return correct mean', () => {
        const posterior = { alpha: 10, beta: 10 };
        const mean = calculator.calculateExpectedValue(posterior);
        expect(mean).toBe(0.5);
    });

    test('calculateProbabilityBGreaterThanA should be high when B is clearly better', () => {
        // A: 10% (100/1000)
        // B: 20% (200/1000)
        const posA = calculator.calculatePosterior(100, 1000);
        const posB = calculator.calculatePosterior(200, 1000); // Clearly better

        // Monte Carlo simulation result
        const prob = calculator.calculateProbabilityBGreaterThanAMonteCarlo(posA, posB);
        expect(prob).toBeGreaterThan(0.99);
    });

    test('calculateProbabilityBGreaterThanA should be around 0.5 for identical variants', () => {
        const posA = calculator.calculatePosterior(100, 1000);
        const posB = calculator.calculatePosterior(100, 1000);

        const prob = calculator.calculateProbabilityBGreaterThanAMonteCarlo(posA, posB);
        expect(prob).toBeGreaterThan(0.4);
        expect(prob).toBeLessThan(0.6);
    });

    test('calculateExpectedLoss should be close to 0 given clear winner', () => {
        const posA = calculator.calculatePosterior(100, 1000);
        const posB = calculator.calculatePosterior(200, 1000); // B is winner

        const loss = calculator.calculateExpectedLoss(posA, posB);

        // Loss of choosing B should be tiny
        expect(loss.lossB).toBeLessThan(0.001);
        // Loss of choosing A should be significant (approx 0.1 difference)
        expect(loss.lossA).toBeGreaterThan(0.05);
    });

    test('betaPDF should return valid density', () => {
        // Peak of Beta(2,2) is at 0.5
        const peak = calculator.betaPDF(0.5, 2, 2);
        const side = calculator.betaPDF(0.1, 2, 2);
        expect(peak).toBeGreaterThan(side);
    });
});
