import { useState, useCallback } from 'react';
import { GameMode, PegColor, FeedbackPegValue } from '../types/mastermind';
import { GameBoard } from '../models/GameBoard';
import { GameModeService } from '../services/GameModeService';
import { Guess } from '../models/Guess';

/**
 * Hook for managing the core game state
 */
export function useGameState(
  initialMode: GameMode = 'normal',
  codeLength: number = 4,
  maxGuesses: number = 10,
  availableColors: PegColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'empty']
) {
  // Initialize game board state
  const [gameBoard, setGameBoard] = useState<GameBoard>(
    GameBoard.createNewGame(initialMode, codeLength, maxGuesses, availableColors)
  );
  
  /**
   * Start a new game with the current settings
   */
  const startNewGame = useCallback(() => {
    setGameBoard(GameBoard.createNewGame(
      gameBoard.gameMode,
      gameBoard.codeLength,
      gameBoard.maxGuesses,
      gameBoard.availableColors
    ));
  }, [gameBoard.gameMode, gameBoard.codeLength, gameBoard.maxGuesses, gameBoard.availableColors]);
  
  /**
   * Change the game mode
   */
  const changeMode = useCallback((mode: GameMode) => {
    if (mode === gameBoard.gameMode) return;
    
    const updatedBoard = GameModeService.changeGameMode(gameBoard, mode);
    setGameBoard(updatedBoard);
  }, [gameBoard]);
  
  /**
   * Set a peg in the current guess
   */
  const setCurrentGuessPeg = useCallback((index: number, color: PegColor) => {
    if (gameBoard.gameOver) return;
    
    const updatedBoard = gameBoard.modifyGuess(gameBoard.guesses.length - 1, index, color);
    setGameBoard(updatedBoard);
  }, [gameBoard]);
  
  /**
   * Modify a peg in a past guess
   */
  const modifyPastGuess = useCallback((guessIndex: number, pegIndex: number, color: PegColor) => {
    if (guessIndex >= gameBoard.guesses.length) return;
    
    const updatedBoard = gameBoard.modifyGuess(guessIndex, pegIndex, color);
    setGameBoard(updatedBoard);
  }, [gameBoard]);
  
  /**
   * Delete a guess
   */
  const deleteGuess = useCallback((guessIndex: number) => {
    if (guessIndex >= gameBoard.guesses.length) return;
    
    const updatedBoard = gameBoard.deleteGuess(guessIndex);
    setGameBoard(updatedBoard);
  }, [gameBoard]);
  
  /**
   * Add a new guess or update the most recent one if it has no feedback
   */
  const pushGuess = useCallback((pegs: PegColor[]) => {
    if (gameBoard.gameOver) return;
    
    // Check if the most recent guess has feedback
    const hasCurrentGuessFeedback = gameBoard.hasCurrentGuessFeedback;
    
    if (hasCurrentGuessFeedback) {
      // If current guess has feedback, we need to add a new guess
      const newGuess = Guess.fromColorArray(pegs, gameBoard.guesses.length);
      const updatedGuesses = [...gameBoard.guesses, newGuess];
      
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
    } else {
      // Update the current guess with new pegs
      const lastGuessIndex = gameBoard.guesses.length - 1;
      const newPegs = pegs.map((color, id) => ({ color, id }));
      
      // Create updated guess
      const updatedGuess = gameBoard.guesses[lastGuessIndex].setPegs(newPegs);
      const updatedGuesses = [...gameBoard.guesses];
      updatedGuesses[lastGuessIndex] = updatedGuess;
      
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
      
      setGameBoard(updatedBoard);
    }
  }, [gameBoard]);
  
  /**
   * Add or update feedback for a guess
   */
  const pushResponse = useCallback((feedback: FeedbackPegValue[], guessIndex?: number) => {
    // If no index is provided, use the most recent guess
    const indexToUpdate = guessIndex !== undefined 
      ? guessIndex 
      : gameBoard.guesses.length - 1;
    
    if (indexToUpdate < 0 || indexToUpdate >= gameBoard.guesses.length) return;
    
    const updatedBoard = gameBoard.setGuessFeedback(indexToUpdate, feedback);
    setGameBoard(updatedBoard);
    
    // If this is the current guess and we're not in game over state,
    // we might need to add a new empty guess row
    if (indexToUpdate === gameBoard.guesses.length - 1 && 
        !updatedBoard.gameOver && 
        updatedBoard.guesses.length === gameBoard.guesses.length) {
      // Add a new empty guess
      const updatedGuesses = [...updatedBoard.guesses, 
        Guess.createEmpty(gameBoard.codeLength, updatedBoard.guesses.length)];
      
      const finalBoard = new GameBoard(
        updatedBoard.secretCode,
        updatedGuesses,
        updatedBoard.gameMode,
        updatedBoard.gameOver,
        updatedBoard.won,
        updatedBoard.possibleSolutions,
        updatedBoard.codeLength,
        updatedBoard.maxGuesses,
        updatedBoard.availableColors
      );
      
      setGameBoard(finalBoard);
    }
  }, [gameBoard]);
  
  /**
   * Submit the current guess
   */
  const submitGuess = useCallback((customFeedback?: FeedbackPegValue[]) => {
    if (gameBoard.gameOver || !gameBoard.currentGuess.isComplete()) return;
    
    const updatedBoard = GameModeService.processGuess(gameBoard, customFeedback);
    setGameBoard(updatedBoard);
  }, [gameBoard]);
  
  return {
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
  };
} 