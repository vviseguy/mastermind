import React, { useState, useEffect, useRef } from 'react';
import { Peg, FeedbackPeg } from '../types/mastermind';
import GuessRow from './GuessRow';
import ColorSelector from './ColorSelector';
import GameControls from './GameControls';
import SecretCode from './SecretCode';
import SolutionExplorer from './SolutionExplorer';
import useMastermindGame from '../hooks/useMastermindGame';
import styles from './styles/Mastermind.module.css';
import layoutStyles from './styles/MastermindLayout.module.css';
import uiStyles from './styles/MastermindUI.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

// Custom type for our internal row representation
interface CustomGuessRow {
  id: number;
  pegs: Peg[];
  feedback: FeedbackPeg[];
}

const Mastermind: React.FC = () => {
  const {
    gameState,
    gameBoard,
    selectedColor,
    selectedFeedback,
    isDragMode,
    isExplorerActive,
    setSelectedColor,
    setSelectedFeedback,
    handlePegClick,
    handlePegDrop,
    startNewGame,
    changeMode,
    isCurrentGuessComplete,
    deleteGuess,
    handleApplySolutionFeedback,
    handleApplyGuess,
    toggleExplorerMode,
    submitGuess
  } = useMastermindGame();
  
  // State to track if a past guess was modified and needs recalculation
  const [modifiedGuessIndex] = useState<number | null>(null);
  
  // Ref to track the latest state for drag and drop operations
  const stateRef = useRef({
    gameState,
    isExplorerActive,
    modifiedGuessIndex
  });
  
  // Update ref whenever these values change
  useEffect(() => {
    stateRef.current = {
      gameState,
      isExplorerActive,
      modifiedGuessIndex
    };
  }, [gameState, isExplorerActive, modifiedGuessIndex]);

  // Reset explorer mode when starting a new game
  useEffect(() => {
    if (gameState.gameOver) {
      toggleExplorerMode();
    }
  }, [gameState.gameOver, toggleExplorerMode]);
  
  // In drag mode, clear the selected color
  useEffect(() => {
    if (isDragMode) {
      setSelectedColor(null);
      setSelectedFeedback(null);
    }
  }, [isDragMode, setSelectedColor, setSelectedFeedback]);

  // Handle a click on a peg in a guess
  const handleLocalPegClick = (rowIndex: number, pegIndex: number) => {
    if (!selectedColor) return;
    handlePegClick(rowIndex, pegIndex);
  };
  
  // Handle peg drop in drag and drop mode
  const handleLocalPegDrop = (guessIndex: number, pegIndex: number, color: string | Peg) => {
    // Convert the color value to PegColor
    const pegColor = String(color) as Peg;
    handlePegDrop(guessIndex, pegIndex, pegColor);
  };
  
  // Handle feedback peg drop in drag and drop mode
  const handleFeedbackPegDrop = (guessIndex: number, pegIndex: number, feedbackData: string | FeedbackPeg) => {
    // Convert the feedback value to FeedbackPegValue
    let feedback: FeedbackPeg;
    
    if (typeof feedbackData === 'string' && feedbackData.startsWith('feedback:')) {
      feedback = feedbackData.split(':')[1] as FeedbackPeg;
    } else {
      feedback = feedbackData as FeedbackPeg;
    }
    
    // In explorer mode, we can set the feedback pegs
    if (isExplorerActive && guessIndex < gameBoard.guesses.length) {
      // Create a new feedback array with the updated value at the specified index
      const newFeedback = [...gameBoard.guesses[guessIndex].feedback];
      newFeedback[pegIndex] = feedback;
      handleApplySolutionFeedback(newFeedback);
    }
  };

  const renderGuessRows = () => {
    // Show only the existing guesses - no separate current guess row
    return gameBoard.guesses.map((row, index) => {
      const isLastGuess = index === gameBoard.guesses.length - 1;
      // In explorer mode, all rows are editable
      // In normal modes, only the last guess is editable if it has no feedback
      const isEditable = (isLastGuess && !gameBoard.hasCurrentGuessFeedback && !gameState.gameOver) || isExplorerActive;
      const isDeletable = index < gameBoard.guesses.length - 1 || // Allow deleting previous guesses
                         (isLastGuess && gameBoard.hasCurrentGuessFeedback) || // Allow deleting last guess if it has feedback
                         (isLastGuess && !row.pegs.every(peg => peg === 'empty')); // Allow deleting if not empty
      
      const customRow: CustomGuessRow = {
        id: index,
        pegs: row.pegs,
        feedback: row.feedback
      };
      
      return (
        <GuessRow
          key={`guess-row-${index}`}
          row={customRow}
          isActive={isLastGuess || index === modifiedGuessIndex}
          isEditable={isEditable}
          codeLength={gameState.gameRules.codeLength}
          onPegClick={(pegIndex: number) => handleLocalPegClick(index, pegIndex)}
          onFeedbackPegClick={isExplorerActive && !isLastGuess ? 
            () => setSelectedFeedback(selectedFeedback || 'empty') : undefined}
          isExplorerMode={isExplorerActive}
          isDragMode={isDragMode}
          onDeleteRow={isDeletable ? () => deleteGuess(index) : undefined}
          isCurrentGuess={isLastGuess && !gameBoard.hasCurrentGuessFeedback}
          onPegDrop={(pegIndex: number, color: Peg) => handleLocalPegDrop(index, pegIndex, color)}
          onFeedbackPegDrop={isExplorerActive && (!isLastGuess || gameBoard.hasCurrentGuessFeedback) ? 
            (pegIndex: number, type: FeedbackPeg) => handleFeedbackPegDrop(index, pegIndex, type) : undefined}
        />
      );
    });
  };

  const renderGameMessage = () => {
    if (!gameState.gameOver) {
      return null;
    }

    return (
      <div className={gameState.won ? uiStyles.messageSuccess : uiStyles.messageError}>
        {gameState.won
          ? 'Congratulations! You cracked the code!'
          : 'Game Over! You ran out of guesses.'}
      </div>
    );
  };

  // Check if the code should be revealed (game over or a guess with all correct feedback)
  const isCodeRevealed = gameState.gameOver || gameBoard.guesses.some(guess => 
    guess.feedback.length === gameState.gameRules.codeLength && 
    guess.feedback.every(f => f === 'correct')
  );

  return (
    <div className={styles.mastermind}>
      <h1 className={layoutStyles.title}>Mastermind</h1>

      <div className={layoutStyles.board}>
        {/* Secret Code */}
        <SecretCode
          secretCode={gameState.secretCode}
          isRevealed={isCodeRevealed}
          codeLength={gameState.gameRules.codeLength}
        />

        {/* Game Message */}
        {renderGameMessage()}

        {/* Guesses */}
        <div className={layoutStyles.guessContainer}>
          {renderGuessRows()}
        </div>
        
        {/* Submit Button */}
        {!gameState.gameOver && !isExplorerActive && (
          <button 
            className={styles.submitButton}
            onClick={submitGuess}
            disabled={!isCurrentGuessComplete()}
            title={!isCurrentGuessComplete() ? "Complete your guess first" : "Submit your guess"}
          >
            <FontAwesomeIcon icon={faCheck} className={styles.buttonIcon} />
            <div className={styles.buttonContent}>
              <span className={styles.buttonValue}>Submit Guess</span>
            </div>
          </button>
        )}
        
        {/* Game Controls */}
        <GameControls
          onReset={startNewGame}
          onToggleMode={() => changeMode(gameState.gameMode === 'normal' ? 'evil' : 'normal')}
          onToggleExplorer={toggleExplorerMode}
          gameMode={gameState.gameMode}
          isExplorerActive={isExplorerActive}
          isGameOver={gameState.gameOver}
          hasWon={gameState.won}
        />

        {/* Solution Explorer */}
        {isExplorerActive && (
          <SolutionExplorer
            gameBoard={gameBoard}
            gameRules={gameState.gameRules}
            onSelectFeedback={handleApplySolutionFeedback}
            onSelectGuess={handleApplyGuess}
          />
        )}
      </div>
      
      {/* Color Selector */}
      <ColorSelector
        availableColors={gameState.gameRules.availableColors}
        onColorSelect={setSelectedColor}
        isDragMode={isDragMode}
        selectedColor={selectedColor}
      />
    </div>
  );
};

export default Mastermind; 