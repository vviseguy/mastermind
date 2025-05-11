import { useState, useCallback } from 'react';
import { Peg, FeedbackPeg } from '../types/mastermind';

/**
 * Hook for managing UI-related state
 */
export function useUIState() {
  // Selected color for pegs
  const [selectedColor, setSelectedColor] = useState<Peg | null>(null);
  
  // Selected feedback for explorer mode
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackPeg | null>(null);
  
  // State to track interaction mode (drag or click)
  const [isDragMode, setIsDragMode] = useState<boolean>(false);
  
  // State to track if explorer mode is active
  const [isExplorerActive, setIsExplorerActive] = useState<boolean>(false);
  
  /**
   * Toggle drag mode
   */
  const toggleDragMode = useCallback(() => {
    setIsDragMode(prev => !prev);
  }, []);
  
  /**
   * Toggle explorer mode
   */
  const toggleExplorerMode = useCallback(() => {
    setIsExplorerActive(prev => !prev);
  }, []);
  
  /**
   * Reset UI state
   */
  const resetUIState = useCallback(() => {
    setSelectedColor(null);
    setSelectedFeedback(null);
    setIsDragMode(false);
    setIsExplorerActive(false);
  }, []);
  
  /**
   * Set the selected color with type checking
   */
  const setTypedSelectedColor = useCallback((color: Peg | null) => {
    setSelectedColor(color);
  }, []);
  
  /**
   * Set the selected feedback with type checking
   */
  const setTypedSelectedFeedback = useCallback((feedback: FeedbackPeg | null) => {
    setSelectedFeedback(feedback);
  }, []);
  
  return {
    // State
    selectedColor,
    selectedFeedback,
    isDragMode,
    isExplorerActive,
    
    // Setters
    setSelectedColor: setTypedSelectedColor,
    setSelectedFeedback: setTypedSelectedFeedback,
    
    // Actions
    toggleDragMode,
    toggleExplorerMode,
    resetUIState
  };
} 