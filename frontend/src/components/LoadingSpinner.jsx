import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="spinner-wrapper">
        <div className="spinner">
          <div className="spinner-circle"></div>
        </div>
        <p className="spinner-message">{message}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
