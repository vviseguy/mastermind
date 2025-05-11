import { useCallback } from 'react';
import { GameMode, Peg, FeedbackPeg, GameState } from '../types/mastermind';
import { useGameState } from './useGameState';
import { useUIState } from './useUIState';

/**
 * Main hook for the Mastermind game
 */
const useMastermindGame = (
  initialMode: GameMode = 'normal',
  codeLength: number = 4,
  maxGuesses: number = 10,
  availableColors: Peg[] = ['red', 'blue', 'green','yellow', 'purple', 'orange', 'empty']
) => {
  // Game state
  const {
    gameBoard,
    setGameBoard,
    gameMode: _gameMode, // Mark as deliberately unused
    gameOver,
    won: _won, // Mark as deliberately unused
    solutionCount,
    allSolutions,
    getGameState,
    startNewGame,
    changeMode,
    setGuessPeg,
    deleteGuess,
    submitGuess,
    pushGuess,
    pushResponse,
    getPossibleSolutions,
    getPossibleFeedbackPatterns,
    processGuessSeries
  } = useGameState(initialMode, codeLength, maxGuesses, availableColors);

  // UI state
  const {
    selectedColor,
    selectedFeedback,
    isDragMode,
    isExplorerActive,
    setSelectedColor,
    setSelectedFeedback,
    toggleDragMode,
    toggleExplorerMode,
    resetUIState
  } = useUIState();

  // Reset UI state when starting a new game
  const handleStartNewGame = useCallback(() => {
    startNewGame();
    resetUIState();
  }, [startNewGame, resetUIState]);

  // Check if the current guess is complete
  const isCurrentGuessComplete = useCallback(() => {
    return gameBoard.currentGuess.isComplete();
  }, [gameBoard.currentGuess]);

  // Handle a peg click in the game board
  const handlePegClick = useCallback((rowIndex: number, pegIndex: number) => {
    if (rowIndex >= gameBoard.guesses.length) return;
    
    if (selectedColor) {
      setGuessPeg(pegIndex, selectedColor, rowIndex);
    }
  }, [gameBoard.guesses.length, selectedColor, setGuessPeg]);

  // Handle peg drag and drop
  const handlePegDrop = useCallback((guessIndex: number, pegIndex: number, color: Peg) => {
    if (guessIndex >= gameBoard.guesses.length) return;
    setGuessPeg(pegIndex, color, guessIndex);
  }, [gameBoard.guesses.length, setGuessPeg]);

  /**
   * Handle applying a solution feedback pattern
   */
  const handleSolutionFeedback = useCallback((feedback: FeedbackPeg[]) => {
    if (isCurrentGuessComplete() && !gameOver) {
      // For current guess, use the normal submit mechanism
      pushResponse(feedback);
    } else if (gameBoard.guesses.length > 0) {
      // Always override the most recent guess response if one exists
      pushResponse(feedback, gameBoard.guesses.length - 1);
    }
  }, [gameBoard.guesses.length, gameOver, isCurrentGuessComplete, pushResponse]);

  /**
   * Handle applying a guess from the solution explorer
   */
  const handleSolutionGuess = useCallback((guess: Peg[]) => {
    if (gameOver) return;
    pushGuess(guess);
  }, [gameOver, pushGuess]);

  /**
   * Submit a guess with optional custom feedback
   */
  const handleSubmitGuess = useCallback(() => {
    if (isCurrentGuessComplete() && !gameOver) {
      submitGuess();
    }
  }, [gameOver, isCurrentGuessComplete, submitGuess]);

  // Get the current game state that conforms to the GameState interface
  const gameState: GameState = getGameState();

  return {
    // State
    gameState,
    gameBoard,
    selectedColor,
    selectedFeedback,
    isDragMode,
    isExplorerActive,
    possibleSolutions: allSolutions,
    possibleSolutionsCount: solutionCount,
    
    // UI actions
    setSelectedColor,
    setSelectedFeedback,
    toggleDragMode,
    toggleExplorerMode,
    
    // Game actions
    handlePegClick,
    handlePegDrop,
    submitGuess: handleSubmitGuess,
    startNewGame: handleStartNewGame,
    changeMode,
    isCurrentGuessComplete,
    deleteGuess,
    
    // Solution explorer actions
    handleApplySolutionFeedback: handleSolutionFeedback,
    handleApplyGuess: handleSolutionGuess,
    getPossibleSolutions,
    getPossibleFeedbackPatterns,
    processGuessSeries,
    
    // For compatibility
    setGameState: setGameBoard
  };
};

export default useMastermindGame; 