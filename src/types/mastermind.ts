// Color options for the game
export type PegColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'empty';

// Feedback types
export type FeedbackPegValue = 'correct' | 'wrongPosition' | 'incorrect' | 'empty';

// A single peg in a code
export interface Peg {
  color: PegColor;
  id: number;
}

// A row representing a guess and its feedback
export interface GuessRow {
  guess: Peg[];
  feedback: FeedbackPegValue[];
  id: number;
}

// Game modes
export type GameMode = 'normal' | 'evil' | 'explorer';

// Game state
export interface GameState {
  secretCode: Peg[];
  guesses: GuessRow[];
  currentGuess: Peg[];
  gameMode: GameMode;
  codeLength: number;
  maxGuesses: number;
  availableColors: PegColor[];
  gameOver: boolean;
  won: boolean;
  possibleSolutions: PegColor[][];
  possibleSolutionsCount: number;
}

// Possible groups of solutions in Evil mode
export interface SolutionGroup {
  feedback: FeedbackPegValue[];
  solutions: PegColor[][];
  count: number;
} 