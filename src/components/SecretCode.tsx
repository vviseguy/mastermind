import React from 'react';
import { Peg as PegType } from '../types/mastermind';
import Peg from './Peg';

interface SecretCodeProps {
  secretCode: PegType[];
  isRevealed: boolean;
  codeLength: number;
}

const SecretCode: React.FC<SecretCodeProps> = ({
  secretCode,
  isRevealed,
  codeLength
}) => {
  // Create hidden or revealed pegs
  const pegsToDisplay = isRevealed 
    ? secretCode 
    : Array(codeLength).fill(null).map((_, i) => ({
        color: 'empty',
        id: i
      }));

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#333',
    borderRadius: '8px',
    marginBottom: '20px'
  };

  const labelStyle: React.CSSProperties = {
    color: 'white',
    marginRight: '10px',
    fontWeight: 'bold'
  };

  const pegContainerStyle: React.CSSProperties = {
    display: 'flex'
  };

  const coverStyle: React.CSSProperties = {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#111',
    margin: '4px',
    border: '1px solid #444',
    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.8)'
  };

  return (
    <div style={containerStyle} data-testid="secret-code">
      <div style={labelStyle}>Secret Code:</div>
      <div style={pegContainerStyle}>
        {pegsToDisplay.map((peg, index) => (
          isRevealed ? (
            <Peg key={`secret-${index}`} peg={peg} />
          ) : (
            <div key={`hidden-${index}`} style={coverStyle} />
          )
        ))}
      </div>
    </div>
  );
};

export default SecretCode; 