import { FeedbackPegValue, PegColor, SolutionGroup } from '../types/mastermind';
import { 
  evaluateGuess, 
  filterSolutions, 
  generateAllPossibleCodes, 
  groupSolutionsByFeedback as groupByFeedback 
} from '../utils/gameLogic';
import { GameBoard } from '../models/GameBoard';
import { Guess } from '../models/Guess';

/**
 * Service for handling solution calculations and grouping
 */
export class SolutionService {
  /**
   * Calculate possible solutions based on previous guesses and their feedback
   */
  static calculatePossibleSolutions(
    guesses: { guess: PegColor[], feedback: FeedbackPegValue[] }[], 
    codeLength: number, 
    availableColors: PegColor[]
  ): PegColor[][] {
    // Start with all possible codes
    const allCodes = generateAllPossibleCodes(
      codeLength, 
      availableColors.filter(c => c !== 'empty')
    );
    
    // No guesses, return all possible codes
    if (guesses.length === 0) {
      return allCodes;
    }
    
    // Filter solutions based on each guess and its feedback
    return guesses.reduce((solutions, { guess, feedback }) => {
      return filterSolutions(solutions, guess, feedback);
    }, allCodes);
  }

  /**
   * Group possible solutions by the feedback they would give to a specific guess
   */
  static groupSolutionsByFeedback(solutions: PegColor[][], guess: PegColor[]): SolutionGroup[] {
    return groupByFeedback(solutions, guess);
  }

  /**
   * Calculate and update solution groups for a given game board
   */
  static updateSolutionGroups(board: GameBoard): SolutionGroup[] {
    if (board.guesses.length === 0) {
      return [];
    }

    // Calculate possible solutions up to the last guess
    let possibleSolutions: PegColor[][] = [];
    
    if (board.guesses.length === 1) {
      // If there's only one guess, start with all possible solutions
      possibleSolutions = generateAllPossibleCodes(
        board.codeLength,
        board.availableColors.filter(c => c !== 'empty')
      );
    } else {
      // Otherwise, calculate based on all guesses except the last one
      const processedGuesses = board.guesses.slice(0, -1).map(g => ({
        guess: g.toColorArray(),
        feedback: g.feedback
      }));
      
      possibleSolutions = this.calculatePossibleSolutions(
        processedGuesses,
        board.codeLength,
        board.availableColors
      );
    }
    
    // Get the last guess and calculate all possible feedback groups for it
    const lastGuess = board.guesses[board.guesses.length - 1];
    const lastGuessColors = lastGuess.toColorArray();
    
    return this.groupSolutionsByFeedback(possibleSolutions, lastGuessColors);
  }

  /**
   * Calculate solution groups for a specific guess against current possible solutions
   */
  static predictFeedback(board: GameBoard, guessColors: PegColor[]): SolutionGroup[] {
    // Ensure we have a valid guess with no empty colors
    if (guessColors.some(color => color === 'empty')) {
      return [];
    }
    
    // Calculate possible solutions based on all previous guesses
    const processedGuesses = board.guesses.map(g => ({
      guess: g.toColorArray(),
      feedback: g.feedback
    }));
    
    const possibleSolutions = this.calculatePossibleSolutions(
      processedGuesses,
      board.codeLength,
      board.availableColors
    );
    
    // Calculate all possible feedback groups for the current guess
    return this.groupSolutionsByFeedback(possibleSolutions, guessColors);
  }

