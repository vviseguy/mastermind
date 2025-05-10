import { Peg, FeedbackPeg, GameBoard as IGameBoard, GameRules } from '../types/mastermind';
import { Guess } from './Guess';
import { 
  generateRandomCode
} from '../utils/gameLogic';

/**
 * Implements the game board and manages game rules
 */
export class GameBoard implements IGameBoard {
  public guesses: Guess[];
  public gameRules: GameRules;

  /**
   * Create a GameBoard instance
   */
  constructor(
    public secretCode: Peg[],
    guesses: Guess[] = [],
    codeLength: number = 4,
    maxGuesses: number = 10,
    availableColors: Peg[] = ['red', 'blue', 'green','yellow', 'purple', 'orange', 'empty']
  ) {
    // Setup game rules
    this.gameRules = {
      codeLength,
      maxGuesses,
      availableColors
    };
    
    // Ensure there's always at least one guess (for input)
    if (guesses.length === 0) {
      this.guesses = [Guess.createEmpty(codeLength)];
    } else {
      this.guesses = guesses;
    }
  }

  /**
   * Get the current guess (last guess)
   */
  get currentGuess(): Guess {
    return this.guesses[this.guesses.length - 1];
  }

  /**
   * Check if the current guess has feedback
   */
  get hasCurrentGuessFeedback(): boolean {
    return this.currentGuess.feedback.length > 0;
  }

  /**
   * Create a new GameBoard with a new secret code
   */
  static createNewGame(
    codeLength: number = 4,
    maxGuesses: number = 10,
    availableColors: Peg[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'empty']
  ): GameBoard {
    const filteredColors = availableColors.filter(c => c !== 'empty');
    const secretCode = generateRandomCode(codeLength, filteredColors);
    const initialGuess = [Guess.createEmpty(codeLength)];

    return new GameBoard(
      secretCode,
      initialGuess,
      codeLength,
      maxGuesses,
      availableColors
    );
  }

  /**
   * Clone this board with updated properties
   */
  clone(props: Partial<GameBoard>): GameBoard {
    return new GameBoard(
      props.secretCode ?? this.secretCode,
      props.guesses ?? this.guesses,
      props.gameRules?.codeLength ?? this.gameRules.codeLength,
      props.gameRules?.maxGuesses ?? this.gameRules.maxGuesses,
      props.gameRules?.availableColors ?? this.gameRules.availableColors
    );
  }

  /**
   * Modify a peg in a specific guess
   */
  modifyGuess(guessIndex: number, pegIndex: number, color: Peg): GameBoard {
    if (guessIndex >= this.guesses.length) return this;
    
    const updatedGuesses = [...this.guesses];
    updatedGuesses[guessIndex] = updatedGuesses[guessIndex].setPeg(pegIndex, color);
    
    return new GameBoard(
      this.secretCode,
      updatedGuesses,
      this.gameRules.codeLength,
      this.gameRules.maxGuesses,
      this.gameRules.availableColors
    );
  }

  /**
   * Delete a guess at the specified index
   */
  deleteGuess(guessIndex: number): GameBoard {
    if (guessIndex >= this.guesses.length) return this;
    
    const updatedGuesses = this.guesses.filter((_, index) => index !== guessIndex);
    
    // Ensure there's always at least one guess
    if (updatedGuesses.length === 0) {
      updatedGuesses.push(Guess.createEmpty(this.gameRules.codeLength));
    }
    
    return new GameBoard(
      this.secretCode,
      updatedGuesses,
      this.gameRules.codeLength,
      this.gameRules.maxGuesses,
      this.gameRules.availableColors
    );
  }

  /**
   * Set feedback for a specific guess
   */
  setGuessFeedback(guessIndex: number, feedback: FeedbackPeg[]): GameBoard {
    if (guessIndex < 0 || guessIndex >= this.guesses.length) return this;
    
    const updatedGuesses = [...this.guesses];
    updatedGuesses[guessIndex] = updatedGuesses[guessIndex].setFeedback(feedback);
    
    return new GameBoard(
      this.secretCode,
      updatedGuesses,
      this.gameRules.codeLength,
      this.gameRules.maxGuesses,
      this.gameRules.availableColors
    );
  }
} 