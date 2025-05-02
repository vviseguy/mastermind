import React from 'react';
import { FeedbackPegValue as FeedbackPegType } from '../types/mastermind';
import FeedbackPeg from './FeedbackPeg';

interface FeedbackSelectorProps {
  onSelectFeedback: (type: FeedbackPegType) => void;
  selectedFeedback: FeedbackPegType | null;
}

const FeedbackSelector: React.FC<FeedbackSelectorProps> = ({
  onSelectFeedback,
  selectedFeedback
}) => {
  const feedbackTypes: FeedbackPegType[] = ['correct', 'wrongPosition', 'incorrect'];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '10px',
    marginTop: '10px',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    maxWidth: '300px',
    margin: '10px auto'
  };

  const optionsContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '8px'
  };

  const infoTextStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#555',
    marginTop: '8px',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle} className="feedback-selector" data-testid="feedback-selector">
      <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
        Select Feedback Peg Type
      </div>
      
      <div style={optionsContainerStyle}>
        {feedbackTypes.map((type, index) => (
          <div key={`feedback-option-${index}`} style={{ margin: '0 5px' }}>
            <FeedbackPeg
              type={type}
              onClick={() => onSelectFeedback(type)}
              isActive={selectedFeedback === type}
              isSelectable={true}
            />
            <div style={{ fontSize: '10px', textAlign: 'center', marginTop: '2px' }}>
              {type === 'correct' ? 'Correct' : type === 'wrongPosition' ? 'Wrong Pos' : 'Incorrect'}
            </div>
          </div>
        ))}
      </div>
      
      <div style={infoTextStyle}>
        Click a feedback slot to add a feedback peg. Pegs are automatically arranged in standard Mastermind order (black first, then white).
      </div>
    </div>
  );
};

export default FeedbackSelector; 