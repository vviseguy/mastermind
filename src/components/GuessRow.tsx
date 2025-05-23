import React from 'react';
import { FeedbackPeg as FeedbackPegType, Peg as PegType } from '../types/mastermind';
import PegComponent from './Peg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

// Extended GuessRow type for our component
interface CustomGuessRow {
  id: number;
  pegs: PegType[];
  feedback: FeedbackPegType[];
}

interface GuessRowProps {
  row: CustomGuessRow;
  isActive: boolean;
  isEditable: boolean;
  codeLength: number;
  onPegClick?: (pegIndex: number) => void;
  onFeedbackPegClick?: (pegIndex: number) => void;
  isExplorerMode: boolean;
  isDragMode?: boolean;
  onDeleteRow?: () => void;
  isCurrentGuess?: boolean;
  onPegDrop?: (pegIndex: number, color: PegType) => void;
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
  const guessDisplay = [...row.pegs];
  while (guessDisplay.length < codeLength) {
    guessDisplay.push('empty');
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
    padding: '6px',
    margin: '3px 0',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    position: 'relative',
    minHeight: '50px' // Ensure consistent height for centering
  };

  const guessContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    width: '100%', // Take full width to center properly
    position: 'relative',
    zIndex: 1 // Ensure guess pegs are above the background
  };

  const feedbackContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '1px',
    padding: '3px',
    backgroundColor: '#ddd',
    borderRadius: '4px',
    position: 'absolute',
    right: '5px',
    top: '50%',
    transform: 'translateY(-50%)',
    maxWidth: '34px',
    maxHeight: '34px',
    alignItems: 'center',
    justifyItems: 'center',
    zIndex: 2 // Ensure feedback container is above guess pegs
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
  const handlePegDrop = (index: number, event: React.DragEvent<HTMLDivElement>) => {
    if (!onPegDrop || (!isExplorerMode && !isEditable)) return;
    
    const data = event.dataTransfer.getData('text/plain');
    
    // Check if the dropped data is a feedback peg
    if (data.startsWith('feedback:')) return;
    
    // Validate that the color is a valid PegColor
    const validColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'empty'];
    if (!validColors.includes(data)) return;
    
    // Data is a regular color
    onPegDrop(index, data as PegType);
  };
  
  // Handle feedback peg drop for drag and drop mode
  const handleFeedbackPegDrop = (index: number, event: React.DragEvent<HTMLDivElement>) => {
    if (!onFeedbackPegDrop || !isFeedbackSelectable) return;
    
    const data = event.dataTransfer.getData('text/plain');
    
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

  console.log(row);

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
        {guessDisplay.map((pegColor, index) => (
          <PegComponent
            key={`peg-${index}`}
            color={pegColor}
            id={index}
            onClick={isSelectable && onPegClick ? () => onPegClick(index) : undefined}
            isActive={isActive}
            isSelectable={isSelectable}
            isDragMode={isDragMode}
            onDrop={isDragMode ? (event) => handlePegDrop(index, event) : undefined}
          />
        ))}
      </div>
      <div style={feedbackContainerStyle}>
        {feedbackDisplay.map((type, index) => (
          <PegComponent
            key={`feedback-${index}`}
            color="empty"
            id={index}
            onClick={isFeedbackSelectable && onFeedbackPegClick ? () => onFeedbackPegClick(index) : undefined}
            isSelectable={isFeedbackSelectable}
            isDragMode={isDragMode}
            onDrop={isDragMode && isFeedbackSelectable ? (event) => handleFeedbackPegDrop(index, event) : undefined}
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