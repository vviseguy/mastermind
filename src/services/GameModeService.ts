// import { FeedbackPegValue, GameMode, PegColor } from '../types/mastermind';
// import { 
//   evaluateGuess, 
//   getEvilFeedback, 
//   generateRandomCode,
//   areCodesEqual 
// } from '../utils/gameLogic';
// import { GameBoard } from '../models/GameBoard';
// import { Guess } from '../models/Guess';

// /**
//  * Service for handling mode-specific game logic
//  */
// export class GameModeService {
//   /**
//    * Handle feedback generation for normal mode
//    */
//   static handleNormalMode(guess: PegColor[], secretCode: PegColor[]): FeedbackPegValue[] {
//     return evaluateGuess(guess, secretCode);
//   }
  
//   /**
//    * Handle feedback generation for evil mode
//    */
//   static handleEvilMode(solutions: PegColor[][], guess: PegColor[]): { 
//     feedback: FeedbackPegValue[], 
//     remainingSolutions: PegColor[][] 
//   } {
//     return getEvilFeedback(solutions, guess);
//   }

//   /**
//    * Change the game mode of a game board
//    */
//   static changeGameMode(board: GameBoard, newMode: GameMode): GameBoard {
//     if (newMode === board.gameMode) {
//       return board;
//     }

//     // Special handling when switching to normal mode
//     if (newMode === 'normal' && board.gameMode !== 'normal') {
//       const filteredColors = board.availableColors.filter(c => c !== 'empty');
//       const randomColors = generateRandomCode(board.codeLength, filteredColors);
//       const secretCode = randomColors.map((color, id) => ({ color, id }));
      
//       // Update feedbacks for existing guesses based on new secret code
//       const updatedGuesses = board.guesses.map(guess => {
//         const guessColors = guess.toColorArray();
//         const feedback = evaluateGuess(guessColors, randomColors);
//         return guess.setFeedback(feedback);
//       });

//       return new GameBoard(
//         secretCode,
//         updatedGuesses,
//         newMode,
//         board.gameOver,
//         board.won,
//         board.possibleSolutions,
//         board.codeLength,
//         board.maxGuesses,
//         board.availableColors
//       );
//     }

//     // For switching to evil/explorer mode, just change the mode
//     // Actual evil mode behavior happens when guesses are submitted
//     return new GameBoard(
//       board.secretCode,
//       board.guesses,
//       newMode,
//       board.gameOver,
//       board.won,
//       board.possibleSolutions,
//       board.codeLength,
//       board.maxGuesses,
//       board.availableColors
//     );
//   }

//   /**
//    * Process a guess based on the current game mode
//    */
//   static processGuess(board: GameBoard, customFeedback?: FeedbackPegValue[]): GameBoard {
//     if (board.gameOver || !board.currentGuess.isComplete()) {
//       return board;
//     }

//     const guessColors = board.currentGuess.toColorArray();
//     let feedback: FeedbackPegValue[];
//     let newPossibleSolutions = [...board.possibleSolutions];
//     let isCorrect = false;
//     let updatedSecretCode = [...board.secretCode];

//     // Handle feedback differently based on game mode or if override is provided
//     if (customFeedback) {
//       feedback = customFeedback;
//       isCorrect = feedback.every(peg => peg === 'correct');
      
//       // If it's a winning guess in evil mode, set the secret code to match
//       if (isCorrect && board.gameMode === 'evil') {
//         updatedSecretCode = guessColors.map((color, id) => ({ color, id }));
//       }
//     } else if (board.gameMode === 'normal') {
//       // For normal mode, evaluate against the secret code
//       const secretColors = board.secretCode.map(peg => peg.color);
//       feedback = evaluateGuess(guessColors, secretColors);
//       isCorrect = areCodesEqual(guessColors, secretColors);
//     } else if (board.gameMode === 'evil') {
//       // For evil mode, choose the most difficult feedback
//       const { feedback: evilFeedback, remainingSolutions } = getEvilFeedback(
//         board.possibleSolutions, 
//         guessColors
//       );
//       feedback = evilFeedback;
//       newPossibleSolutions = remainingSolutions;
      
//       // If there's only one possible solution left, the player might have won
//       if (remainingSolutions.length === 1) {
//         const solutionColors = remainingSolutions[0];
//         isCorrect = areCodesEqual(guessColors, solutionColors);
        
//         if (isCorrect) {
//           updatedSecretCode = solutionColors.map((color, id) => ({ color, id }));
//         }
//       }
//     } else {
//       // Explorer mode - just add the guess with empty feedback
//       feedback = Array(board.codeLength).fill('empty');
//     }

//     // Set feedback for the current guess
//     const updatedGuesses = [...board.guesses];
//     const lastIndex = updatedGuesses.length - 1;
//     updatedGuesses[lastIndex] = updatedGuesses[lastIndex].setFeedback(feedback);
    
//     // Check if game is over
//     const isGameOver = isCorrect || updatedGuesses.length >= board.maxGuesses;
    
//     // For evil mode, if the game is over and not won, choose a valid secret code
//     if (isGameOver && !isCorrect && board.gameMode === 'evil' && newPossibleSolutions.length > 0) {
//       const evilSolutionColors = newPossibleSolutions[0];
//       updatedSecretCode = evilSolutionColors.map((color, id) => ({ color, id }));
//     }
    
//     // Add a new empty guess if game isn't over
//     if (!isGameOver) {
//       updatedGuesses.push(Guess.createEmpty(board.codeLength, updatedGuesses.length));
//     }

//     return new GameBoard(
//       updatedSecretCode,
//       updatedGuesses,
//       board.gameMode,
//       isGameOver,
//       isCorrect,
//       newPossibleSolutions,
//       board.codeLength,
//       board.maxGuesses,
//       board.availableColors
//     );
//   }
// } 