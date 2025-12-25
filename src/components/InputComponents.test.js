import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ABTestInput } from './InputComponents';
import { BayesianCalculator } from '../utils/bayesianCalculator';

// Mock styled-components to avoid issues in test environment if needed
// but usually it works fine with react-testing-library

describe('ABTestInput', () => {
    let calculator;
    let mockOnDataChange;

    beforeEach(() => {
        calculator = new BayesianCalculator();
        mockOnDataChange = jest.fn();
    });

    test('renders without crashing', () => {
        render(<ABTestInput calculator={calculator} onDataChange={mockOnDataChange} />);
        expect(screen.getByText('Bayesian A/B Test Configuration')).toBeInTheDocument();
    });

    test('calls onDataChange with valid input', () => {
        render(<ABTestInput calculator={calculator} onDataChange={mockOnDataChange} />);

        // Find inputs - there are multiple inputs, we need to be specific
        // The component has "Variant A (Control)" and "Variant B (Treatment)"
        // And inside they have "Successes" and "Trials"

        // We can use unique placeholders or labels if they were unique.
        // They are "Successes (Conversions)" and "Total Trials" repeated.

        const inputs = screen.getAllByRole('spinbutton'); // number inputs
        // Order: A-Success, A-Trials, B-Success, B-Trials

        fireEvent.change(inputs[0], { target: { value: '10' } }); // A Success
        fireEvent.change(inputs[1], { target: { value: '100' } }); // A Trials
        fireEvent.change(inputs[2], { target: { value: '20' } }); // B Success
        fireEvent.change(inputs[3], { target: { value: '100' } }); // B Trials

        expect(mockOnDataChange).toHaveBeenCalled();
    });

    test('shows error when successes > trials', () => {
        render(<ABTestInput calculator={calculator} onDataChange={mockOnDataChange} />);
        const inputs = screen.getAllByRole('spinbutton');

        // Set Trials = 10
        fireEvent.change(inputs[1], { target: { value: '10' } });
        // Set Successes = 20
        fireEvent.change(inputs[0], { target: { value: '20' } });

        expect(screen.getByText('Successes cannot exceed trials')).toBeInTheDocument();
    });
});
