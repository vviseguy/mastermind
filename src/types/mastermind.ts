// Color options for the game
export type Peg = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'empty';

// Feedback types
export type FeedbackPeg = 'correct' | 'wrongPosition' | 'incorrect' | 'empty';

// Game modes
export type GameMode = 'normal' | 'evil' | 'explorer';

export interface GuessRow {
  pegs: Peg[];
  feedback: FeedbackPeg[];
}

export interface SolutionGroup {
  feedback: FeedbackPeg[];
  solutions: Peg[][];
  count: number;
}

// Type for solution groups - can be either a SolutionGroup array or a 2D Peg array
export type SolutionGroupsType = SolutionGroup[] | Peg[][];

export interface GameState {
  secretCode: Peg[];
  board: GameBoard;
  gameMode: GameMode;
  gameRules: GameRules;
  gameOver: boolean;
  won: boolean;
}

export interface GameRules {
  codeLength: number;
  maxGuesses: number;
  availableColors: Peg[];
}

export interface GameBoard {
  guesses: {
    pegs: Peg[];
    feedback: FeedbackPeg[];
  }[];
}