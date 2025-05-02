import React, { useState, useMemo } from 'react';
import { FeedbackPegValue, PegColor, SolutionGroup } from '../types/mastermind';
import Peg from './Peg';
import { evaluateGuess, sortFeedback } from '../utils/gameLogic';
import styles from './styles/SolutionExplorer.module.css';

interface SolutionExplorerProps {
  solutionGroups: SolutionGroup[];
  totalSolutions: number;
  currentGuessGroups?: SolutionGroup[];
  onSelectFeedback?: (feedback: FeedbackPegValue[]) => void;
  onSelectGuess?: (guess: PegColor[]) => void;
  gameMode: 'normal' | 'evil' | 'explorer';
  isCurrentGuess: boolean;
  allPossibleGuesses?: PegColor[][];
}

enum TabType {
  Responses = 'responses',
  Guesses = 'guesses'
}

interface OptimalGuess {
  guess: PegColor[];
  maxGroupSize: number;
  distribution: { [key: string]: number };
}

const SolutionExplorer: React.FC<SolutionExplorerProps> = ({
  solutionGroups,
  totalSolutions,
  currentGuessGroups = [],
  onSelectFeedback,
  onSelectGuess,
  gameMode,
  isCurrentGuess,
  allPossibleGuesses = []
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.Guesses);
  
  // Use current guess groups when available and viewing current guess, otherwise use submitted guess groups
  const groupsToDisplay = isCurrentGuess && currentGuessGroups.length > 0 
    ? currentGuessGroups 
    : solutionGroups;
  
  // Calculate optimal guesses - those with the smallest maximum group size
  const optimalGuesses = useMemo(() => {
    // If we have solution groups, use their solutions as the foundation
    const possibleSolutions = solutionGroups.length > 0 && solutionGroups[0].solutions 
      ? solutionGroups[0].solutions 
      : [];
    
    // If no solutions (like on first turn), provide some standard first guesses
    if (possibleSolutions.length === 0) {
      // Standard first guesses for 4-peg Mastermind
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

    // For real game play, evaluate more guesses to find optimal ones
    // We'll take a sample of possible solutions to evaluate
    const solutionsToEvaluate = possibleSolutions.length <= 25 
      ? possibleSolutions 
      : possibleSolutions.slice(0, 25);
    
    const evaluatedGuesses: OptimalGuess[] = [];
    
    for (const candidateGuess of solutionsToEvaluate) {
      // Calculate how this guess would split the solution space
      const distribution: { [key: string]: number } = {};
      let maxGroupSize = 0;
      
      for (const solution of possibleSolutions) {
        // Use the proper evaluateGuess function for consistent results with the main game logic
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
    // This matches the Evil Mastermind's behavior, which picks the largest group
    return evaluatedGuesses
      .sort((a, b) => a.maxGroupSize - b.maxGroupSize)
      .slice(0, 5);
  }, [solutionGroups]);
  
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };
  
  const handleSelectFeedback = (feedback: FeedbackPegValue[]) => {
    if (onSelectFeedback) {
      onSelectFeedback(feedback);
    }
  };
  
  const handleSelectGuess = (guess: PegColor[]) => {
    if (onSelectGuess) {
      onSelectGuess(guess);
    }
  };
  
  const renderResponseTab = () => {
    if (groupsToDisplay.length === 0) {
      return <div>No response data available.</div>;
    }
    
    return (
      <div className={styles.groupsContainer}>
        {groupsToDisplay.map((group, index) => {
          return (
            <div key={`response-${index}`} className={styles.groupItem}>
              <div className={styles.feedbackContainer}>
                {group.feedback.map((type, idx) => (
                  <Peg
                    key={`fb-peg-${idx}`}
                    peg={{ color: 'empty', id: idx }}
                    pegSize="small"
                    isFeedbackPeg={true}
                    feedbackType={type}
                  />
                ))}
              </div>
              <div className={styles.solutionCount}>
                {group.count} solution{group.count !== 1 ? 's' : ''}
              </div>
              <button 
                className={styles.button}
                onClick={() => handleSelectFeedback(group.feedback)}
                title="Select this feedback pattern"
              >
                Select
              </button>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderGuessesTab = () => {
    if (optimalGuesses.length === 0) {
      return <div>No optimal guesses available.</div>;
    }
    
    return (
      <div>
        <div className={styles.groupsContainer}>
          {optimalGuesses.map((guessData, index) => (
            <div key={`guess-${index}`} className={styles.groupItem}>
              <div className={styles.guessContainer}>
                {guessData.guess.map((color, idx) => (
                  <Peg
                    key={`guess-peg-${idx}`}
                    peg={{ color, id: idx }}
                    pegSize="small"
                  />
                ))}
              </div>
              <div className={styles.maxGroupSize}>
                Max solutions: {guessData.maxGroupSize}
              </div>
              <div className={styles.solutionCount} title="This shows how many different feedback patterns are possible">
                {Object.values(guessData.distribution).length} feedback groups
              </div>
              <button 
                className={styles.button}
                onClick={() => handleSelectGuess(guessData.guess)}
              >
                Try
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Solution Explorer</h3>
        <span className={styles.countBadge}>{totalSolutions} possible</span>
      </div>
      
      <div className={styles.tabsContainer}>
        <div 
          className={activeTab === TabType.Guesses ? styles.tabActive : styles.tab}
          onClick={() => handleTabChange(TabType.Guesses)}
        >
          Guesses
        </div>
        <div 
          className={activeTab === TabType.Responses ? styles.tabActive : styles.tab}
          onClick={() => handleTabChange(TabType.Responses)}
        >
          Responses
        </div>
      </div>
      
      {activeTab === TabType.Responses ? renderResponseTab() : renderGuessesTab()}
    </div>
  );
};

export default SolutionExplorer; 