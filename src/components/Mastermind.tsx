import React, { useState, useEffect, useRef } from 'react';
import { GuessRow as GuessRowType, PegColor, FeedbackPegValue, Peg as PegType } from '../types/mastermind';
import GuessRow from './GuessRow';
import ColorSelector from './ColorSelector';
import GameControls from './GameControls';
import SecretCode from './SecretCode';
import SolutionExplorer from './SolutionExplorer';
import useMastermindGame from '../hooks/useMastermindGame';
import styles from './styles/Mastermind.module.css';
import layoutStyles from './styles/MastermindLayout.module.css';
import uiStyles from './styles/MastermindUI.module.css';

const Mastermind: React.FC = () => {
  const {
    gameState,
    gameBoard,
    selectedColor,
    selectedFeedback,
    activePegIndex,
    solutionGroups,
    setSelectedColor,
    setSelectedFeedback,
    setCurrentGuessPeg,
    setFeedbackPeg,
    submitGuess,
    startNewGame,
    changeMode,
    isCurrentGuessComplete,
    modifyPastGuess,
    recalculateAfterGuessChange,
    updateSolutionGroups,
    deleteGuess,
    predictFeedback,
    handleApplySolutionFeedback,
    handleApplyGuess,
    pushGuess,
    pushResponse,
    toggleDragMode,
    toggleExplorerMode,
    isDragMode,
    isExplorerActive,
    currentGuessSolutionGroups
  } = useMastermindGame();
  
  // State to track if a past guess was modified and needs recalculation
  const [modifiedGuessIndex, setModifiedGuessIndex] = useState<number | null>(null);
  
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
  
  // Update solution groups when the component mounts or when guesses change
  useEffect(() => {
    if (gameState.guesses.length > 0) {
      updateSolutionGroups();
    }
  }, [gameState.guesses, updateSolutionGroups]);

  // Update solution groups when game mode changes
  useEffect(() => {
    if (gameState.guesses.length > 0) {
      updateSolutionGroups();
    }
  }, [gameState.gameMode, updateSolutionGroups]);

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
  
  // Update solution groups for current unsubmitted guess when it changes
  useEffect(() => {
    if (isExplorerActive && isCurrentGuessComplete() && !gameState.gameOver) {
      const groups = predictFeedback(gameState.currentGuess.map(peg => peg.color));
      // This is just for UI display, existing state is already updated via the hook
    }
  }, [gameState.currentGuess, gameState.gameOver, isCurrentGuessComplete, isExplorerActive, predictFeedback]);

  // Handle a click on a peg in a guess
  const handlePegClick = (rowIndex: number, pegIndex: number) => {
    if (!selectedColor) return;
    
    if (rowIndex === gameState.guesses.length - 1 && !gameBoard.hasCurrentGuessFeedback) {
      // It's the current guess (last guess without feedback) - update directly with new color
      setCurrentGuessPeg(pegIndex, selectedColor);
    } else if (isExplorerActive) {
      // It's a past guess in explorer mode
      modifyPastGuess(rowIndex, pegIndex, selectedColor);
      setModifiedGuessIndex(rowIndex);
    }
  };
  
  // Handle peg drop in drag and drop mode
  const handlePegDrop = (guessIndex: number, pegIndex: number, color: string | PegColor) => {
    // Convert the color value to PegColor
    const pegColor = String(color) as PegColor;
    
    if (guessIndex === gameState.guesses.length - 1 && !gameBoard.hasCurrentGuessFeedback) {
      // It's the current guess (last guess without feedback) - update directly
      setCurrentGuessPeg(pegIndex, pegColor);
    } else if (isExplorerActive && guessIndex < gameState.guesses.length) {
      // It's a past guess in explorer mode
      modifyPastGuess(guessIndex, pegIndex, pegColor);
      setModifiedGuessIndex(guessIndex);
    }
  };
  
  // Handle feedback peg drop in drag and drop mode
  const handleFeedbackPegDrop = (guessIndex: number, pegIndex: number, feedbackData: string | FeedbackPegValue) => {
    // Convert the feedback value to FeedbackPegValue
    let feedback: FeedbackPegValue;
    
    if (typeof feedbackData === 'string' && feedbackData.startsWith('feedback:')) {
      feedback = feedbackData.split(':')[1] as FeedbackPegValue;
    } else {
      feedback = feedbackData as FeedbackPegValue;
    }
    
    // In explorer mode, we can set the feedback pegs
    if (isExplorerActive && guessIndex < gameState.guesses.length) {
      // Get the current feedback for this guess
      const currentFeedback = [...gameState.guesses[guessIndex].feedback];
      let newFeedback = [...currentFeedback];
      
      // In explorer mode, feedback is represented by counts, not positions
      // So we need to add/remove feedback pegs and re-sort them
      if (pegIndex < newFeedback.length) {
        // Remove the old value first
        newFeedback.splice(pegIndex, 1);
      }
      
      // Add the new feedback value
      newFeedback.push(feedback);
      
      // Sort and ensure we don't exceed the code length
      const sortedFeedback = newFeedback.sort((a, b) => {
        const order = { 'correct': 0, 'wrongPosition': 1, 'incorrect': 2, 'empty': 3 };
        return order[a] - order[b];
      }).slice(0, gameState.codeLength);
      
      // Use pushResponse to ensure consistent behavior with overriding
      pushResponse(sortedFeedback, guessIndex);
      
      // Since we're directly modifying a past guess, mark it as modified
      setModifiedGuessIndex(guessIndex);
    }
  };
  
  // Handle confirmation after modifying a past guess
  const handleConfirmGuessChange = () => {
    if (modifiedGuessIndex !== null) {
      recalculateAfterGuessChange(modifiedGuessIndex);
      setModifiedGuessIndex(null);
    }
  };
  
  // Handle deleting a guess
  const handleDeleteGuess = (guessIndex: number) => {
    deleteGuess(guessIndex);
    if (modifiedGuessIndex === guessIndex) {
      setModifiedGuessIndex(null);
    } else if (modifiedGuessIndex !== null && modifiedGuessIndex > guessIndex) {
      setModifiedGuessIndex(modifiedGuessIndex - 1);
    }
  };

  const renderGuessRows = () => {
    // Show only the existing guesses - no separate current guess row
    return gameState.guesses.map((row, index) => {
      const isLastGuess = index === gameState.guesses.length - 1;
      // In explorer mode, all rows are editable
      // In normal modes, only the last guess is editable if it has no feedback
      const isEditable = (isLastGuess && !gameBoard.hasCurrentGuessFeedback && !gameState.gameOver) || isExplorerActive;
      const isDeletable = index < gameState.guesses.length - 1 || // Allow deleting previous guesses
                         (isLastGuess && gameBoard.hasCurrentGuessFeedback) || // Allow deleting last guess if it has feedback
                         (isLastGuess && !guessIsEmpty(row.guess)); // Allow deleting if not empty
      
      return (
        <GuessRow
          key={`guess-row-${row.id}`}
          row={row}
          isActive={isLastGuess || index === modifiedGuessIndex}
          isEditable={isEditable}
          codeLength={gameState.codeLength}
          onPegClick={(pegIndex: number) => handlePegClick(index, pegIndex)}
          onFeedbackPegClick={isExplorerActive && !isLastGuess ? 
            (pegIndex: number) => setFeedbackPeg(index, pegIndex, selectedFeedback || 'empty') : undefined}
          isExplorerMode={isExplorerActive}
          isDragMode={isDragMode}
          onDeleteRow={isDeletable ? () => handleDeleteGuess(index) : undefined}
          isCurrentGuess={isLastGuess && !gameBoard.hasCurrentGuessFeedback}
          onPegDrop={(pegIndex: number, color: PegColor) => handlePegDrop(index, pegIndex, color)}
          onFeedbackPegDrop={isExplorerActive && (!isLastGuess || gameBoard.hasCurrentGuessFeedback) ? 
            (pegIndex: number, type: FeedbackPegValue) => handleFeedbackPegDrop(index, pegIndex, type) : undefined}
        />
      );
    });
  };

  // Helper function to check if a guess is empty
  const guessIsEmpty = (guess: PegType[]) => {
    return guess.every(peg => peg.color === 'empty');
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

  // Determine when to show solution explorer - Whenever explorer mode is active
  const shouldShowSolutionExplorer = () => {
    return isExplorerActive;
  };

  return (
    <div className={styles.mastermind}>
      <h1 className={layoutStyles.title}>Mastermind</h1>

      <div className={layoutStyles.board}>
        {/* Secret Code */}
        <SecretCode
          secretCode={gameState.secretCode}
          isRevealed={gameState.gameOver}
          codeLength={gameState.codeLength}
        />

        {/* Game Message */}
        {renderGameMessage()}

        {/* Guesses */}
        <div className={layoutStyles.guessContainer}>
          {renderGuessRows()}
        </div>
        
        {/* Show confirmation button when a past guess is modified */}
        {modifiedGuessIndex !== null && (
          <button 
            className={uiStyles.confirmButton}
            onClick={handleConfirmGuessChange}
          >
            Confirm Changes & Recalculate
          </button>
        )}
        
        {/* Game Controls */}
        <GameControls
          onNewGame={startNewGame}
          onCheckGuess={() => {
            if (isCurrentGuessComplete() && !gameState.gameOver) {
              submitGuess();
              
              // Ensure solution groups are updated after submitting a guess
              if (isExplorerActive) {
                updateSolutionGroups();
              }
            }
          }}
          onChangeMode={changeMode}
          onToggleExplorer={toggleExplorerMode}
          currentMode={gameState.gameMode}
          isExplorerActive={isExplorerActive}
          isGuessComplete={isCurrentGuessComplete()}
          isGameOver={gameState.gameOver}
          possibleSolutionsCount={gameState.possibleSolutionsCount}
        />

        {/* Unified Solution Explorer */}
        {shouldShowSolutionExplorer() && (
          <SolutionExplorer
            solutionGroups={solutionGroups}
            currentGuessGroups={currentGuessSolutionGroups}
            totalSolutions={gameState.possibleSolutionsCount}
            onSelectFeedback={handleApplySolutionFeedback}
            onSelectGuess={handleApplyGuess}
            gameMode={gameState.gameMode}
            isCurrentGuess={isCurrentGuessComplete() && !gameState.gameOver}
          />
        )}
      </div>
      
      {/* Color Selector (floating on the side) */}
      <ColorSelector
        availableColors={gameState.availableColors}
        onSelectColor={setSelectedColor}
        selectedColor={selectedColor}
        isDragMode={isDragMode}
        onToggleDragMode={toggleDragMode}
        isExplorerMode={isExplorerActive}
        selectedFeedback={selectedFeedback}
        onSelectFeedback={setSelectedFeedback}
      />
    </div>
  );
};

export default Mastermind; 