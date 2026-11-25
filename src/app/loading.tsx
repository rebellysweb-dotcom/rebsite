import React from 'react';

export default function Loading() {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem'
      }}
    >
      <div className="flower-loader">
        <div className="petal-loader"></div>
        <div className="petal-loader"></div>
        <div className="petal-loader"></div>
        <div className="petal-loader"></div>
        <div className="petal-loader"></div>
        <div className="petal-loader"></div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p 
          style={{ 
            fontFamily: 'var(--ff-serif)', 
            color: 'var(--rose-700)', 
            fontSize: '1.4rem',
            letterSpacing: '0.08em',
            animation: 'pulseText 2s ease-in-out infinite',
            marginBottom: '0.5rem'
          }}
        >
          Blooming...
        </p>
        <p 
          style={{ 
            fontFamily: 'var(--ff-sans)', 
            color: 'var(--text-muted)', 
            fontSize: '0.85rem',
            letterSpacing: '0.02em',
            opacity: 0.7
          }}
        >
          Preparing your floral experience
        </p>
      </div>
    </div>
  );
}
