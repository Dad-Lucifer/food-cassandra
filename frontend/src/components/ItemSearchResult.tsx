import type React from 'react';
import { Link } from 'react-router-dom';
import type { MenuItem, Restaurant } from '../types';

interface Props {
  item: MenuItem;
  restaurant: Restaurant;
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  padding: '14px 18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};

const leftStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: 1,
};

const itemNameStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '1rem',
  color: '#222',
};

const restaurantNameStyle: React.CSSProperties = {
  fontSize: '0.83rem',
  color: '#555',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
};

const badgeRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  marginTop: 2,
  flexWrap: 'wrap',
};

const categoryBadge: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  background: '#e8f5e9',
  color: '#2e7d32',
  borderRadius: 20,
  padding: '2px 8px',
};

const cityBadge: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  background: '#e3f2fd',
  color: '#1565c0',
  borderRadius: 20,
  padding: '2px 8px',
};

const rightStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 8,
  flexShrink: 0,
};

const priceStyle: React.CSSProperties = {
  fontWeight: 700,
  color: '#FF5733',
  fontSize: '1rem',
};

const btnStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#FF5733',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: '0.78rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

export default function ItemSearchResult({ item, restaurant }: Props) {
  return (
    <div style={cardStyle}>
      <div style={leftStyle}>
        <span style={itemNameStyle}>{item.item_name}</span>
        <span style={restaurantNameStyle}>🏪 {restaurant.name}</span>
        <div style={badgeRowStyle}>
          <span style={categoryBadge}>{item.category}</span>
          <span style={cityBadge}>📍 {restaurant.city}</span>
          <span style={{ ...categoryBadge, background: '#fff3e0', color: '#e65100' }}>
            ⭐ {Number(restaurant.rating || 0).toFixed(1)}
          </span>
        </div>
      </div>
      <div style={rightStyle}>
        <span style={priceStyle}>₹{parseFloat(String(item.price)).toFixed(2)}</span>
        <Link to={`/menu/${restaurant.restaurant_id}`} style={btnStyle}>
          View Menu →
        </Link>
      </div>
    </div>
  );
}
