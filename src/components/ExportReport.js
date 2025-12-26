import React, { useState } from 'react';
import styled from 'styled-components';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FaFilePdf, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ExportButton = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 15px rgba(197, 48, 48, 0.4);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1000;

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 25px rgba(197, 48, 48, 0.5);
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
    transform: none;
  }
`;

const Spinner = styled(FaSpinner)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    100% { transform: rotate(360deg); }
  }
`;

export const ExportReport = ({ elementId, testData }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        const element = document.getElementById(elementId);
        if (!element) {
            toast.error('Dashboard content not found for export');
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading('Generating PDF Report...');

        try {
            // Use html2canvas to capture the visual content
            // We need to ensure all charts are rendered
            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff' // Ensure white background for PDF
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Report Header directly in PDF for distinct separate styling
            pdf.setFontSize(22);
            pdf.setTextColor(40, 44, 52);
            pdf.text('Bayesian A/B Test Report', 15, 20);

            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 28);

            if (testData?.variantA && testData?.variantB) {
                pdf.setFontSize(14);
                pdf.setTextColor(60, 60, 60);
                pdf.text('Snapshot Summary:', 15, 40);

                pdf.setFontSize(10);
                pdf.text(`Variant A: ${testData.variantA.successes} successes / ${testData.variantA.trials} trials`, 20, 50);
                pdf.text(`Variant B: ${testData.variantB.successes} successes / ${testData.variantB.trials} trials`, 20, 55);
            }

            // Add the visual dashboard capture below the text
            let heightLeft = imgHeight;
            let position = 65; // Start below the header logic

            // If image is too long for one page (likely)
            // For simplicity in this v1, we scale it to fit or create new pages
            // Basic implementation: Add first page cut

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

            // Save
            pdf.save('bayes-dash-report.pdf');

            toast.success('Report downloaded successfully!', { id: toastId });
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error('Failed to generate PDF.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <ExportButton onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? <Spinner /> : <FaFilePdf />}
            {isGenerating ? 'Generating...' : 'Export Report'}
        </ExportButton>
    );
};
