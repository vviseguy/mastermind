import { FeedbackPegValue, GameMode, Peg, PegColor } from '../types/mastermind';
import { Guess } from './Guess';
import { 
  evaluateGuess, 
  areCodesEqual, 
  generateRandomCode,
  generateAllPossibleCodes
} from '../utils/gameLogic';

export class GameBoard {
  /**
   * Create a GameBoard instance
   */
  constructor(
    public secretCode: Peg[],
    public guesses: Guess[] = [],
    public gameMode: GameMode = 'normal',
    public gameOver: boolean = false,
    public won: boolean = false,
    public possibleSolutions: PegColor[][] = [],
    public codeLength: number = 4,
    public maxGuesses: number = 10,
    public availableColors: PegColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'empty']
  ) {
    // Ensure there's always at least one guess (for input)
    if (guesses.length === 0) {
      this.guesses = [Guess.createEmpty(codeLength, 0)];
    }
  }

  /**
   * Get the current (most recent) guess
   */
  get currentGuess(): Guess {
    return this.guesses[this.guesses.length - 1];
  }

  /**
   * Check if the current guess has feedback
   */
  get hasCurrentGuessFeedback(): boolean {
    return this.currentGuess.feedback.length > 0 && 
           this.currentGuess.feedback.some(f => f !== 'empty');
  }

  /**
   * Modify a guess at the specified index
   */
  modifyGuess(guessIndex: number, pegIndex: number, color: PegColor): GameBoard {
    if (guessIndex < 0 || guessIndex >= this.guesses.length) {
      return this;
    }

    const updatedGuesses = [...this.guesses];
    updatedGuesses[guessIndex] = updatedGuesses[guessIndex].setPeg(pegIndex, color);

    return new GameBoard(
      this.secretCode,
      updatedGuesses,
      this.gameMode,
      this.gameOver,
      this.won,
      this.possibleSolutions,
      this.codeLength,
      this.maxGuesses,
      this.availableColors
    );
  }

  /**
   * Set feedback for a guess
   */
  setGuessFeedback(guessIndex: number, feedback: FeedbackPegValue[]): GameBoard {
    if (guessIndex < 0 || guessIndex >= this.guesses.length) {
      return this;
    }

    const updatedGuesses = [...this.guesses];
    updatedGuesses[guessIndex] = updatedGuesses[guessIndex].setFeedback(feedback);

    // Check if this is a winning guess
    const isCorrect = feedback.every(peg => peg === 'correct');
    
    // Check if game is over
    const isGameOver = isCorrect || updatedGuesses.length >= this.maxGuesses;

    return new GameBoard(
      this.secretCode,
      updatedGuesses,
      this.gameMode,
      isGameOver,
      isCorrect,
      this.possibleSolutions,
      this.codeLength,
      this.maxGuesses,
      this.availableColors
    );
  }

  /**
   * Delete a guess at the specified index
   */
  deleteGuess(guessIndex: number): GameBoard {
    if (guessIndex < 0 || guessIndex >= this.guesses.length) {
      return this;
    }

    // Don't allow deleting the last guess if it's the only one
    if (this.guesses.length === 1) {
      // Instead, just clear it
      return new GameBoard(
        this.secretCode,
        [Guess.createEmpty(this.codeLength, 0)],
        this.gameMode,
        false,
        false,
        this.possibleSolutions,
        this.codeLength,
        this.maxGuesses,
        this.availableColors
      );
    }

    const updatedGuesses = [...this.guesses];
    updatedGuesses.splice(guessIndex, 1);

    return new GameBoard(
      this.secretCode,
      updatedGuesses,
      this.gameMode,
      false, // Removing a guess resets game over state
      false, // and the win state
      this.possibleSolutions,
      this.codeLength,
      this.maxGuesses,
      this.availableColors
    );
  }

  /**
   * Evaluate the current guess against the secret code (for normal mode)
   */
  evaluateCurrentGuess(): FeedbackPegValue[] {
    if (!this.currentGuess.isComplete() || this.gameMode !== 'normal') {
      return [];
    }

    const secretColors = this.secretCode.map(peg => peg.color);
    const guessColors = this.currentGuess.toColorArray();
    return evaluateGuess(guessColors, secretColors);
  }

  /**
   * Check if the current guess matches the secret code
   */
  isCurrentGuessCorrect(): boolean {
    if (!this.currentGuess.isComplete()) {
      return false;
    }

    const secretColors = this.secretCode.map(peg => peg.color);
    const guessColors = this.currentGuess.toColorArray();
    return areCodesEqual(guessColors, secretColors);
  }

  /**
   * Submit the current guess and create a new empty guess
   */
  submitGuess(feedback?: FeedbackPegValue[]): GameBoard {
    if (this.gameOver || !this.currentGuess.isComplete()) {
      return this;
    }

    // Use provided feedback or compute it (in normal mode)
    const actualFeedback = feedback || this.evaluateCurrentGuess();
    const isCorrect = actualFeedback.every(peg => peg === 'correct');
    const isGameOver = isCorrect || this.guesses.length >= this.maxGuesses;

    // Set feedback on current guess
    const updatedGuesses = [...this.guesses];
    const lastIndex = updatedGuesses.length - 1;
    updatedGuesses[lastIndex] = updatedGuesses[lastIndex].setFeedback(actualFeedback);

    // Add a new empty guess if the game isn't over
    if (!isGameOver) {
      updatedGuesses.push(Guess.createEmpty(this.codeLength, updatedGuesses.length));
    }

    return new GameBoard(
      this.secretCode,
      updatedGuesses,
      this.gameMode,
      isGameOver,
      isCorrect,
      this.possibleSolutions,
      this.codeLength,
      this.maxGuesses,
      this.availableColors
    );
  }

  /**
   * Create a new GameBoard with a new secret code and game mode
   */
  static createNewGame(
    mode: GameMode = 'normal', 
    codeLength: number = 4,
    maxGuesses: number = 10,
    availableColors: PegColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'empty']
  ): GameBoard {
    const filteredColors = availableColors.filter(c => c !== 'empty');
    
    // Generate a random code for normal mode, empty for evil/explorer
    const secretCodeColors = mode === 'normal' 
      ? generateRandomCode(codeLength, filteredColors)
      : Array(codeLength).fill('empty' as PegColor);
    
    const secretCode = secretCodeColors.map((color, id) => ({ color, id }));
    const initialGuess = [Guess.createEmpty(codeLength, 0)];
    const possibleSolutions = generateAllPossibleCodes(codeLength, filteredColors);

    return new GameBoard(
      secretCode,
      initialGuess,
      mode,
      false,
      false,
      possibleSolutions,
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
      props.gameMode ?? this.gameMode,
      props.gameOver ?? this.gameOver,
      props.won ?? this.won,
      props.possibleSolutions ?? this.possibleSolutions,
      props.codeLength ?? this.codeLength,
      props.maxGuesses ?? this.maxGuesses,
      props.availableColors ?? this.availableColors
    );
  }
} 