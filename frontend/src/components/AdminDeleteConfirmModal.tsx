import type React from 'react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  itemName: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  width: '100%',
  maxWidth: 440,
  padding: 24,
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
};

const btnCancelStyle: React.CSSProperties = {
  background: '#f0f0f0',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 600,
  color: '#555',
  cursor: 'pointer',
};

const btnConfirmStyle = (loading: boolean): React.CSSProperties => ({
  background: '#d32f2f',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 600,
  color: '#fff',
  cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.7 : 1,
});

export default function AdminDeleteConfirmModal({
  isOpen,
  title,
  message,
  itemName,
  confirmLabel = 'Delete Permanently',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>⚠️</div>
        <h3 style={{ margin: '0 0 8px', color: '#222', fontSize: '1.2rem' }}>{title}</h3>
        <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: 12 }}>{message}</p>
        <div
          style={{
            background: '#fff1f0',
            border: '1px solid #ffa39e',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#cf1322',
            fontWeight: 600,
            fontSize: '0.92rem',
            marginBottom: 20,
            wordBreak: 'break-word',
          }}
        >
          {itemName}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button style={btnCancelStyle} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button style={btnConfirmStyle(loading)} onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
