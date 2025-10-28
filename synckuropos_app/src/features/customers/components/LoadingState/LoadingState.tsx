import React from 'react';
import './LoadingState.css';

const LoadingState: React.FC = () => {
  return (
    <div className="customers-loading">
      <div className="loading-spinner">🔄</div>
      <p>Cargando clientes...</p>
    </div>
  );
};

export default LoadingState;