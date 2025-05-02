import React, { useRef, useEffect, useState } from 'react';
import { Peg as PegType, PegColor, FeedbackPegValue as FeedbackPegType } from '../types/mastermind';
import styles from './styles/Peg.module.css';

interface PegProps {
  peg: PegType;
  onClick?: () => void;
  isActive?: boolean;
  isSelectable?: boolean;
  isDragMode?: boolean;
  onDrop?: (data: string) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  isPalettePeg?: boolean;
  pegSize?: 'small' | 'medium' | 'large';
  isFeedbackPeg?: boolean;
  feedbackType?: FeedbackPegType;
}

const Peg: React.FC<PegProps> = ({
  peg,
  onClick,
  isActive = false,
  isSelectable = false,
  isDragMode = false,
  onDrop,
  onDragStart,
  isPalettePeg = false,
  pegSize = 'medium',
  isFeedbackPeg = false,
  feedbackType
}) => {
  const [isOver, setIsOver] = useState(false);
  const pegRef = useRef<HTMLDivElement>(null);
  
  // Generate class names based on props
  const getClassNames = (): string => {
    const classNames = [styles.peg];
    
    // Size class
    classNames.push(styles[pegSize]);
    
    // Margin class
    classNames.push(isPalettePeg ? styles.palettePeg : styles.gamePeg);
    
    // Cursor/interaction classes
    if (isSelectable) {
      classNames.push(isDragMode ? styles.draggable : styles.selectable);
    }
    
    // Active state
    if (isActive) {
      classNames.push(styles.activePeg);
    } else if (isFeedbackPeg && feedbackType && (feedbackType === 'correct' || feedbackType === 'wrongPosition')) {
      classNames.push(styles.solidBorder);
    } else if (peg.color === 'empty' || (isFeedbackPeg && (feedbackType === 'incorrect' || feedbackType === 'empty'))) {
      classNames.push(styles.dashedBorder);
    } else {
      classNames.push(styles.defaultBorder);
    }
    
    // Drag over state
    if (isOver) {
      classNames.push(styles.isOver);
    }
    
    // Color classes for feedback pegs
    if (isFeedbackPeg && feedbackType) {
      if (feedbackType === 'correct') {
        classNames.push(styles.correctPeg);
      } else if (feedbackType === 'wrongPosition') {
        classNames.push(styles.wrongPositionPeg);
      } else if (feedbackType === 'empty' || feedbackType === 'incorrect') {
        classNames.push(styles.transparentPeg);
      }
    } 
    // Color for regular pegs
    else if (peg.color === 'empty') {
      classNames.push(styles.emptyPeg);
    }
    
    return classNames.join(' ');
  };
  
  // Set background color for regular pegs (colors that aren't in our CSS)
  const getStyle = (): React.CSSProperties => {
    // For regular colored pegs that aren't empty or feedback pegs
    if (!isFeedbackPeg && peg.color !== 'empty') {
      return { backgroundColor: peg.color };
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
        const data = e.dataTransfer.getData('text/plain');
        onDrop(data);
      }
    };
    
    // Set draggable attribute and add/remove event listeners
    if (isDragMode) {
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
  }, [isDragMode, isSelectable, onDrop]);
  
  return (
    <div
      ref={pegRef}
      className={getClassNames()}
      style={getStyle()}
      onClick={isSelectable && !isDragMode ? onClick : undefined}
      onDragStart={isDragMode ? onDragStart : undefined}
      data-testid={`peg-${isFeedbackPeg ? 'feedback-' + feedbackType : peg.color}`}
    />
  );
};

export default Peg; 