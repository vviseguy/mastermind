import { useState, useCallback } from 'react';
import { GameMode, Peg, FeedbackPeg, GameState } from '../types/mastermind';
import { GameBoard } from '../models/GameBoard';
import { Guess } from '../models/Guess';
import { 
  generateAllPossibleCodes, 
  evaluateGuess, 
  getEvilFeedback 
} from '../utils/gameLogic';
import { SolutionService } from '../services/SolutionService';

/**
 * Hook for managing the core game state
 */
export function useGameState(
  initialMode: GameMode = 'normal',
  codeLength: number = 4,
  maxGuesses: number = 10,
  availableColors: Peg[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'empty']
) {
  const filteredColors = availableColors.filter(c => c !== 'empty');
  const [gameBoard, setGameBoard] = useState(() => GameBoard.createNewGame(codeLength, maxGuesses, availableColors));
  const [gameMode, setGameMode] = useState<GameMode>(initialMode);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  
  // Initialize solution service with all possible codes
  const [solutionService] = useState(() => {
    const allPossibleCodes = generateAllPossibleCodes(codeLength, filteredColors);
    return new SolutionService(allPossibleCodes);
  });
  
  /**
   * Get the current game state as defined in the GameState interface
   */
  const getGameState = useCallback((): GameState => {
    return {
      secretCode: gameBoard.secretCode,
      board: {
        guesses: gameBoard.guesses
      },
      gameMode,
      gameRules: gameBoard.gameRules,
      gameOver,
      won
    };
  }, [gameBoard, gameMode, gameOver, won]);
  
  /**
   * Update the game state based on current board state
   */
  const bumpState = useCallback((board: GameBoard) => {
    // Preserve the current goal code and guesses
    const currentGoal = board.secretCode;
    const currentGuesses = board.guesses;
    
    if (gameMode === 'evil') {
      // In evil mode, we need to update the solution set based on current guesses
      solutionService.reset(board.gameRules.codeLength, filteredColors);
      
      // Process all existing guesses to update the solution set
      const guesses = currentGuesses
        .filter(guess => guess.isComplete() && guess.feedback.length > 0)
        .map(guess => guess.toColorArray());
      const responses = currentGuesses
        .filter(guess => guess.isComplete() && guess.feedback.length > 0)
        .map(guess => guess.feedback);
      
      const optimalResponses = solutionService.processGuessSeries(guesses, responses);

      // Update the guesses with optimal responses
      optimalResponses.forEach((response, index) => {
        currentGuesses[index].feedback = response;
      });
    } else if (gameMode === 'normal') {
      // In normal mode, we need to ensure the solution set matches the goal code
      solutionService.reset(board.gameRules.codeLength, filteredColors);
      
      // Process all existing guesses to update the solution set with truthful feedback
      currentGuesses.forEach(guess => {
        if (guess.isComplete()) {
          const feedback = evaluateGuess(guess.toColorArray(), currentGoal);
          solutionService.applyGuessAndFeedback(guess.toColorArray(), feedback);
        }
      });
    }
    
    // Create new board with preserved goal and guesses
    const updatedBoard = new GameBoard(
      currentGoal,
      currentGuesses,
      board.gameRules.codeLength,
      board.gameRules.maxGuesses,
      board.gameRules.availableColors
    );

    // Update game state based on the current guess
    if (updatedBoard.guesses.length > 0) {
      const currentGuess = updatedBoard.guesses[updatedBoard.guesses.length - 1];
      if (currentGuess.isComplete() && currentGuess.feedback.length > 0) {
        const isCorrect = currentGuess.feedback.every(f => f === 'correct');
        const isGameOver = isCorrect || updatedBoard.guesses.length >= updatedBoard.gameRules.maxGuesses;
        setGameOver(isGameOver);
        setWon(isCorrect);
      }
    }

    setGameBoard(updatedBoard);
  }, [gameMode, filteredColors, solutionService]);
  
  /**
   * Start a new game with the current settings
   */
  const startNewGame = useCallback(() => {
    const newBoard = GameBoard.createNewGame(codeLength, maxGuesses, availableColors);
    setGameBoard(newBoard);
    setGameMode(initialMode);
    setGameOver(false);
    setWon(false);
    
    // Reset solution service to initial state
    solutionService.reset(codeLength, filteredColors);
  }, [codeLength, maxGuesses, availableColors, initialMode, solutionService, filteredColors]);
  
  /**
   * Change the game mode
   */
  const changeMode = useCallback((newMode: GameMode) => {
    setGameMode(newMode);
    
    // Preserve the current goal code and guesses
    const currentGoal = gameBoard.secretCode;
    const currentGuesses = gameBoard.guesses;
    
    // Create new board with preserved goal and guesses
    const newBoard = new GameBoard(
      currentGoal,
      currentGuesses,
      gameBoard.gameRules.codeLength,
      gameBoard.gameRules.maxGuesses,
      gameBoard.gameRules.availableColors
    );
    
    bumpState(newBoard);
  }, [gameBoard, bumpState]);
  
  /**
   * Set or modify a peg in any guess
   * @param guessIndex - Index of the guess to modify. If not provided, modifies the current guess
   * @param pegIndex - Index of the peg to modify
   * @param color - New color for the peg
   */
  const setGuessPeg = useCallback((pegIndex: number, color: Peg, guessIndex?: number) => {    
    // If no guessIndex is provided, use the current guess
    const targetGuessIndex = guessIndex !== undefined 
      ? guessIndex 
      : gameBoard.guesses.length - 1;
    
    // Validate the guess index
    if (targetGuessIndex >= gameBoard.guesses.length) return;
    
    const updatedBoard = gameBoard.modifyGuess(targetGuessIndex, pegIndex, color);
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
  const pushGuess = useCallback((pegs: Peg[]) => {
    if (gameOver) return;
    
    // Check if the most recent guess has feedback
    if (gameBoard.hasCurrentGuessFeedback) {
      // If current guess has feedback, we need to add a new guess
      const newGuess = new Guess(pegs);
      const updatedGuesses = [...gameBoard.guesses, newGuess];
      
      const updatedBoard = new GameBoard(
        gameBoard.secretCode,
        updatedGuesses,
        gameBoard.gameRules.codeLength,
        gameBoard.gameRules.maxGuesses,
        gameBoard.gameRules.availableColors
      );
      
      bumpState(updatedBoard);
    } else {
      // Create updated guess using setPegs with the color array directly
      const updatedGuesses = [...gameBoard.guesses];
      updatedGuesses[gameBoard.guesses.length - 1] = gameBoard.currentGuess.setPegs(pegs);
      
      // Create updated board
      const updatedBoard = new GameBoard(
        gameBoard.secretCode,
        updatedGuesses,
        gameBoard.gameRules.codeLength,
        gameBoard.gameRules.maxGuesses,
        gameBoard.gameRules.availableColors
      );
      
      bumpState(updatedBoard);
    }
  }, [gameBoard, gameOver, bumpState]);
  
  /**
   * Add or update feedback for a guess
   */
  const pushResponse = useCallback((feedback: FeedbackPeg[], guessIndex?: number) => {
    // If no index is provided, find the most recent valid guess
    let indexToUpdate = guessIndex;
    if (indexToUpdate === undefined) {
      // Start from most recent and work backwards to find valid guess
      for (let i = gameBoard.guesses.length - 1; i >= 0; i--) {
        const guess = gameBoard.guesses[i];
        if (guess.isComplete() && !guess.pegs.includes('empty')) {
          indexToUpdate = i;
          break;
        }
      }
    }
    
    // Return if no valid guess found or index out of bounds
    if (indexToUpdate === undefined || 
        indexToUpdate < 0 || 
        indexToUpdate >= gameBoard.guesses.length) return;
    
    // Update the guess with feedback
    const updatedGuesses = [...gameBoard.guesses];
    updatedGuesses[indexToUpdate] = updatedGuesses[indexToUpdate].setFeedback(feedback);
    
    // If this is the current guess and we're not in game over state,
    // add a new empty guess
    if (indexToUpdate === gameBoard.guesses.length - 1 && 
        !gameOver && 
        updatedGuesses.length === gameBoard.guesses.length) {
      updatedGuesses.push(Guess.createEmpty(gameBoard.gameRules.codeLength));
    }
    
    // Create and update the board in one go
    const updatedBoard = new GameBoard(
      gameBoard.secretCode,
      updatedGuesses,
      gameBoard.gameRules.codeLength,
      gameBoard.gameRules.maxGuesses,
      gameBoard.gameRules.availableColors
    );
    
    bumpState(updatedBoard);
  }, [gameBoard, gameOver, bumpState]);
  
  /**
   * Submit the current guess
   */
  const submitGuess = useCallback(() => {
    if (gameOver || !gameBoard.currentGuess.isComplete()) return;
    
    // Generate feedback based on the game mode
    let feedback: FeedbackPeg[];
    if (gameMode === 'evil') {
      // In evil mode, get the most advantageous feedback
      const solutions = solutionService.allSolutions;
      const guess = gameBoard.currentGuess.toColorArray();
      const evilResult = getEvilFeedback(solutions, guess);
      feedback = evilResult.feedback;
    } else {
      // In normal mode, evaluate against the secret code
      feedback = evaluateGuess(gameBoard.currentGuess.toColorArray(), gameBoard.secretCode);
    }
    
    // Use pushResponse to handle updating the guess and adding a new row
    pushResponse(feedback);
  }, [gameBoard, gameMode, gameOver, solutionService, pushResponse, evaluateGuess, getEvilFeedback]);
  
  const getPossibleSolutions = useCallback((guess: Peg[], feedback: FeedbackPeg[]) => {
    return solutionService.getSolutionsForGuessAndFeedback(guess, feedback);
  }, [solutionService]);

  const getPossibleFeedbackPatterns = useCallback((guess: Peg[]) => {
    return solutionService.getPossibleFeedbackPatterns(guess);
  }, [solutionService]);

  const processGuessSeries = useCallback((guesses: Peg[][], responses: FeedbackPeg[][]) => {
    return solutionService.processGuessSeries(guesses, responses);
  }, [solutionService]);

  return {
    gameBoard,
    setGameBoard: bumpState,
    gameMode,
    gameOver,
    won,
    solutionCount: solutionService.solutionCount,
    allSolutions: solutionService.allSolutions,
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
  };
} 