  /**
   * Find optimal guesses that would most effectively split the solution space
   */
  static findOptimalGuesses(possibleSolutions: PegColor[][], maxResults: number = 5): Array<{
    guess: PegColor[];
    maxGroupSize: number;
    distribution: { [key: string]: number };
  }> {
    if (possibleSolutions.length === 0) {
      // Standard first guesses for 4-peg Mastermind when no info is available
      return [
        { 
          guess: ['red', 'red', 'blue', 'blue'] as PegColor[], 
          maxGroupSize: 256,
          distribution: {}
        },
        { 
          guess: ['red', 'green', 'blue', 'yellow'] as PegColor[], 
          maxGroupSize: 256,
          distribution: {}
        },
        { 
          guess: ['red', 'yellow', 'red', 'yellow'] as PegColor[], 
          maxGroupSize: 256,
          distribution: {}
        }
      ];
    }

    // We'll take a sample of possible solutions to evaluate if there are too many
    const solutionsToEvaluate = possibleSolutions.length <= 25 
      ? possibleSolutions 
      : possibleSolutions.slice(0, 25);
    
    const evaluatedGuesses: Array<{
      guess: PegColor[];
      maxGroupSize: number;
      distribution: { [key: string]: number };
    }> = [];
    
    for (const candidateGuess of solutionsToEvaluate) {
      // Calculate how this guess would split the solution space
      const distribution: { [key: string]: number } = {};
      let maxGroupSize = 0;
      
      for (const solution of possibleSolutions) {
        const feedback = evaluateGuess(candidateGuess, solution);
        const feedbackKey = feedback.join(',');
        
        distribution[feedbackKey] = (distribution[feedbackKey] || 0) + 1;
        maxGroupSize = Math.max(maxGroupSize, distribution[feedbackKey]);
      }
      
      evaluatedGuesses.push({
        guess: candidateGuess,
        maxGroupSize,
        distribution
      });
    }
    
    // Sort by max group size (smallest first) - better guesses split solutions more evenly
    return evaluatedGuesses
      .sort((a, b) => a.maxGroupSize - b.maxGroupSize)
      .slice(0, maxResults);
  }

  /**
   * Recalculate possible solutions after a guess has been modified
   */
  static recalculateAfterGuessChange(board: GameBoard, guessIndex: number): {
    updatedBoard: GameBoard;
    solutionGroups: SolutionGroup[];
  } {
    if (guessIndex < 0 || guessIndex >= board.guesses.length) {
      return { updatedBoard: board, solutionGroups: [] };
    }
    
    let updatedBoard = board;
    const updatedGuesses = [...board.guesses];
    
    // Process guesses up to and including the modified guess
    // This will be mode-specific
    if (board.gameMode === 'normal') {
      // In normal mode, recalculate feedback for each guess up to the modified one
      for (let i = 0; i <= guessIndex; i++) {
        const secretColors = board.secretCode.map(peg => peg.color);
        const guessColors = updatedGuesses[i].toColorArray();
        const feedback = evaluateGuess(guessColors, secretColors);
        updatedGuesses[i] = updatedGuesses[i].setFeedback(feedback);
      }
    } else if (board.gameMode === 'explorer') {
      // In explorer mode, we keep the feedback as is, unless it's the modified guess
      if (guessIndex < updatedGuesses.length) {
        // In explorer mode, keep feedback as-is (user controlled)
      }
    }
    
    // Calculate possible solutions using all guesses up to modified one
    const processedGuesses = updatedGuesses.slice(0, guessIndex + 1).map(g => ({
      guess: g.toColorArray(),
      feedback: g.feedback
    }));
    
    const newPossibleSolutions = this.calculatePossibleSolutions(
      processedGuesses,
      board.codeLength,
      board.availableColors
    );
    
    // Update solution groups
    const modifiedGuessColors = updatedGuesses[guessIndex].toColorArray();
    const groups = this.groupSolutionsByFeedback(newPossibleSolutions, modifiedGuessColors);
    
    // Create updated board with new possible solutions
    updatedBoard = new GameBoard(
      board.secretCode,
      updatedGuesses,
      board.gameMode,
      board.gameOver,
      board.won,
      newPossibleSolutions,
      board.codeLength,
      board.maxGuesses,
      board.availableColors
    );
    
    return { updatedBoard, solutionGroups: groups };
  }
} 