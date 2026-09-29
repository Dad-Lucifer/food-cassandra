import type React from 'react';
import { Link } from 'react-router-dom';
import type { Restaurant } from '../types';

interface Props {
  restaurant: Restaurant;
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const infoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#fff3e0',
  color: '#e65100',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: 20,
  padding: '2px 10px',
  letterSpacing: '0.3px',
};

const ratingStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#555',
  marginTop: 2,
};

const btnStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#FF5733',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: '0.85rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

export default function RestaurantCard({ restaurant }: Props) {
  return (
    <div style={cardStyle}>
      <div style={infoStyle}>
        <strong style={{ fontSize: '1rem', color: '#222' }}>{restaurant.name}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={badgeStyle}>{restaurant.cuisine}</span>
          <span style={ratingStyle}>⭐ {Number(restaurant.rating || 0).toFixed(1)}</span>
        </div>
      </div>
      <Link to={`/menu/${restaurant.restaurant_id}`} style={btnStyle}>
        View Menu →
      </Link>
    </div>
  );
}
