import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataImport } from './DataImport';
import Papa from 'papaparse';

// Mock papaparse
jest.mock('papaparse', () => ({
    parse: jest.fn()
}));

describe('DataImport', () => {
    test('renders dropzone', () => {
        render(<DataImport onDataLoaded={() => { }} />);
        expect(screen.getByText(/Drag & Drop your CSV file here/i)).toBeInTheDocument();
    });

    test('parses CSV correctly', async () => {
        const mockOnDataLoaded = jest.fn();
        render(<DataImport onDataLoaded={mockOnDataLoaded} />);

        // Simulate file selection
        const file = new File(['variant,successes,trials\nA,10,100\nB,20,100'], 'test.csv', { type: 'text/csv' });
        const input = screen.getByLabelText(/Drag & Drop your CSV file here/i).parentElement.querySelector('input');

        // Mock the Papa.parse implementation for this test
        Papa.parse.mockImplementation((file, config) => {
            // execute complete callback manually
            config.complete({
                data: [
                    { variant: 'A', successes: '10', trials: '100' },
                    { variant: 'B', successes: '20', trials: '100' }
                ]
            });
        });

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockOnDataLoaded).toHaveBeenCalledWith({
                variantA: { successes: 10, trials: 100 },
                variantB: { successes: 20, trials: 100 }
            });
        });
    });
});
