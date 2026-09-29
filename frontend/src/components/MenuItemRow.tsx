import type React from 'react';
import type { MenuItem } from '../types';

interface Props {
  item: MenuItem;
  checked: boolean;
  onToggle: (item: MenuItem) => void;
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 10,
  cursor: 'pointer',
};

const categoryBadge: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  background: '#e8f5e9',
  color: '#2e7d32',
  borderRadius: 20,
  padding: '2px 8px',
  marginLeft: 8,
  letterSpacing: '0.2px',
};

const priceStyle: React.CSSProperties = {
  fontWeight: 700,
  color: '#FF5733',
  fontSize: '0.95rem',
  minWidth: 60,
  textAlign: 'right',
};

export default function MenuItemRow({ item, checked, onToggle }: Props) {
  return (
    <label
      style={{
        ...rowStyle,
        background: checked ? '#fff8f7' : '#fff',
        borderColor: checked ? '#FF5733' : '#e8e8e8',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(item)}
          style={{ width: 16, height: 16, accentColor: '#FF5733', cursor: 'pointer' }}
        />
        <div>
          <span style={{ fontWeight: 500, color: '#222', fontSize: '0.95rem' }}>
            {item.item_name}
          </span>
          <span style={categoryBadge}>{item.category}</span>
        </div>
      </div>
      <span style={priceStyle}>₹{parseFloat(String(item.price)).toFixed(2)}</span>
    </label>
  );
}
