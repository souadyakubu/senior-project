import React from 'react';

const SelectionPopup = ({ position, onModernize }) => {
    console.log('SelectionPopup rendering with position:', position);  
  
    // Don't render if no position is provided
  if (!position) return null;

  // Calculate popup position
  const style = {
    position: 'absolute',
    top: `${position.top - 40}px`, // Position above the selection
    left: `${position.left}px`,
    zIndex: 1000,
  };

  return (
    <div className="selection-popup" style={style}>
      <button
        className="modernize-selection-button"
        onClick={onModernize}
      >
        Modernize Selection
      </button>
    </div>
  );
};

export default SelectionPopup;