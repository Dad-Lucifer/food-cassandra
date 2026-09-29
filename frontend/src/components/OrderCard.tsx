import type React from 'react';
import type { Order } from '../types';

interface Props {
  order: Order;
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 10,
};

const idStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, Consolas, monospace',
  fontSize: '0.78rem',
  color: '#555',
  background: '#f4f4f4',
  borderRadius: 4,
  padding: '2px 6px',
};

interface BadgeColors {
  bg: string;
  text: string;
}

const STATUS_COLORS: Record<string, BadgeColors> = {
  PLACED: { bg: '#e3f2fd', text: '#1565c0' },
  DELIVERED: { bg: '#e8f5e9', text: '#2e7d32' },
  CANCELLED: { bg: '#fce4ec', text: '#c62828' },
};

function StatusBadge({ status }: { status: string }) {
  const c: BadgeColors = STATUS_COLORS[status] ?? { bg: '#f5f5f5', text: '#555' };
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        borderRadius: 20,
        padding: '2px 10px',
        fontSize: '0.78rem',
        fontWeight: 700,
        letterSpacing: '0.4px',
      }}
    >
      {status}
    </span>
  );
}

export default function OrderCard({ order }: Props) {
  const shortId = String(order.order_id).slice(0, 8) + '…';
  return (
    <div style={rowStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={idStyle} title={order.order_id}>
          {shortId}
        </span>
        <StatusBadge status={order.status} />
      </div>
      <span style={{ fontWeight: 700, color: '#FF5733', fontSize: '0.95rem' }}>
        ₹{parseFloat(String(order.total)).toFixed(2)}
      </span>
    </div>
  );
}
