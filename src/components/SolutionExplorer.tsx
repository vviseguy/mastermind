import React, { useState, useMemo } from 'react';
import { FeedbackPeg, GameBoard, GameRules, Peg } from '../types/mastermind';
import PegComponent from './Peg';
import styles from './styles/SolutionExplorer.module.css';
import { SolutionService } from '../services/SolutionService';

interface SolutionExplorerProps {
  gameBoard: GameBoard;
  gameRules: GameRules;
  onSelectFeedback?: (feedback: FeedbackPeg[]) => void;
  onSelectGuess?: (guess: Peg[]) => void;
}

enum TabType {
  Responses = 'responses',
  Guesses = 'guesses'
}

interface OptimalGuess {
  guess: Peg[];
  maxGroupSize: number;
  // distribution: { [key: string]: number };
}

const SolutionExplorer: React.FC<SolutionExplorerProps> = ({
  gameBoard,
  gameRules,
  onSelectFeedback,
  onSelectGuess,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.Guesses);


  
  // Calculate optimal guesses - those with the smallest maximum group size
  const [optimalGuesses, totalSolutions] = useMemo(() => {
    // If we have solution groups, use their solutions as the foundation
    const solutionService = SolutionService.create(gameRules);
    solutionService.processGuessSeries(
      gameBoard.guesses.filter(g => g.feedback.length > 0).map(g => g.pegs),
      gameBoard.guesses.filter(g => g.feedback.length > 0).map(g => g.feedback)
    );
    const possibleSolutions = solutionService.allSolutions;


    const currSolutionService = new SolutionService(possibleSolutions)
    const sortedGuesses:OptimalGuess[] = possibleSolutions
      .map(guess => ({
        guess,
        maxGroupSize: currSolutionService
          .getPossibleFeedbackPatterns(guess)
          .reduce((m, g) => Math.max(m, g.count), 0)
      }))
      .sort((a, b) =>
        a.maxGroupSize - b.maxGroupSize ||
        a.guess.join(' ').localeCompare(b.guess.join(' '))
      )
    
    // Sort by max group size (smallest first) - better guesses split solutions more evenly
    // This matches the Evil Mastermind's behavior, which picks the largest group
    return [sortedGuesses.slice(0, 12), possibleSolutions.length];
  }, [gameRules, gameBoard]);

  const normalizedGroups = useMemo(() => {
    const solutionService = SolutionService.create(gameRules);
    solutionService.processGuessSeries(
      gameBoard.guesses.filter(g => !g.pegs.includes('empty')).slice(0, -1).map(g => g.pegs),
      gameBoard.guesses.filter(g => !g.pegs.includes('empty')).slice(0, -1).map(g => g.feedback)
    );
    return solutionService
    .getPossibleFeedbackPatterns(gameBoard.guesses[gameBoard.guesses.length - 1].pegs)
    .sort((a, b) => b.count - a.count);
  }, [gameRules, gameBoard]);
  
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };
  
  const handleSelectFeedback = (feedback: FeedbackPeg[]) => {
    if (onSelectFeedback) {
      onSelectFeedback(feedback);
    }
  };
  
  const handleSelectGuess = (guess: Peg[]) => {
    if (onSelectGuess) {
      onSelectGuess(guess);
    }
  };
  
  const renderResponseTab = () => {
    if (normalizedGroups.length === 0) {
      return <div>No response data available.</div>;
    }
    
    return (
      <div className={styles.groupsContainer}>
        {normalizedGroups.map((group, index) => {
          return (
            <div key={`response-${index}`} className={styles.groupItem}>
              <div className={styles.feedbackContainer}>
                {group.feedback.map((type, idx) => (
                  <PegComponent
                    key={`fb-peg-${idx}`}
                    color="empty"
                    id={idx}
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
                  <PegComponent
                    key={`guess-peg-${idx}`}
                    color={color}
                    id={idx}
                    pegSize="small"
                  />
                ))}
              </div>
              <div className={styles.maxGroupSize}>
                Max solutions: {guessData.maxGroupSize}
              </div>
              <div className={styles.solutionCount} title="This shows how many different feedback patterns are possible">
                {/* {Object.values(guessData.distribution).length} feedback groups */}
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