import { FeedbackPeg, Peg, GuessRow } from '../types/mastermind';

/**
 * Represents a single guess row in the game
 * Implements the GuessRow interface
 */
export class Guess implements GuessRow {
  constructor(
    public pegs: Peg[],
    public feedback: FeedbackPeg[] = []
  ) {}

  /**
   * Create an empty guess with the specified length
   */
  static createEmpty(length: number): Guess {
    return new Guess(
      Array(length).fill('empty' as Peg),
      []
    );
  }

  /**
   * Check if the guess is complete (no empty pegs)
   */
  isComplete(): boolean {
    return !this.pegs.some(peg => peg === 'empty');
  }

  /**
   * Set a peg at the specified index
   */
  setPeg(index: number, color: Peg): Guess {
    if (index < 0 || index >= this.pegs.length) {
      return this;
    }

    const newPegs = [...this.pegs];
    newPegs[index] = color;

    return new Guess(newPegs, this.feedback);
  }

  /**
   * Set all pegs at once
   */
  setPegs(colors: Peg[]): Guess {
    if (colors.length !== this.pegs.length) {
      return this;
    }

    return new Guess(colors, this.feedback);
  }

  /**
   * Set feedback for this guess
   */
  setFeedback(feedback: FeedbackPeg[]): Guess {
    return new Guess(this.pegs, feedback);
  }

  /**
   * Convert the guess to a color array
   */
  toColorArray(): Peg[] {
    return [...this.pegs];
  }


} 