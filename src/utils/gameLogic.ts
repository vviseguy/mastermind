import { FeedbackPegValue, PegColor, SolutionGroup } from '../types/mastermind';

// Helper function to sort feedback pegs consistently
export const sortFeedback = (feedback: FeedbackPegValue[]): FeedbackPegValue[] => {
  const correctPegs = feedback.filter(peg => peg === 'correct');
  const wrongPositionPegs = feedback.filter(peg => peg === 'wrongPosition');
  const incorrectPegs = feedback.filter(peg => peg === 'incorrect');
  const emptyPegs = feedback.filter(peg => peg === 'empty');
  
  return [...correctPegs, ...wrongPositionPegs, ...incorrectPegs, ...emptyPegs];
};

// Generate a random code
export const generateRandomCode = (codeLength: number, availableColors: PegColor[]): PegColor[] => {
  const code: PegColor[] = [];
  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * (availableColors.length - 1)); // -1 to exclude 'empty'
    code.push(availableColors[randomIndex]);
  }
  return code;
};

// Check if two color arrays are the same
export const areCodesEqual = (code1: PegColor[], code2: PegColor[]): boolean => {
  if (code1.length !== code2.length) return false;
  
  for (let i = 0; i < code1.length; i++) {
    if (code1[i] !== code2[i]) return false;
  }
  
  return true;
};

// Evaluate a guess against a code
export const evaluateGuess = (guess: PegColor[], code: PegColor[]): FeedbackPegValue[] => {
  const feedback: FeedbackPegValue[] = [];
  const codeTemp = [...code];
  const guessTemp = [...guess];
  
  // First find correct positions
  for (let i = 0; i < guessTemp.length; i++) {
    if (guessTemp[i] === codeTemp[i]) {
      feedback.push('correct');
      // Use a special marker that can't be in the original colors
      codeTemp[i] = 'used' as unknown as PegColor;
      guessTemp[i] = 'checked' as unknown as PegColor;
    }
  }
  
  // Then find wrong positions
  for (let i = 0; i < guessTemp.length; i++) {
    if (guessTemp[i] !== ('checked' as unknown as PegColor)) {
      const index = codeTemp.findIndex(c => c === guessTemp[i]);
      if (index !== -1) {
        feedback.push('wrongPosition');
        codeTemp[index] = 'used' as unknown as PegColor;
      } else {
        // This color doesn't exist in the code (or all occurrences have been used)
        feedback.push('incorrect');
      }
    }
  }
  
  // Sort feedback to ensure consistent order
  return sortFeedback(feedback);
};

// Generate all possible color combinations
export const generateAllPossibleCodes = (codeLength: number, availableColors: PegColor[]): PegColor[][] => {
  const colors = availableColors.filter(color => color !== 'empty');
  const result: PegColor[][] = [];
  
  const generateCombinations = (current: PegColor[] = [], depth: number = 0) => {
    if (depth === codeLength) {
      result.push([...current]);
      return;
    }
    
    for (const color of colors) {
      current[depth] = color;
      generateCombinations(current, depth + 1);
    }
  };
  
  generateCombinations();
  return result;
};

// Filter solutions based on a guess and its feedback
export const filterSolutions = (
  solutions: PegColor[][], 
  guess: PegColor[], 
  feedback: FeedbackPegValue[] | FeedbackPegValue
): PegColor[][] => {
  // Ensure feedback is an array
  const feedbackArray = Array.isArray(feedback) ? feedback : [feedback];
  
  // Count the feedback types
  const feedbackCounts = {
    correct: feedbackArray.filter(peg => peg === 'correct').length,
    wrongPosition: feedbackArray.filter(peg => peg === 'wrongPosition').length,
    incorrect: feedbackArray.filter(peg => peg === 'incorrect').length,
    empty: feedbackArray.filter(peg => peg === 'empty').length
  };
  
  return solutions.filter(solution => {
    const evaluatedFeedback = evaluateGuess(guess, solution);
    
    // Count the evaluated feedback types
    const evaluatedCounts = {
      correct: evaluatedFeedback.filter(peg => peg === 'correct').length,
      wrongPosition: evaluatedFeedback.filter(peg => peg === 'wrongPosition').length,
      incorrect: evaluatedFeedback.filter(peg => peg === 'incorrect').length,
      empty: evaluatedFeedback.filter(peg => peg === 'empty').length
    };
    
    // Check if the counts match
    return feedbackCounts.correct === evaluatedCounts.correct &&
           feedbackCounts.wrongPosition === evaluatedCounts.wrongPosition &&
           feedbackCounts.incorrect === evaluatedCounts.incorrect &&
           feedbackCounts.empty === evaluatedCounts.empty;
  });
};

// Group solutions by possible feedback
export const groupSolutionsByFeedback = (
  solutions: PegColor[][], 
  guess: PegColor[]
): SolutionGroup[] => {
  const groups: Record<string, SolutionGroup> = {};
  
  solutions.forEach(solution => {
    const feedback = evaluateGuess(guess, solution);
    const sortedFeedback = sortFeedback(feedback);
    const feedbackKey = sortedFeedback.join(',');
    
    if (!groups[feedbackKey]) {
      groups[feedbackKey] = {
        feedback: sortedFeedback,
        solutions: [],
        count: 0
      };
    }
    
    groups[feedbackKey].solutions.push(solution);
    groups[feedbackKey].count++;
  });
  
  return Object.values(groups).sort((a, b) => b.count - a.count);
};

// Get the evil feedback for a guess (the one that preserves the most possible solutions)
export const getEvilFeedback = (
  solutions: PegColor[][], 
  guess: PegColor[]
): { feedback: FeedbackPegValue[], remainingSolutions: PegColor[][] } => {
  const groups = groupSolutionsByFeedback(solutions, guess);
  
  if (groups.length === 0) {
    return {
      feedback: Array(guess.length).fill('incorrect'),
      remainingSolutions: []
    };
  }
  
  return {
    feedback: groups[0].feedback,
    remainingSolutions: groups[0].solutions
  };
};

// Calculate all possible solutions given a series of guesses and their feedback
export const calculatePossibleSolutions = (
  guesses: { guess: PegColor[], feedback: FeedbackPegValue[] }[],
  codeLength: number,
  availableColors: PegColor[]
): PegColor[][] => {
  // Start with all possible codes
  const allCodes = generateAllPossibleCodes(codeLength, availableColors.filter(c => c !== 'empty'));
  
  // No guesses means all codes are possible
  if (guesses.length === 0) {
    return allCodes;
  }
  
  // Filter solutions based on each guess and its feedback
  return guesses.reduce((solutions, { guess, feedback }) => {
    // Skip guesses with empty feedback
    if (feedback.every(peg => peg === 'empty')) {
      return solutions;
    }
    
    return filterSolutions(solutions, guess, feedback);
  }, allCodes);
}; 