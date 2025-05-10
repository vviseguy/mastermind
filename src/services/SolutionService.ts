import { FeedbackPeg, GameRules, Peg, SolutionGroup } from '../types/mastermind';
import { 
  evaluateGuess, 
  sortFeedback
} from '../utils/gameLogic';

/**
 * Service for handling solution calculations and grouping
 */
export class SolutionService {
  private solutions: Set<string>;
  private readonly codeLength: number;

  /**
   * Creates a SolutionService with all possible solutions based on game rules
   */
  public static create(gameRules: GameRules): SolutionService {
    const { codeLength, availableColors } = gameRules;
    const allPossibleCodes = SolutionService.generateAllPossibleCodesArray(codeLength, availableColors);
    return new SolutionService(allPossibleCodes);
  }

  /**
   * Generate all possible code combinations as a 2D array
   */
  private static generateAllPossibleCodesArray(length: number, colors: Peg[]): Peg[][] {
    const result: Peg[][] = [];

    colors = colors.filter(c => c !== 'empty');
    
    const generate = (current: Peg[], position: number) => {
      if (position === length) {
        result.push([...current]);
        return;
      }
      
      for (const color of colors) {
        current[position] = color;
        generate(current, position + 1);
      }
    };
    
    generate(Array(length).fill('empty' as Peg), 0);
    return result;
  }

  constructor(initialSolutions: Peg[][]) {
    if (initialSolutions.length) {
      // Validate all solutions have the same length
      this.codeLength = initialSolutions[0].length;
      if (!initialSolutions.every(solution => solution.length === this.codeLength)) {
        throw new Error('All solutions must have the same length');
      }
    }

    

    // Initialize with provided solutions
    this.solutions = new Set(initialSolutions.map(code => this.codeToString(code)));
  }

  /**
   * Get the current number of possible solutions
   */
  get solutionCount(): number {
    return this.solutions.size;
  }

  /**
   * Get all current solutions
   */
  get allSolutions(): Peg[][] {
    return Array.from(this.solutions).map(code => this.stringToCode(code));
  }

  /**
   * Get the code length used by this service
   */
  get length(): number {
    return this.codeLength;
  }

  /**
   * Apply a guess and its feedback to filter the solution set
   * @returns The number of solutions remaining after filtering
   */
  applyGuessAndFeedback(guess: Peg[], feedback: FeedbackPeg[]): number {
    if (guess.length !== this.codeLength) {
      throw new Error(`Guess must have length ${this.codeLength}`);
    }
    if (feedback.length !== this.codeLength) {
      throw new Error(`Feedback must have length ${this.codeLength}`);
    }
    feedback = sortFeedback(feedback);

    const matchingSolutions = new Set<string>();
    
    for (const solution of this.solutions) {
      const solutionCode = this.stringToCode(solution);
      const solutionFeedback = evaluateGuess(guess, solutionCode);
      
      // Check if the feedback matches
      if (this.areFeedbackEqual(solutionFeedback, feedback)) {
        matchingSolutions.add(solution);
      }
    }

    this.solutions = matchingSolutions;
    return this.solutions.size;
  }

  /**
   * Get all solutions that would match a given guess with a specific feedback
   * @returns A SolutionGroup object containing the feedback, solutions, and count
   */
  getSolutionsForGuessAndFeedback(guess: Peg[], feedback: FeedbackPeg[]): SolutionGroup {
    if (guess.length !== this.codeLength) {
      throw new Error(`Guess must have length ${this.codeLength}`);
    }

    const matchingSolutions: Peg[][] = [];
    
    for (const solution of this.solutions) {
      const solutionCode = this.stringToCode(solution);
      const solutionFeedback = evaluateGuess(guess, solutionCode);
      
      if (this.areFeedbackEqual(solutionFeedback, feedback)) {
        matchingSolutions.push(solutionCode);
      }
    }

    return {
      feedback,
      solutions: matchingSolutions,
      count: matchingSolutions.length
    };
  }

