import { useState, useCallback, useEffect } from 'react';
import { PegColor, SolutionGroup, FeedbackPegValue } from '../types/mastermind';
import { GameBoard } from '../models/GameBoard';
import { SolutionService } from '../services/SolutionService';
import { GameModeService } from '../services/GameModeService';

/**
 * Hook for managing the solution explorer functionality
 */
export function useSolutionExplorer(gameBoard: GameBoard, setGameBoard: (board: GameBoard) => void) {
  // Solution groups for the last submitted guess
  const [solutionGroups, setSolutionGroups] = useState<SolutionGroup[]>([]);
  
  // Solution groups for the current unsubmitted guess
  const [currentGuessSolutionGroups, setCurrentGuessSolutionGroups] = useState<SolutionGroup[]>([]);
  
  // Currently modified guess index (for explorer mode)
  const [modifiedGuessIndex, setModifiedGuessIndex] = useState<number | null>(null);
  
  /**
   * Update solution groups when the guesses change
   */
  useEffect(() => {
    if (gameBoard.guesses.length > 0) {
      const groups = SolutionService.updateSolutionGroups(gameBoard);
      setSolutionGroups(groups);
    } else {
      setSolutionGroups([]);
    }
  }, [gameBoard.guesses, gameBoard.gameMode]);
  
  /**
   * Update current guess solution groups when the current guess changes
   */
  useEffect(() => {
    if (gameBoard.currentGuess.isComplete() && !gameBoard.hasCurrentGuessFeedback && !gameBoard.gameOver) {
      const groups = SolutionService.predictFeedback(
        gameBoard, 
        gameBoard.currentGuess.toColorArray()
      );
      setCurrentGuessSolutionGroups(groups);
    } else {
      setCurrentGuessSolutionGroups([]);
    }
  }, [gameBoard.currentGuess, gameBoard.hasCurrentGuessFeedback, gameBoard.gameOver]);
  
  /**
   * Update solution groups manually (e.g., after mode change)
   */
  const updateSolutionGroups = useCallback(() => {
    if (gameBoard.guesses.length > 0) {
      const groups = SolutionService.updateSolutionGroups(gameBoard);
      setSolutionGroups(groups);
    }
  }, [gameBoard]);
  
  /**
   * Predict feedback for a given guess
   */
  const predictFeedback = useCallback((guessColors: PegColor[]): SolutionGroup[] => {
    return SolutionService.predictFeedback(gameBoard, guessColors);
  }, [gameBoard]);
  
  /**
   * Set feedback peg in explorer mode
   */
  const setFeedbackPeg = useCallback((guessIndex: number, pegIndex: number, feedbackType: FeedbackPegValue) => {
    if (guessIndex >= gameBoard.guesses.length) return;
    
    const updatedGuesses = [...gameBoard.guesses];
    let newFeedback = [...updatedGuesses[guessIndex].feedback];
    
    // In explorer mode, feedback is represented by counts, not positions
    // So we need to add/remove feedback pegs and re-sort them
    if (pegIndex < newFeedback.length) {
      // Remove the old value first
      newFeedback.splice(pegIndex, 1);
    }
    
    // Add the new feedback value
    newFeedback.push(feedbackType);
    
    // Sort and ensure we don't exceed the code length
    const sortedFeedback = newFeedback.sort((a, b) => {
      const order = { 'correct': 0, 'wrongPosition': 1, 'incorrect': 2, 'empty': 3 };
      return order[a] - order[b];
    }).slice(0, gameBoard.codeLength);
    
    // Update the guess with new feedback
    updatedGuesses[guessIndex] = updatedGuesses[guessIndex].setFeedback(sortedFeedback);
    
    // Create updated board
    const updatedBoard = new GameBoard(
      gameBoard.secretCode,
      updatedGuesses,
      gameBoard.gameMode,
      gameBoard.gameOver,
      gameBoard.won,
      gameBoard.possibleSolutions,
      gameBoard.codeLength,
      gameBoard.maxGuesses,
      gameBoard.availableColors
    );
    
    // Recalculate possible solutions and update board
    const { updatedBoard: finalBoard, solutionGroups: groups } = 
      SolutionService.recalculateAfterGuessChange(updatedBoard, guessIndex);
    
    setGameBoard(finalBoard);
    setSolutionGroups(groups);
  }, [gameBoard, setGameBoard]);
  
  /**
   * Recalculate after a guess has been modified
   */
  const recalculateAfterGuessChange = useCallback((guessIndex: number) => {
    if (guessIndex < 0 || guessIndex >= gameBoard.guesses.length) return;
    
    const { updatedBoard, solutionGroups: groups } = 
      SolutionService.recalculateAfterGuessChange(gameBoard, guessIndex);
    
    setGameBoard(updatedBoard);
    setSolutionGroups(groups);
    setModifiedGuessIndex(null);
  }, [gameBoard, setGameBoard]);
  
  /**
   * Apply solution feedback to current or modified guess
   */
  const handleApplySolutionFeedback = useCallback((feedback: FeedbackPegValue[]) => {
    // For current guess without feedback
    if (gameBoard.currentGuess.isComplete() && !gameBoard.hasCurrentGuessFeedback && !gameBoard.gameOver) {
      // Submit guess with given feedback
      const updatedBoard = GameModeService.processGuess(gameBoard, feedback);
      setGameBoard(updatedBoard);
    } 
    // For modified guess in explorer mode
    else if (modifiedGuessIndex !== null && modifiedGuessIndex < gameBoard.guesses.length) {
      const updatedGuesses = [...gameBoard.guesses];
      updatedGuesses[modifiedGuessIndex] = updatedGuesses[modifiedGuessIndex].setFeedback(feedback);
      
      const updatedBoard = new GameBoard(
        gameBoard.secretCode,
        updatedGuesses,
        gameBoard.gameMode,
        gameBoard.gameOver,
        gameBoard.won,
        gameBoard.possibleSolutions,
        gameBoard.codeLength,
        gameBoard.maxGuesses,
        gameBoard.availableColors
      );
      
      recalculateAfterGuessChange(modifiedGuessIndex);
    }
    // Always override the most recent guess response if one exists
    else if (gameBoard.guesses.length > 0) {
      const lastGuessIndex = gameBoard.guesses.length - 1;
      const updatedGuesses = [...gameBoard.guesses];
      updatedGuesses[lastGuessIndex] = updatedGuesses[lastGuessIndex].setFeedback(feedback);
      
      const updatedBoard = new GameBoard(
        gameBoard.secretCode,
        updatedGuesses,
        gameBoard.gameMode,
        gameBoard.gameOver,
        gameBoard.won,
        gameBoard.possibleSolutions,
        gameBoard.codeLength,
        gameBoard.maxGuesses,
        gameBoard.availableColors
      );
      
      recalculateAfterGuessChange(lastGuessIndex);
    }
  }, [gameBoard, modifiedGuessIndex, setGameBoard, recalculateAfterGuessChange]);
  
  /**
   * Apply a guess from solution explorer
   */
  const handleApplyGuess = useCallback((guess: PegColor[]) => {
    if (gameBoard.gameOver) return;
    
    // Create pegs from colors
    const newPegs = guess.map((color, id) => ({ color, id }));
    
    // If the current guess has feedback, we need to add a new guess
    // Otherwise we can update the existing one
    const updatedGuesses = [...gameBoard.guesses];
    
    if (gameBoard.hasCurrentGuessFeedback) {
      // Add a new guess
      updatedGuesses.push({ 
        pegs: newPegs, 
        feedback: [], 
        id: gameBoard.guesses.length
      });
    } else {
      // Update the last guess
      const lastIndex = updatedGuesses.length - 1;
      updatedGuesses[lastIndex] = updatedGuesses[lastIndex].setPegs(newPegs);
    }
    
    // Update the board
    const updatedBoard = new GameBoard(
      gameBoard.secretCode,
      updatedGuesses,
      gameBoard.gameMode,
      gameBoard.gameOver,
      gameBoard.won,
      gameBoard.possibleSolutions,
      gameBoard.codeLength,
      gameBoard.maxGuesses,
      gameBoard.availableColors
    );
    
    setGameBoard(updatedBoard);
  }, [gameBoard, setGameBoard]);
  
  return {
    solutionGroups,
    currentGuessSolutionGroups,
    modifiedGuessIndex,
    setModifiedGuessIndex,
    updateSolutionGroups,
    predictFeedback,
    setFeedbackPeg,
    recalculateAfterGuessChange,
    handleApplySolutionFeedback,
    handleApplyGuess
  };
} 