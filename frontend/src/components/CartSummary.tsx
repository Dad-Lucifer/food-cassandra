import type React from 'react';

interface Props {
  itemCount: number;
  total: number;
  onPlaceOrder: () => void;
  placing: boolean;
}

const barStyle: React.CSSProperties = {
  position: 'sticky',
  bottom: 0,
  background: '#fff',
  borderTop: '1px solid #e8e8e8',
  padding: '14px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
  borderRadius: '12px 12px 0 0',
  marginTop: 16,
};

const summaryStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? '#ccc' : '#FF5733',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 24px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '0.2px',
  };
}

export default function CartSummary({ itemCount, total, onPlaceOrder, placing }: Props) {
  const disabled = placing || itemCount === 0;
  return (
    <div style={barStyle}>
      <div style={summaryStyle}>
        <span style={{ fontSize: '0.82rem', color: '#888' }}>
          {itemCount} item{itemCount !== 1 ? 's' : ''} selected
        </span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#222' }}>
          Total: ₹{total.toFixed(2)}
        </span>
      </div>
      <button style={btnStyle(disabled)} onClick={onPlaceOrder} disabled={disabled}>
        {placing ? 'Placing…' : '🛒 Place Order'}
      </button>
    </div>
  );
}
