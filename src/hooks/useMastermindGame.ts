import { useCallback } from 'react';
import { GameMode, PegColor, FeedbackPegValue, SolutionGroup } from '../types/mastermind';
import { useGameState } from './useGameState';
import { useSolutionExplorer } from './useSolutionExplorer';
import { useUIState } from './useUIState';
import { evaluateGuess } from '../utils/gameLogic';

/**
 * Main hook for the Mastermind game
 */
const useMastermindGame = (
  initialMode: GameMode = 'normal',
  codeLength: number = 4,
  maxGuesses: number = 10,
  availableColors: PegColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'empty']
) => {
  // Game state
  const {
    gameBoard,
    setGameBoard,
    startNewGame,
    changeMode,
    setCurrentGuessPeg,
    modifyPastGuess,
    deleteGuess,
    submitGuess,
    pushGuess,
    pushResponse
  } = useGameState(initialMode, codeLength, maxGuesses, availableColors);

  // UI state
  const {
    selectedColor,
    selectedFeedback,
    activePegIndex,
    activeFeedbackIndex,
    isDragMode,
    isExplorerActive,
    setSelectedColor,
    setSelectedFeedback,
    setActivePegIndex,
    setActiveFeedbackIndex,
    toggleDragMode,
    toggleExplorerMode,
    resetUIState
  } = useUIState();

  // Solution explorer
  const {
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
  } = useSolutionExplorer(gameBoard, setGameBoard);

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
    setActivePegIndex(pegIndex);
    
    // Check if rowIndex is beyond current guesses (this shouldn't happen with simplified state)
    if (rowIndex >= gameBoard.guesses.length) {
      return;
    }
    
    if (rowIndex === gameBoard.guesses.length - 1 && !gameBoard.hasCurrentGuessFeedback) {
      // It's the current guess (last row without feedback)
      if (selectedColor) {
        setCurrentGuessPeg(Number(pegIndex), selectedColor);
      }
    } else if (isExplorerActive) {
      // It's a past guess in explorer mode
      if (selectedColor) {
        modifyPastGuess(rowIndex, Number(pegIndex), selectedColor);
        setModifiedGuessIndex(rowIndex);
      }
    }
  }, [gameBoard.guesses.length, gameBoard.hasCurrentGuessFeedback, selectedColor, isExplorerActive, 
      setActivePegIndex, setCurrentGuessPeg, modifyPastGuess, setModifiedGuessIndex]);

  // Handle peg drag and drop
  const handlePegDrop = useCallback((guessIndex: number, pegIndex: number, color: PegColor) => {
    // Check if guessIndex is beyond current guesses
    if (guessIndex >= gameBoard.guesses.length) {
      return;
    }
    
    if (guessIndex === gameBoard.guesses.length - 1 && !gameBoard.hasCurrentGuessFeedback) {
      // It's the current guess (last row without feedback)
      setCurrentGuessPeg(Number(pegIndex), color);
    } else if (isExplorerActive) {
      // It's a past guess in explorer mode
      modifyPastGuess(guessIndex, Number(pegIndex), color);
      setModifiedGuessIndex(guessIndex);
    }
  }, [gameBoard.guesses.length, gameBoard.hasCurrentGuessFeedback, isExplorerActive, 
      setCurrentGuessPeg, modifyPastGuess, setModifiedGuessIndex]);

  /**
   * Handle applying a solution feedback pattern
   */
  const handleSolutionFeedback = useCallback((feedback: FeedbackPegValue[]) => {
    if (isCurrentGuessComplete() && !gameBoard.gameOver) {
      // For current guess, use the normal submit mechanism
      submitGuess(feedback);
    } else if (modifiedGuessIndex !== null && modifiedGuessIndex < gameBoard.guesses.length) {
      // For past guesses in explorer mode
      pushResponse(feedback, modifiedGuessIndex);
      recalculateAfterGuessChange(modifiedGuessIndex);
      setModifiedGuessIndex(null);
    } else if (gameBoard.guesses.length > 0) {
      // Always override the most recent guess response if one exists
      pushResponse(feedback);
      recalculateAfterGuessChange(gameBoard.guesses.length - 1);
    }
  }, [gameBoard.guesses.length, gameBoard.gameOver, isCurrentGuessComplete, modifiedGuessIndex, 
      pushResponse, recalculateAfterGuessChange, setModifiedGuessIndex, submitGuess]);

  /**
   * Handle applying a guess from the solution explorer
   */
  const handleSolutionGuess = useCallback((guess: PegColor[]) => {
    if (gameBoard.gameOver) return;
    
    // Use our pushGuess function to handle guesses
    const newPegs = guess.map((color, _) => color);
    pushGuess(newPegs);
  }, [gameBoard.gameOver, pushGuess]);

  /**
   * Submit a guess with optional custom feedback
   */
  const handleSubmitGuess = useCallback(() => {
    if (isCurrentGuessComplete() && !gameBoard.gameOver) {
      // First, get the current guess colors
      const colors = gameBoard.currentGuess.toColorArray();
      
      // Then, determine the feedback based on game mode
      let feedback: FeedbackPegValue[] = [];
      
      if (gameBoard.gameMode === 'normal') {
        // For normal mode, evaluate against the secret code
        const secretColors = gameBoard.secretCode.map(peg => peg.color);
        feedback = evaluateGuess ? evaluateGuess(colors, secretColors) : [];
      }
      
      // If we have calculated feedback, use the push methods; otherwise use submit
      if (feedback.length > 0) {
        // First apply the response
        pushResponse(feedback);
        
        // Ensure solution groups are updated after submitting
        if (isExplorerActive) {
          updateSolutionGroups();
        }
      } else {
        // For evil/explorer mode, use the standard submitGuess
        submitGuess();
        
        // Ensure solution groups are updated after submitting
        if (isExplorerActive) {
          updateSolutionGroups();
        }
      }
      
      setActivePegIndex(null);
    }
  }, [gameBoard, isCurrentGuessComplete, isExplorerActive, setActivePegIndex, 
      submitGuess, pushResponse, updateSolutionGroups, evaluateGuess]);

  // Convert to the legacy format for compatibility with existing components
  const gameState = {
    secretCode: gameBoard.secretCode,
    guesses: gameBoard.guesses.map(g => g.toLegacyGuessRow()),
    currentGuess: gameBoard.currentGuess.pegs,
    gameMode: gameBoard.gameMode,
    codeLength: gameBoard.codeLength,
    maxGuesses: gameBoard.maxGuesses,
    availableColors: gameBoard.availableColors,
    gameOver: gameBoard.gameOver,
    won: gameBoard.won,
    possibleSolutions: gameBoard.possibleSolutions,
    possibleSolutionsCount: gameBoard.possibleSolutions.length
  };

  return {
    // State
    gameState,
    gameBoard,
    selectedColor,
    selectedFeedback,
    activePegIndex,
    activeFeedbackIndex,
    solutionGroups,
    currentGuessSolutionGroups,
    modifiedGuessIndex,
    isDragMode,
    isExplorerActive,
    
    // UI actions
    setSelectedColor,
    setSelectedFeedback,
    toggleDragMode,
    toggleExplorerMode,
    
    // Game actions
    setCurrentGuessPeg: handlePegClick,
    handlePegDrop,
    setFeedbackPeg,
    submitGuess: handleSubmitGuess,
    startNewGame: handleStartNewGame,
    changeMode,
    isCurrentGuessComplete,
    modifyPastGuess,
    recalculateAfterGuessChange,
    updateSolutionGroups,
    deleteGuess,
    predictFeedback,
    
    // Solution explorer actions - renamed for clarity
    handleApplySolutionFeedback: handleSolutionFeedback,
    handleApplyGuess: handleSolutionGuess,
    
    // New functions
    pushGuess,
    pushResponse,
    
    // For compatibility - redirects to proper functions
    setGameState: setGameBoard
  };
};

export default useMastermindGame; 