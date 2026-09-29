import type React from 'react';
import type { ClusterInfo } from '../types';

interface Props {
  cluster: ClusterInfo | null;
  loading: boolean;
  onRefresh: () => void;
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  padding: '18px 20px',
  marginBottom: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 14,
  flexWrap: 'wrap',
  gap: 10,
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: '#222',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const refreshBtnStyle = (loading: boolean): React.CSSProperties => ({
  background: '#f4f4f4',
  border: '1px solid #ddd',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  color: '#444',
});

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: 12,
};

const nodeCardStyle = (isUp: boolean): React.CSSProperties => ({
  background: isUp ? '#f6fff8' : '#fff5f5',
  border: `1px solid ${isUp ? '#b7eb8f' : '#ffa39e'}`,
  borderRadius: 8,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

const nodeTitleStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 700,
  color: '#333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const badgeStyle = (isUp: boolean): React.CSSProperties => ({
  background: isUp ? '#52c41a' : '#f5222d',
  color: '#fff',
  fontSize: '0.72rem',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const metaStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#666',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const infoBadgeRow: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  fontSize: '0.8rem',
  color: '#555',
  background: '#fafafa',
  padding: '8px 12px',
  borderRadius: 8,
  marginBottom: 14,
  border: '1px solid #f0f0f0',
};

export default function AdminClusterStats({ cluster, loading, onRefresh }: Props) {
  if (!cluster) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>⚡ Apache Cassandra 3-Node Cluster</span>
          <button style={refreshBtnStyle(loading)} onClick={onRefresh} disabled={loading}>
            {loading ? 'Checking...' : '🔄 Check Cluster'}
          </button>
        </div>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>Cluster telemetry loading...</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>
          <span>⚡ Apache Cassandra 3-Node Cluster</span>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 12,
              background: cluster.upCount === cluster.nodeCount ? '#e6f7ff' : '#fff1f0',
              color: cluster.upCount === cluster.nodeCount ? '#1890ff' : '#f5222d',
              border: `1px solid ${cluster.upCount === cluster.nodeCount ? '#91d5ff' : '#ffa39e'}`,
            }}
          >
            {cluster.upCount}/{cluster.nodeCount} Nodes Online
          </span>
        </div>
        <button style={refreshBtnStyle(loading)} onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh Health'}
        </button>
      </div>

      <div style={infoBadgeRow}>
        <span>
          <strong>Cluster:</strong> {cluster.clusterName}
        </span>
        <span>•</span>
        <span>
          <strong>Keyspace:</strong> <code>{cluster.keyspace}</code>
        </span>
        <span>•</span>
        <span>
          <strong>Replication:</strong> {cluster.replication.strategy} (DC1: {cluster.replication.DC1})
        </span>
      </div>

      <div style={gridStyle}>
        {cluster.hosts.map((host, idx) => (
          <div key={host.address} style={nodeCardStyle(host.isUp)}>
            <div style={nodeTitleStyle}>
              <span>Node {idx + 1}</span>
              <span style={badgeStyle(host.isUp)}>{host.isUp ? 'Online (UN)' : 'Offline (DN)'}</span>
            </div>
            <div style={metaStyle}>
              <span>
                <strong>IP:</strong> <code>{host.address}</code>
              </span>
              <span>
                <strong>DC / Rack:</strong> {host.datacenter} / {host.rack}
              </span>
              <span>
                <strong>Vnodes / Tokens:</strong> {host.tokens}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
