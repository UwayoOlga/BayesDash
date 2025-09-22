import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiImage, FiDownload, FiRefreshCw, FiPlay, FiPause } from 'react-icons/fi';

const ImageGalleryContainer = styled.div`
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

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const ImageCard = styled(motion.div)`
  background: linear-gradient(135deg, ${props => props.color}15, ${props => props.color}05);
  border: 2px solid ${props => props.color}30;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${props => props.color}20;
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  text-align: center;
`;

const ImageTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
`;

const ImageDescription = styled.p`
  font-size: 12px;
  color: #718096;
  margin-bottom: 12px;
`;

const ImageSource = styled.div`
  font-size: 10px;
  color: #a0aec0;
  font-style: italic;
`;

const ControlPanel = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const ControlButton = styled.button`
  padding: 8px 16px;
  border: 2px solid ${props => props.color || '#667eea'};
  background: ${props => props.active ? props.color || '#667eea' : 'transparent'};
  color: ${props => props.active ? 'white' : props.color || '#667eea'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.color || '#667eea'};
    color: white;
  }
`;

const StatsContainer = styled.div`
  background: #f7fafc;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
`;

const StatsTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
`;

/**
 * Statistical Images Gallery Component
 * Displays relevant statistical concepts with dynamic content
 */
export const StatisticalImagesGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const imageCategories = {
    all: { name: 'All Images', color: '#667eea' },
    distributions: { name: 'Distributions', color: '#6366f1' },
    testing: { name: 'A/B Testing', color: '#ec4899' },
    bayesian: { name: 'Bayesian', color: '#10b981' },
    visualization: { name: 'Visualizations', color: '#f59e0b' }
  };

  const statisticalImages = [
    {
      id: 1,
      title: 'Beta Distribution Family',
      description: 'Visual representation of Beta distributions with different α and β parameters',
      category: 'distributions',
      color: '#6366f1',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Beta_distribution_pdf.svg/800px-Beta_distribution_pdf.svg.png',
      source: 'Wikipedia - Beta Distribution',
      relevance: 'Core to Bayesian A/B testing'
    },
    {
      id: 2,
      title: 'Bayesian vs Frequentist',
      description: 'Comparison of Bayesian and frequentist approaches to statistical inference',
      category: 'bayesian',
      color: '#10b981',
      imageUrl: 'https://miro.medium.com/max/1400/1*QJZ6W-Pck_W7RlIDwUIN9Q.jpeg',
      source: 'Medium - Bayesian Statistics',
      relevance: 'Fundamental concept explanation'
    },
    {
      id: 3,
      title: 'A/B Testing Process Flow',
      description: 'Step-by-step visualization of the A/B testing methodology',
      category: 'testing',
      color: '#ec4899',
      imageUrl: 'https://cdn.optimizely.com/img/134769290/ab-testing-process.png',
      source: 'Optimizely - A/B Testing Guide',
      relevance: 'Practical implementation guide'
    },
    {
      id: 4,
      title: 'Monte Carlo Simulation',
      description: 'Illustration of Monte Carlo methods for statistical sampling',
      category: 'bayesian',
      color: '#8b5cf6',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Monte_Carlo_Integration_Example.svg/800px-Monte_Carlo_Integration_Example.svg.png',
      source: 'Wikipedia - Monte Carlo Method',
      relevance: 'Used in our probability calculations'
    },
    {
      id: 5,
      title: 'Statistical Power Analysis',
      description: 'Visual guide to understanding statistical power and sample size',
      category: 'testing',
      color: '#f59e0b',
      imageUrl: 'https://www.statisticshowto.com/wp-content/uploads/2013/09/power-analysis.png',
      source: 'Statistics How To',
      relevance: 'Essential for test design'
    },
    {
      id: 6,
      title: 'Credible Intervals',
      description: 'Bayesian credible intervals vs frequentist confidence intervals',
      category: 'bayesian',
      color: '#06b6d4',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bayesian_vs_frequentist_confidence_intervals.svg/800px-Bayesian_vs_frequentist_confidence_intervals.svg.png',
      source: 'Wikipedia - Credible Interval',
      relevance: 'Key Bayesian concept'
    },
    {
      id: 7,
      title: 'Sequential Testing',
      description: 'Early stopping rules and sequential analysis in A/B testing',
      category: 'testing',
      color: '#ef4444',
      imageUrl: 'https://cdn.optimizely.com/img/134769290/sequential-testing.png',
      source: 'Optimizely - Sequential Testing',
      relevance: 'Advanced testing methodology'
    },
    {
      id: 8,
      title: 'Data Visualization Best Practices',
      description: 'Effective ways to present statistical results and insights',
      category: 'visualization',
      color: '#84cc16',
      imageUrl: 'https://www.tableau.com/sites/default/files/2021-06/data-visualization-best-practices.png',
      source: 'Tableau - Data Visualization',
      relevance: 'Improving result presentation'
    }
  ];

  const filteredImages = selectedCategory === 'all' 
    ? statisticalImages 
    : statisticalImages.filter(img => img.category === selectedCategory);

  useEffect(() => {
    let interval;
    if (isAutoPlay) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % filteredImages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlay, filteredImages.length]);

  const handleImageClick = (image) => {
    // In a real implementation, this would open a modal or navigate to the full image
    console.log('Opening image:', image.title);
  };

  const downloadImage = (image) => {
    // In a real implementation, this would trigger a download
    console.log('Downloading image:', image.title);
  };

  return (
    <ImageGalleryContainer>
      <Title>
        <FiImage />
        Statistical Concepts Gallery
      </Title>
      <Subtitle>
        Visual references and educational materials for Bayesian A/B testing concepts
      </Subtitle>

      <ControlPanel>
        {Object.entries(imageCategories).map(([key, category]) => (
          <ControlButton
            key={key}
            color={category.color}
            active={selectedCategory === key}
            onClick={() => setSelectedCategory(key)}
          >
            {category.name}
          </ControlButton>
        ))}
        
        <ControlButton
          color="#10b981"
          active={isAutoPlay}
          onClick={() => setIsAutoPlay(!isAutoPlay)}
        >
          {isAutoPlay ? <FiPause /> : <FiPlay />}
          {isAutoPlay ? 'Pause' : 'Auto Play'}
        </ControlButton>
      </ControlPanel>

      <ImageGrid>
        {filteredImages.map((image, index) => (
          <ImageCard
            key={image.id}
            color={image.color}
            onClick={() => handleImageClick(image)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ImageContainer>
              <ImagePlaceholder>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                <div>{image.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                  Click to view full image
                </div>
              </ImagePlaceholder>
            </ImageContainer>
            
            <ImageTitle>{image.title}</ImageTitle>
            <ImageDescription>{image.description}</ImageDescription>
            <ImageSource>Source: {image.source}</ImageSource>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <ControlButton
                color={image.color}
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(image);
                }}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <FiDownload />
                Download
              </ControlButton>
            </div>
          </ImageCard>
        ))}
      </ImageGrid>

      <StatsContainer>
        <StatsTitle>Gallery Statistics</StatsTitle>
        <StatsGrid>
          <StatItem>
            <StatValue>{statisticalImages.length}</StatValue>
            <StatLabel>Total Images</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{filteredImages.length}</StatValue>
            <StatLabel>Filtered Results</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{Object.keys(imageCategories).length - 1}</StatValue>
            <StatLabel>Categories</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>8</StatValue>
            <StatLabel>Sources</StatLabel>
          </StatItem>
        </StatsGrid>
      </StatsContainer>
    </ImageGalleryContainer>
  );
};