  /**
   * Get all possible feedback patterns for a given guess with their group sizes
   * @returns Array of SolutionGroup objects
   */
  getPossibleFeedbackPatterns(guess: Peg[]): SolutionGroup[] {
    if (guess.length !== this.codeLength) {
      throw new Error(`Guess must have length ${this.codeLength}`);
    }

    const patternsMap = new Map<string, { feedback: FeedbackPeg[], solutions: Peg[][], count: number }>();
    
    for (const solution of this.solutions) {
      const solutionCode = this.stringToCode(solution);
      const feedback = evaluateGuess(guess, solutionCode);
      const feedbackKey = this.feedbackToString(feedback);
      
      if (!patternsMap.has(feedbackKey)) {
        patternsMap.set(feedbackKey, { 
          feedback, 
          solutions: [], 
          count: 0 
        });
      }
      const group = patternsMap.get(feedbackKey)!;
      group.solutions.push(solutionCode);
      group.count++;
    }

    return Array.from(patternsMap.values());
  }

  /**
   * Reset the solution set to all possible combinations
   */
  reset(codeLength: number, availableColors: Peg[]): void {
    this.solutions = new Set(this.generateAllPossibleCodes(codeLength, availableColors));
  }

  /**
   * Generate all possible code combinations
   */
  private generateAllPossibleCodes(length: number, colors: Peg[]): string[] {
    const result: string[] = [];
    
    const generate = (current: Peg[], position: number) => {
      if (position === length) {
        result.push(this.codeToString(current));
        return;
      }
      
      for (const color of colors) {
        current[position] = color;
        generate(current, position + 1);
      }
    };
    
    generate(Array(length).fill('empty' as Peg), 0);
    return result;
  }

  /**
   * Convert a code array to a string for efficient storage
   */
  private codeToString(code: Peg[]): string {
    return code.join(',');
  }

  /**
   * Convert a string back to a code array
   */
  private stringToCode(str: string): Peg[] {
    return str.split(',') as Peg[];
  }

  /**
   * Convert feedback to a string for efficient comparison
   */
  private feedbackToString(feedback: FeedbackPeg[]): string {
    return feedback.sort().join(',');
  }

  /**
   * Compare two feedback arrays for equality
   */
  private areFeedbackEqual(feedback1: FeedbackPeg[], feedback2: FeedbackPeg[]): boolean {
    if (feedback1.length !== feedback2.length) return false;
    
    const sorted1 = [...feedback1].sort();
    const sorted2 = [...feedback2].sort();
    
    return sorted1.every((value, index) => value === sorted2[index]);
  }

  /**
   * Process a series of guesses and responses, ensuring responses are optimal
   * @returns Array of optimal responses for each guess
   */
  processGuessSeries(guesses: Peg[][], responses: FeedbackPeg[][]): FeedbackPeg[][] {
    if (guesses.length !== responses.length) {
      throw new Error('Number of guesses must match number of responses');
    }

    const optimalResponses: FeedbackPeg[][] = [];
    let currentSolutions = new Set(this.solutions);

    for (let i = 0; i < guesses.length; i++) {
      const guess = guesses[i];
      const response = responses[i];

      if (guess.length !== this.codeLength) {
        throw new Error(`Guess at index ${i} must have length ${this.codeLength}`);
      }
      if (response.length !== this.codeLength) {
        throw new Error(`Response at index ${i} must have length ${this.codeLength}`);
      }

      // Get all possible feedback patterns as SolutionGroups
      const patterns = this.getPossibleFeedbackPatterns(guess);
      
      // Find the largest group
      const largestGroup = patterns.reduce(
        (max, group) => group.count > max.count ? group : max, 
        { feedback: [] as FeedbackPeg[], solutions: [], count: 0 }
      );
      
      // Find if the current response is in one of our pattern groups
      const currentResponseGroup = patterns.find(group => 
        this.areFeedbackEqual(group.feedback, response)
      );

      // Use the largest group's response if current group is smaller
      const optimalResponse = (!currentResponseGroup || currentResponseGroup.count < largestGroup.count)
        ? largestGroup.feedback
        : response;

      optimalResponses.push(optimalResponse);

      // Update solution set for next iteration
      const newSolutions = new Set<string>();
      for (const solution of currentSolutions) {
        const solutionCode = this.stringToCode(solution);
        const solutionFeedback = evaluateGuess(guess, solutionCode);
        if (this.areFeedbackEqual(solutionFeedback, optimalResponse)) {
          newSolutions.add(this.codeToString(solutionCode));
        }
      }
      currentSolutions = newSolutions;
    }

    // Update the final solution set
    this.solutions = currentSolutions;
    return optimalResponses;
  }

  /**
   * Convert a feedback string back to an array
   */
  private stringToFeedback(str: string): FeedbackPeg[] {
    return str.split(',') as FeedbackPeg[];
  }
} 