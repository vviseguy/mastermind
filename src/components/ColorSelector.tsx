import React from 'react';
import { PegColor, FeedbackPegValue } from '../types/mastermind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandPointer, faArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import Peg from './Peg';
import styles from './styles/ColorSelector.module.css';

interface ColorSelectorProps {
  availableColors: PegColor[];
  selectedColor: PegColor | null;
  onSelectColor: (color: PegColor | null) => void;
  isDragMode?: boolean;
  onToggleDragMode?: () => void;
  isExplorerMode?: boolean;
  selectedFeedback?: FeedbackPegValue | null;
  onSelectFeedback?: (feedback: FeedbackPegValue | null) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  availableColors,
  selectedColor,
  onSelectColor,
  isDragMode = false,
  onToggleDragMode,
  isExplorerMode = false,
  selectedFeedback = null,
  onSelectFeedback
}) => {
  // Filter out the 'empty' color, but add back at the end
  const colorPegs = availableColors.filter(color => color !== 'empty');

  // Handle click on a color
  const handleColorSelect = (color: PegColor) => {
    if (!isDragMode) {
      onSelectColor(selectedColor === color ? null : color);
      if (onSelectFeedback) {
        onSelectFeedback(null);
      }
    }
  };
  
  // Handle click on empty peg
  const handleEmptySelect = () => {
    if (isExplorerMode && onSelectFeedback) {
      // If we're in explorer mode, check if a feedback peg was previously selected
      if (selectedFeedback !== null) {
        onSelectFeedback(selectedFeedback === 'empty' ? null : 'empty');
        onSelectColor(null);
        return;
      }
    }
    
    // Default behavior - select empty color
    onSelectColor(selectedColor === 'empty' ? null : 'empty');
    if (onSelectFeedback) {
      onSelectFeedback(null);
    }
  };
  
  // Handle click on a feedback peg
  const handleFeedbackSelect = (type: FeedbackPegValue) => {
    if (onSelectFeedback) {
      onSelectFeedback(selectedFeedback === type ? null : type);
      onSelectColor(null);
    }
  };
  
  // Handle drag start for color pegs
  const handleColorDragStart = (e: React.DragEvent<HTMLDivElement>, color: PegColor) => {
    if (isDragMode) {
      e.dataTransfer.setData('text/plain', color);
      e.dataTransfer.effectAllowed = 'move';
    }
  };
  
  // Handle drag start for feedback pegs
  const handleFeedbackDragStart = (e: React.DragEvent<HTMLDivElement>, type: FeedbackPegValue) => {
    if (isDragMode) {
      e.dataTransfer.setData('text/plain', `feedback:${type}`);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  return (
    <div className={styles.container}>
      {/* Drag/Click Mode Toggle Switch */}
      {onToggleDragMode && (
        <div className={styles.toggleContainer}>
          <div className={styles.switch} onClick={onToggleDragMode}>
            <div className={`${styles.slider} ${isDragMode ? styles.sliderActive : ''}`}>
              <div className={`${styles.sliderButton} ${isDragMode ? styles.sliderButtonRight : styles.sliderButtonLeft}`}></div>
              <FontAwesomeIcon 
                icon={faArrowsAlt} 
                className={`${styles.icon} ${styles.iconLeft}`}
              />
              <FontAwesomeIcon 
                icon={faHandPointer} 
                className={`${styles.icon} ${styles.iconRight}`}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Color Pegs */}
      <div className={styles.pegContainer}>
        {colorPegs.map(color => (
          <Peg
            key={color}
            peg={{ color, id: 0 }}
            onClick={() => handleColorSelect(color)}
            isActive={selectedColor === color}
            isSelectable={true}
            isDragMode={isDragMode}
            onDragStart={(e) => handleColorDragStart(e, color)}
            isPalettePeg={true}
            pegSize="large"
          />
        ))}
        
        {/* Empty Peg */}
        <Peg
          peg={{ color: 'empty', id: 0 }}
          onClick={handleEmptySelect}
          isActive={selectedColor === 'empty' || selectedFeedback === 'empty'}
          isSelectable={true}
          isDragMode={isDragMode}
          onDragStart={(e) => handleColorDragStart(e, 'empty')}
          isPalettePeg={true}
          pegSize="large"
        />
      </div>
      
      {/* Feedback Pegs for Explorer Mode */}
      {isExplorerMode && (
        <>
          <div className={styles.divider} />
          
          <div className={styles.feedbackContainer}>
            <Peg
              peg={{ color: 'empty', id: 0 }}
              onClick={() => handleFeedbackSelect('correct')}
              isActive={selectedFeedback === 'correct'}
              isSelectable={true}
              isDragMode={isDragMode}
              onDragStart={(e) => handleFeedbackDragStart(e, 'correct')}
              isPalettePeg={true}
              pegSize="small"
              isFeedbackPeg={true}
              feedbackType="correct"
            />
            
            <Peg
              peg={{ color: 'empty', id: 0 }}
              onClick={() => handleFeedbackSelect('wrongPosition')}
              isActive={selectedFeedback === 'wrongPosition'}
              isSelectable={true}
              isDragMode={isDragMode}
              onDragStart={(e) => handleFeedbackDragStart(e, 'wrongPosition')}
              isPalettePeg={true}
              pegSize="small"
              isFeedbackPeg={true}
              feedbackType="wrongPosition"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ColorSelector; 