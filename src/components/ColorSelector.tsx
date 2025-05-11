import React from 'react';
import { Peg as PegType } from '../types/mastermind';
import PegComponent from './Peg';
import styles from './styles/ColorSelector.module.css';

interface ColorSelectorProps {
  availableColors: PegType[];
  onColorSelect: (color: PegType) => void;
  isDragMode: boolean;
  selectedColor?: PegType | null;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  availableColors,
  onColorSelect,
  isDragMode,
  selectedColor
}) => {
  const handleColorClick = (color: PegType) => {
    onColorSelect(color);
  };

  return (
    <div className={styles.container}>
      <div className={styles.colorGrid}>
        {availableColors.map((color) => (
          <div
            key={color}
            className={styles.colorCell}
            onClick={() => handleColorClick(color)}
            title={`Select ${color}`}
          >
            <PegComponent
              color={color}
              pegSize="medium"
              isDraggable={isDragMode}
              isSelectable={true}
              isActive={selectedColor === color}
              isPalettePeg={true}
              onClick={() => handleColorClick(color)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorSelector; 