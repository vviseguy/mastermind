import React from 'react';
import { GuessRow as GuessRowType, Peg as PegType, FeedbackPegValue as FeedbackPegType, PegColor } from '../types/mastermind';
import Peg from './Peg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

interface GuessRowProps {
  row: GuessRowType;
  isActive: boolean;
  isEditable: boolean;
  codeLength: number;
  onPegClick?: (pegIndex: number) => void;
  onFeedbackPegClick?: (pegIndex: number) => void;
  isExplorerMode: boolean;
  isDragMode?: boolean;
  onDeleteRow?: () => void;
  isCurrentGuess?: boolean;
  onPegDrop?: (pegIndex: number, color: PegColor) => void;
  onFeedbackPegDrop?: (pegIndex: number, feedbackType: FeedbackPegType) => void;
}

const GuessRow: React.FC<GuessRowProps> = ({
  row,
  isActive,
  isEditable,
  codeLength,
  onPegClick,
  onFeedbackPegClick,
  isExplorerMode,
  isDragMode = false,
  onDeleteRow,
  isCurrentGuess = false,
  onPegDrop,
  onFeedbackPegDrop
}) => {
  // Create empty pegs if needed
  const guessDisplay = [...row.guess];
  while (guessDisplay.length < codeLength) {
    guessDisplay.push({ color: 'empty', id: guessDisplay.length });
  }

  // Create empty feedback if needed and ensure they're sorted (correct first, then wrongPosition)
  let feedbackDisplay: FeedbackPegType[] = [];
  
  if (row.feedback.length > 0) {
    // Sort feedback pegs: correct (black) first, then wrongPosition (white), then others
    const correctPegs = row.feedback.filter(peg => peg === 'correct');
    const wrongPositionPegs = row.feedback.filter(peg => peg === 'wrongPosition');
    const otherPegs = row.feedback.filter(peg => peg !== 'correct' && peg !== 'wrongPosition');
    
    feedbackDisplay = [...correctPegs, ...wrongPositionPegs, ...otherPegs];
  }
  
  // Ensure we have the right number of feedback pegs
  while (feedbackDisplay.length < codeLength) {
    feedbackDisplay.push('empty');
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isActive ? '#f5f5f5' : 'transparent',
    padding: '8px',
    margin: '4px 0',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    position: 'relative'
  };

  const guessContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    width: '180px' // Fixed width to ensure centering
  };

  const feedbackContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '2px',
    padding: '4px',
    backgroundColor: '#ddd',
    borderRadius: '4px',
    position: 'absolute',
    right: '10px'
  };

  const trashIconStyle: React.CSSProperties = {
    color: '#adb5bd', // More subtle grey color
    opacity: 0.5,
    cursor: 'pointer',
    position: 'absolute',
    left: '5px',
    fontSize: '14px',
    transition: 'all 0.2s',
    display: isCurrentGuess ? 'none' : 'block'
  };

  // In explorer mode, all pegs are selectable if the mode allows it
  const isSelectable = isExplorerMode || isEditable;
  
  // Are feedback pegs selectable
  const isFeedbackSelectable = isExplorerMode && !isCurrentGuess;

  // Handle peg drop for drag and drop mode
  const handlePegDrop = (index: number, data: string) => {
    if (!onPegDrop || (!isExplorerMode && !isEditable)) return;
    
    // Check if the dropped data is a feedback peg
    if (data.startsWith('feedback:')) return;
    
    // Data is a regular color
    onPegDrop(index, data as PegColor);
  };
  
  // Handle feedback peg drop for drag and drop mode
  const handleFeedbackPegDrop = (index: number, data: string) => {
    if (!onFeedbackPegDrop || !isFeedbackSelectable) return;
    
    // Handle feedback peg drops
    if (data.startsWith('feedback:')) {
      const feedbackType = data.split(':')[1] as FeedbackPegType;
      onFeedbackPegDrop(index, feedbackType);
    } 
    // Handle empty peg drops
    else if (data === 'empty') {
      onFeedbackPegDrop(index, 'empty');
    }
  };

  return (
    <div style={rowStyle} data-testid={`guess-row-${row.id}`}>
      {/* Delete Button */}
      {onDeleteRow && (
        <div 
          style={trashIconStyle} 
          onClick={onDeleteRow}
          className="delete-guess"
          title="Delete this guess"
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = '#dc3545';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = '0.5';
            e.currentTarget.style.color = '#adb5bd';
          }}
        >
          <FontAwesomeIcon icon={faTrash} />
        </div>
      )}

      <div style={guessContainerStyle}>
        {guessDisplay.map((peg, index) => (
          <Peg
            key={`peg-${index}`}
            peg={peg}
            onClick={isSelectable && onPegClick ? () => onPegClick(index) : undefined}
            isActive={isActive}
            isSelectable={isSelectable}
            isDragMode={isDragMode}
            onDrop={isDragMode ? (color) => handlePegDrop(index, color) : undefined}
          />
        ))}
      </div>
      
      <div style={feedbackContainerStyle}>
        {feedbackDisplay.map((type, index) => (
          <Peg
            key={`feedback-${index}`}
            peg={{ color: 'empty', id: 0 }}
            onClick={isFeedbackSelectable && onFeedbackPegClick ? () => onFeedbackPegClick(index) : undefined}
            isSelectable={isFeedbackSelectable}
            isDragMode={isDragMode}
            onDrop={isDragMode && isFeedbackSelectable ? (feedbackType) => handleFeedbackPegDrop(index, feedbackType) : undefined}
            pegSize="small"
            isFeedbackPeg={true}
            feedbackType={type}
          />
        ))}
      </div>
    </div>
  );
};

export default GuessRow; 