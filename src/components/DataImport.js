import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { FaCloudUploadAlt, FaFileCsv } from 'react-icons/fa';

const ImportContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DropZone = styled.div`
  border: 2px dashed ${props => props.isDragActive ? '#667eea' : '#cbd5e0'};
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  background: ${props => props.isDragActive ? '#ebf4ff' : '#f7fafc'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #667eea;
    background: #ebf4ff;
  }
`;

const Icon = styled(FaCloudUploadAlt)`
  font-size: 48px;
  color: #a0aec0;
  margin-bottom: 16px;
`;

const Text = styled.p`
  color: #4a5568;
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const SubText = styled.p`
  color: #a0aec0;
  font-size: 14px;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  border-radius: 8px;
  color: #2f855a;
`;

export const DataImport = ({ onDataLoaded }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [fileName, setFileName] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = () => {
        setIsDragActive(false);
    };

    const processFile = (file) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }

        setFileName(file.name);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    // Expected format: variant (A/B), successes, trials
                    const data = results.data;

                    if (data.length < 2) {
                        throw new Error('CSV must contain at least 2 rows of data');
                    }

                    // Case insensitive search for rows
                    const rowA = data.find(row => row.variant?.toLowerCase() === 'a' || row.Variant?.toLowerCase() === 'a');
                    const rowB = data.find(row => row.variant?.toLowerCase() === 'b' || row.Variant?.toLowerCase() === 'b');

                    if (!rowA || !rowB) {
                        throw new Error('Could not find rows for variant A and B (check "variant" column)');
                    }

                    const parsedData = {
                        variantA: {
                            successes: parseInt(rowA.successes || rowA.Successes),
                            trials: parseInt(rowA.trials || rowA.Trials)
                        },
                        variantB: {
                            successes: parseInt(rowB.successes || rowB.Successes),
                            trials: parseInt(rowB.trials || rowB.Trials)
                        }
                    };

                    if (isNaN(parsedData.variantA.successes) || isNaN(parsedData.variantA.trials)) {
                        throw new Error('Invalid number format in Variant A data');
                    }
                    if (isNaN(parsedData.variantB.successes) || isNaN(parsedData.variantB.trials)) {
                        throw new Error('Invalid number format in Variant B data');
                    }

                    onDataLoaded(parsedData);
                    toast.success('Stats loaded successfully from CSV!');
                } catch (error) {
                    console.error(error);
                    toast.error(`Import failed: ${error.message}`);
                    setFileName(null);
                }
            },
            error: (error) => {
                toast.error('Failed to parse CSV file');
                console.error(error);
            }
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <ImportContainer>
            <Title>
                <FaFileCsv color="#38a169" />
                Import Data from CSV
            </Title>

            <input
                type="file"
                id="csv-upload"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            <label htmlFor="csv-upload">
                <DropZone
                    isDragActive={isDragActive}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <Icon />
                    <Text>Drag & Drop your CSV file here</Text>
                    <SubText>
                        Required columns: variant, successes, trials
                        <br />
                        (Example: A, 150, 1000)
                    </SubText>
                </DropZone>
            </label>

            {fileName && (
                <FileInfo>
                    <FaFileCsv />
                    Loaded: {fileName}
                </FileInfo>
            )}
        </ImportContainer>
    );
};
