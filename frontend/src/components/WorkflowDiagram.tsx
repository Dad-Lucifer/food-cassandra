import type React from 'react';

interface Props {
  activeStep?: number;
}

const containerStyle: React.CSSProperties = {
  background: '#1a1a24',
  color: '#fff',
  borderRadius: 16,
  padding: '24px 20px',
  marginBottom: 28,
  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 700,
  color: '#fff',
  margin: '0 0 6px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#a0a0b0',
  margin: '0 0 20px',
};

const flowRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
};

const boxStyle = (color: string): React.CSSProperties => ({
  background: '#232332',
  border: `2px solid ${color}`,
  borderRadius: 12,
  padding: '16px 18px',
  flex: 1,
  minWidth: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

const arrowStyle: React.CSSProperties = {
  fontSize: '1.4rem',
  color: '#FF5733',
  fontWeight: 700,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '0 4px',
};

const subBadge: React.CSSProperties = {
  fontSize: '0.72rem',
  background: 'rgba(255,255,255,0.08)',
  color: '#ddd',
  padding: '2px 8px',
  borderRadius: 10,
  width: 'fit-content',
};

const clusterBoxStyle: React.CSSProperties = {
  background: '#202030',
  border: '2px solid #52c41a',
  borderRadius: 12,
  padding: '16px',
  flex: 2,
  minWidth: 280,
};

const nodesGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  marginTop: 10,
};

const nodeCard: React.CSSProperties = {
  background: '#2a2a3c',
  border: '1px solid #3f3f56',
  borderRadius: 8,
  padding: '8px 10px',
  textAlign: 'center',
};

export default function WorkflowDiagram({ activeStep }: Props) {
  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>
        <span>🗺️ System Architecture Data Pipeline</span>
        <span style={{ fontSize: '0.75rem', background: '#FF5733', padding: '3px 10px', borderRadius: 12 }}>
          Live Pipeline
        </span>
      </h3>
      <p style={subtitleStyle}>
        How a button click in your browser travels through Docker containers and writes across 3 Cassandra database nodes.
      </p>

      <div style={flowRowStyle}>
        {/* Layer 1: Browser UI */}
        <div style={boxStyle('#FF5733')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem', color: '#ff7a59' }}>1. React Browser UI</strong>
            <span style={subBadge}>Port 5174</span>
          </div>
          <span style={{ fontSize: '0.82rem', color: '#ccc' }}>
            User clicks a button (Search, Place Order, Add Restaurant, Edit)
          </span>
          <span style={{ fontSize: '0.74rem', color: '#888', fontFamily: 'monospace' }}>
            Axios HTTP Client → JSON
          </span>
        </div>

        {/* Arrow */}
        <div style={arrowStyle}>
          <span>→</span>
          <span style={{ fontSize: '0.65rem', color: '#aaa' }}>HTTP REST</span>
        </div>

        {/* Layer 2: Express Backend */}
        <div style={boxStyle('#1890ff')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem', color: '#69c0ff' }}>2. Express Backend API</strong>
            <span style={subBadge}>Port 5000</span>
          </div>
          <span style={{ fontSize: '0.82rem', color: '#ccc' }}>
            Docker container <code>food-delivery-backend</code> validates & generates UUIDs
          </span>
          <span style={{ fontSize: '0.74rem', color: '#888', fontFamily: 'monospace' }}>
            cassandra-driver (Native CQL Protocol)
          </span>
        </div>

        {/* Arrow */}
        <div style={arrowStyle}>
          <span>→</span>
          <span style={{ fontSize: '0.65rem', color: '#aaa' }}>cassandra-net</span>
        </div>

        {/* Layer 3: Cassandra 3-Node Cluster */}
        <div style={clusterBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem', color: '#95de64' }}>
              3. Apache Cassandra Cluster
            </strong>
            <span style={{ ...subBadge, color: '#52c41a', background: 'rgba(82, 196, 26, 0.15)' }}>
              RF = 3 (Full Copies)
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#aaa', margin: '4px 0 0' }}>
            Data replicated across all 3 nodes on internal network <code>cassandra-net</code>
          </p>

          <div style={nodesGrid}>
            <div style={nodeCard}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#52c41a' }}>Node 1</div>
              <div style={{ fontSize: '0.68rem', color: '#888' }}>RACK 1 (:9042)</div>
              <div style={{ fontSize: '0.68rem', color: '#aaa' }}>Seed Node</div>
            </div>
            <div style={nodeCard}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#52c41a' }}>Node 2</div>
              <div style={{ fontSize: '0.68rem', color: '#888' }}>RACK 2 (:9043)</div>
              <div style={{ fontSize: '0.68rem', color: '#aaa' }}>Token Peer</div>
            </div>
            <div style={nodeCard}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#52c41a' }}>Node 3</div>
              <div style={{ fontSize: '0.68rem', color: '#888' }}>RACK 3 (:9044)</div>
              <div style={{ fontSize: '0.68rem', color: '#aaa' }}>Token Peer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
