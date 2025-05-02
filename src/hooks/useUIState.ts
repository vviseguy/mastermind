import { useState, useCallback } from 'react';
import { PegColor, FeedbackPegValue } from '../types/mastermind';

/**
 * Hook for managing UI-related state
 */
export function useUIState() {
  // Selected color for pegs
  const [selectedColor, setSelectedColor] = useState<PegColor | null>(null);
  
  // Selected feedback for explorer mode
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackPegValue | null>(null);
  
  // Currently active peg index in current guess
  const [activePegIndex, setActivePegIndex] = useState<number | null>(null);
  
  // Currently active feedback peg in explorer mode
  const [activeFeedbackIndex, setActiveFeedbackIndex] = useState<number | null>(null);
  
  // State to track interaction mode (drag or click)
  const [isDragMode, setIsDragMode] = useState<boolean>(false);
  
  // State to track if explorer mode is active
  const [isExplorerActive, setIsExplorerActive] = useState<boolean>(false);
  
  /**
   * Toggle drag mode
   */
  const toggleDragMode = useCallback(() => {
    setIsDragMode(prevMode => {
      const newMode = !prevMode;
      // In drag mode, clear the selected color and feedback
      if (newMode) {
        setSelectedColor(null);
        setSelectedFeedback(null);
      }
      return newMode;
    });
  }, []);
  
  /**
   * Toggle explorer mode
   */
  const toggleExplorerMode = useCallback(() => {
    setIsExplorerActive(prevMode => !prevMode);
  }, []);
  
  /**
   * Reset UI state
   */
  const resetUIState = useCallback(() => {
    setSelectedColor(null);
    setSelectedFeedback(null);
    setActivePegIndex(null);
    setActiveFeedbackIndex(null);
    setIsDragMode(false);
    setIsExplorerActive(false);
  }, []);
  
  return {
    // State
    selectedColor,
    selectedFeedback,
    activePegIndex,
    activeFeedbackIndex,
    isDragMode,
    isExplorerActive,
    
    // Setters
    setSelectedColor,
    setSelectedFeedback,
    setActivePegIndex,
    setActiveFeedbackIndex,
    
    // Actions
    toggleDragMode,
    toggleExplorerMode,
    resetUIState
  };
} 