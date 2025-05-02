import React from 'react';
import { GameMode } from '../types/mastermind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUndo, faCheck, faRandom, faSearch, faDragon, faGamepad } from '@fortawesome/free-solid-svg-icons';
import styles from './styles/GameControls.module.css';

interface GameControlsProps {
  onNewGame: () => void;
  onCheckGuess: () => void;
  onChangeMode: (mode: GameMode) => void;
  onToggleExplorer: () => void;
  currentMode: GameMode;
  isExplorerActive: boolean;
  isGuessComplete: boolean;
  isGameOver: boolean;
  possibleSolutionsCount: number;
}

const GameControls: React.FC<GameControlsProps> = ({
  onNewGame,
  onCheckGuess,
  onChangeMode,
  onToggleExplorer,
  currentMode,
  isExplorerActive,
  isGuessComplete,
  isGameOver,
  possibleSolutionsCount
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.modeSelector}>
        <button 
          className={currentMode === 'normal' ? styles.modeButtonActive : styles.modeButtonInactive}
          onClick={() => onChangeMode('normal')}
          title="Normal Mastermind"
        >
          <FontAwesomeIcon icon={faGamepad} className={styles.iconMargin} />
          <span>Normal</span>
        </button>
        <button 
          className={currentMode === 'evil' ? styles.modeButtonActive : styles.modeButtonInactive}
          onClick={() => onChangeMode('evil')}
          title="Evil Mastermind"
        >
          <FontAwesomeIcon icon={faDragon} className={styles.iconMargin} />
          <span>Evil</span>
        </button>
      </div>
      
      <div className={styles.toggleContainer}>
        <button 
          className={isExplorerActive ? styles.toggleButtonActive : styles.toggleButtonInactive}
          onClick={onToggleExplorer}
          title="Toggle Explorer Mode"
        >
          <FontAwesomeIcon icon={faSearch} className={styles.iconMargin} />
          <span>Explorer {isExplorerActive ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className={styles.buttonRow}>
        <button
          className={styles.newGameButton}
          onClick={onNewGame}
          title="New Game"
        >
          <FontAwesomeIcon icon={faRandom} className={styles.iconMargin} />
          <span>New Game</span>
        </button>

        <button
          className={isGuessComplete && !isGameOver ? styles.checkButtonEnabled : styles.checkButtonDisabled}
          onClick={isGuessComplete && !isGameOver ? onCheckGuess : undefined}
          disabled={!isGuessComplete || isGameOver}
          title="Check Guess"
        >
          <FontAwesomeIcon icon={faCheck} className={styles.iconMargin} />
          <span>Check</span>
        </button>
      </div>
    </div>
  );
};

export default GameControls; 