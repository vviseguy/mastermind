import React from 'react';
import styles from './styles/GameControls.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDragon, faChessBoard, faRotateRight, faEye, faEyeSlash, faLightbulb } from '@fortawesome/free-solid-svg-icons';

interface GameControlsProps {
  onReset: () => void;
  onToggleMode: () => void;
  onToggleExplorer: () => void;
  gameMode: 'normal' | 'evil' | 'explorer';
  isExplorerActive: boolean;
  isGameOver: boolean;
  hasWon: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  onReset,
  onToggleMode,
  onToggleExplorer,
  gameMode,
  isExplorerActive,
  isGameOver,
  hasWon
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.controlsHeader}>
        <h3>Game Controls</h3>
      </div>
      
      <div className={styles.controlsGrid}>
        <button 
          className={`${styles.controlButton} ${styles.newGameButton}`}
          onClick={onReset}
          title="Start a new game"
        >
          <FontAwesomeIcon icon={faRotateRight} className={styles.buttonIcon} />
          <div className={styles.buttonContent}>
            <span className={styles.buttonValue}>New Game</span>
          </div>
        </button>
        
        <button 
          className={`${styles.controlButton} ${gameMode === 'evil' ? styles.evilModeButton : styles.normalModeButton}`}
          onClick={onToggleMode}
          title={gameMode === 'normal' ? 'Switch to Evil Mastermind' : 'Switch to Normal Mode'}
        >
          <FontAwesomeIcon 
            icon={gameMode === 'evil' ? faDragon : faChessBoard} 
            className={styles.buttonIcon} 
          />
          <div className={styles.buttonContent}>
            <span className={styles.buttonLabel}>Mode</span>
            <span className={styles.buttonValue}>{gameMode === 'evil' ? 'Evil' : 'Normal'}</span>
          </div>
        </button>
        
        <button 
          className={`${styles.controlButton} ${isExplorerActive ? styles.explorerActiveButton : styles.explorerInactiveButton}`}
          onClick={onToggleExplorer}
          title={isExplorerActive ? 'Hide Solution Explorer' : 'Show Solution Explorer'}
        >
          <FontAwesomeIcon 
            icon={isExplorerActive ? faLightbulb : faEye} 
            className={styles.buttonIcon} 
          />
          <div className={styles.buttonContent}>
            <span className={styles.buttonLabel}>Explorer</span>
            <span className={styles.buttonValue}>{isExplorerActive ? 'Active' : 'Hidden'}</span>
          </div>
        </button>
      </div>
      
      {isGameOver && (
        <div className={`${styles.gameOverMessage} ${hasWon ? styles.winMessage : styles.loseMessage}`}>
          {hasWon ? 'You won!' : 'Game over!'}
        </div>
      )}
    </div>
  );
};

export default GameControls; 