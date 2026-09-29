import type React from 'react';

const wrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 0',
  gap: 12,
  color: '#888',
};

const spinnerStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  border: '4px solid #f0f0f0',
  borderTop: '4px solid #FF5733',
  borderRadius: '50%',
  animation: 'spin 0.75s linear infinite',
};

export default function Loader({ message = 'Loading…' }: { message?: string }) {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={wrapStyle}>
        <div style={spinnerStyle} />
        <span style={{ fontSize: '0.9rem' }}>{message}</span>
      </div>
    </>
  );
}
