import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import './ErrorAlert.css';

function ErrorAlert({ error, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="error-alert">
      <div className="alert-content">
        <AlertCircle size={24} />
        <div className="alert-text">
          <h4>{error.title}</h4>
          <p>{error.message}</p>
        </div>
        <button className="alert-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

export default ErrorAlert;
