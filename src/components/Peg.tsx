import React, { useRef, useEffect, useState } from 'react';
import { Peg as PegType, FeedbackPeg as FeedbackPegType } from '../types/mastermind';
import styles from './styles/Peg.module.css';

interface PegComponentProps {
  color: PegType;
  id?: number;
  onClick?: () => void;
  isActive?: boolean;
  isSelectable?: boolean;
  isDragMode?: boolean;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  isPalettePeg?: boolean;
  pegSize?: 'small' | 'medium' | 'large';
  isFeedbackPeg?: boolean;
  feedbackType?: FeedbackPegType;
  isDraggable?: boolean;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
}

const PegComponent: React.FC<PegComponentProps> = ({
  color,
  id: _id,
  onClick,
  isActive = false,
  isSelectable = false,
  isDragMode = false,
  onDrop,
  onDragStart,
  isPalettePeg = false,
  pegSize = 'medium',
  isFeedbackPeg = false,
  feedbackType,
  isDraggable = false,
  onDragEnd,
  onDragOver
}) => {
  const [isOver, setIsOver] = useState(false);
  const pegRef = useRef<HTMLDivElement>(null);
  
  // Generate class names based on props
  const getClassNames = (): string => {
    const classNames = [styles.peg];
    
    // Size class
    classNames.push(styles[pegSize]);
    
    // Margin class
    if (isPalettePeg) {
      classNames.push(styles.palettePeg);
    } else if (isFeedbackPeg) {
      classNames.push(styles.feedbackPeg);
    } else {
      classNames.push(styles.gamePeg);
    }
    
    // Cursor/interaction classes
    if (isSelectable) {
      classNames.push(isDragMode ? styles.draggable : styles.selectable);
    }
    
    // Active state
    if (isActive) {
      classNames.push(styles.activePeg);
    } else if (isFeedbackPeg && feedbackType && (feedbackType === 'correct' || feedbackType === 'wrongPosition')) {
      classNames.push(styles.solidBorder);
    } else if (color === 'empty' || (isFeedbackPeg && (feedbackType === 'incorrect' || feedbackType === 'empty'))) {
      classNames.push(styles.dashedBorder);
    } else {
      classNames.push(styles.defaultBorder);
    }
    
    // Drag over state
    if (isOver) {
      classNames.push(styles.isOver);
    }
    
    return classNames.join(' ');
  };
  
  // Get appropriate inner peg class
  const getInnerPegClass = (): string => {
    // For feedback pegs
    if (isFeedbackPeg && feedbackType) {
      if (feedbackType === 'correct') {
        return styles.correctPeg;
      } else if (feedbackType === 'wrongPosition') {
        return styles.wrongPositionPeg;
      } else if (feedbackType === 'empty' || feedbackType === 'incorrect') {
        return styles.transparentPeg;
      }
    }
    // For regular pegs
    else if (color === 'empty') {
      return styles.emptyPeg;
    }
    
    return '';
  };
  
  // Set background color for regular pegs (colors that aren't in our CSS)
  const getStyle = (): React.CSSProperties => {
    // For regular colored pegs that aren't empty or feedback pegs
    if (!isFeedbackPeg && color !== 'empty') {
      return { backgroundColor: color };
    }
    
    return {};
  };
  
  // Set up drag and drop handlers
  useEffect(() => {
    const element = pegRef.current;
    if (!element) return;
    
    // Handle drag over
    const handleDragOver = (e: DragEvent) => {
      if (!isSelectable || !onDrop) return;
      
      e.preventDefault();
      setIsOver(true);
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    };
    
    // Handle drag leave
    const handleDragLeave = () => {
      setIsOver(false);
    };
    
    // Handle drop
    const handleDrop = (e: DragEvent) => {
      if (!isSelectable || !onDrop) return;
      
      e.preventDefault();
      setIsOver(false);
      
      if (e.dataTransfer) {
        onDrop(e as unknown as React.DragEvent<HTMLDivElement>);
      }
    };
    
    // Set draggable attribute and add/remove event listeners
    if (isDragMode || isDraggable) {
      element.setAttribute('draggable', 'true');
    } else {
      element.removeAttribute('draggable');
    }
    
    // Add event listeners for drop target behavior
    if (onDrop) {
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('dragleave', handleDragLeave);
      element.addEventListener('drop', handleDrop);
    }
    
    // Clean up
    return () => {
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('drop', handleDrop);
    };
  }, [isDragMode, isDraggable, isSelectable, onDrop]);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if ((isDragMode || isDraggable) && onDragStart) {
      e.dataTransfer.setData('text/plain', color);
      onDragStart(e);
    } else if ((isDragMode || isDraggable)) {
      e.dataTransfer.setData('text/plain', color);
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (isDraggable && onDragEnd) {
      onDragEnd(e);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDrop) {
      e.preventDefault();
      onDrop(e);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragOver) {
      e.preventDefault();
      onDragOver(e);
    }
  };

  const handleClick = () => {
    if (onClick && (isSelectable || isPalettePeg)) {
      onClick();
    }
  };

  return (
    <div
      ref={pegRef}
      className={getClassNames()}
      style={getStyle()}
      onClick={handleClick}
      draggable={isDragMode || isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      data-testid={`peg-${isFeedbackPeg ? 'feedback-' + feedbackType : color}`}
    >
      <div className={`${styles.pegInner} ${getInnerPegClass()}`}>
        {isFeedbackPeg && feedbackType && (
          <div className={`${styles.feedbackDot} ${styles[feedbackType]}`} />
        )}
      </div>
    </div>
  );
};

// Export with the original component name for backward compatibility
export default PegComponent; 