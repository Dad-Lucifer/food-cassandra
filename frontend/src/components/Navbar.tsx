import type React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 24px',
  background: '#FF5733',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
};

const brandStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '1.3rem',
  fontWeight: 700,
  textDecoration: 'none',
  letterSpacing: '-0.3px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const linksStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
};

function NavLink({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));
  return (
    <Link
      to={to}
      style={{
        color: active ? '#fff' : 'rgba(255,255,255,0.75)',
        textDecoration: 'none',
        fontWeight: active ? 600 : 400,
        fontSize: '0.95rem',
        borderBottom: active ? '2px solid #fff' : '2px solid transparent',
        paddingBottom: 2,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  return (
    <nav style={navStyle}>
      <Link to="/" style={brandStyle}>
        🍔 ShopRaja Foods
      </Link>
      <div style={linksStyle}>
        <NavLink to="/" label="Restaurants" />
        <NavLink to="/search" label="🔍 Find Dish" />
        <NavLink to="/orders" label="Order History" />
        <NavLink to="/admin" label="🛡️ Admin" />
        <NavLink to="/workflow" label="🔄 Workflow" />
      </div>
    </nav>
  );
}
