import type React from 'react';

const boxStyle: React.CSSProperties = {
  background: '#fff3f2',
  border: '1px solid #ffb3a7',
  borderRadius: 8,
  padding: '12px 16px',
  color: '#c0392b',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  marginTop: 12,
};

interface Props {
  message: string;
}

export default function ErrorMessage({ message }: Props) {
  return (
    <div style={boxStyle} role="alert">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}
