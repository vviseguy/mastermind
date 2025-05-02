import { FeedbackPegValue, Peg, PegColor } from '../types/mastermind';

export class Guess {
  constructor(
    public pegs: Peg[],
    public feedback: FeedbackPegValue[] = [],
    public id: number = 0
  ) {}

  /**
   * Check if this guess is complete (no empty pegs)
   */
  isComplete(): boolean {
    return !this.pegs.some(peg => peg.color === 'empty');
  }

  /**
   * Set a peg at the specified index with the given color
   */
  setPeg(index: number, color: PegColor): Guess {
    const newPegs = [...this.pegs];
    newPegs[index] = { ...newPegs[index], color };
    return new Guess(newPegs, this.feedback, this.id);
  }

  /**
   * Set all pegs at once
   */
  setPegs(pegs: Peg[]): Guess {
    return new Guess(pegs, this.feedback, this.id);
  }

  /**
   * Set feedback for this guess
   */
  setFeedback(feedback: FeedbackPegValue[]): Guess {
    return new Guess(this.pegs, feedback, this.id);
  }

  /**
   * Convert pegs to a color array
   */
  toColorArray(): PegColor[] {
    return this.pegs.map(peg => peg.color);
  }

  /**
   * Create an empty guess with the specified length
   */
  static createEmpty(length: number, id: number = 0): Guess {
    const emptyPegs = Array(length).fill(null).map((_, idx) => ({ 
      color: 'empty' as PegColor, 
      id: idx 
    }));
    return new Guess(emptyPegs, Array(length).fill('empty'), id);
  }

  /**
   * Create a guess from a color array
   */
  static fromColorArray(colors: PegColor[], id: number = 0): Guess {
    const pegs = colors.map((color, idx) => ({ color, id: idx }));
    return new Guess(pegs, [], id);
  }

  /**
   * Convert to the legacy GuessRow format used in the current implementation
   */
  toLegacyGuessRow() {
    return {
      guess: this.pegs,
      feedback: this.feedback,
      id: this.id
    };
  }
} 