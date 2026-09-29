import type React from 'react';

const containerStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 16,
  padding: '26px 24px',
  marginBottom: 28,
  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
};

const headerBadge: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  background: '#e6f7ff',
  color: '#096dd9',
  border: '1px solid #91d5ff',
  padding: '3px 10px',
  borderRadius: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  width: 'fit-content',
  marginBottom: 8,
};

const cardsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
  marginTop: 16,
};

const explainerCard = (accentColor: string): React.CSSProperties => ({
  background: '#fafafa',
  border: '1px solid #eee',
  borderTop: `4px solid ${accentColor}`,
  borderRadius: 12,
  padding: '18px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export default function WorkflowCassandraExplainer() {
  return (
    <div style={containerStyle}>
      <div style={headerBadge}>Child-Friendly Deep Dive</div>
      <h3 style={{ margin: '0 0 6px', color: '#222', fontSize: '1.3rem' }}>
        🧠 How Exactly Does Apache Cassandra Work? (Explain Like I'm 10)
      </h3>
      <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
        Cassandra is not like normal databases (SQL). It is a <strong>distributed ring</strong> built to handle massive food deliveries without ever crashing.
      </p>

      <div style={cardsGrid}>
        {/* Concept 1 */}
        <div style={explainerCard('#FF5733')}>
          <div style={{ fontSize: '1.8rem' }}>⭕</div>
          <strong style={{ fontSize: '1rem', color: '#222' }}>1. The Circle of Friends (3 Nodes)</strong>
          <p style={{ fontSize: '0.83rem', color: '#555', lineHeight: 1.5, margin: 0 }}>
            Imagine 3 students sitting in a circle: <strong>Node 1</strong>, <strong>Node 2</strong>, and <strong>Node 3</strong>.
            Every second, they whisper to each other: <em>"Hey, I'm healthy and awake!"</em>.
            That whisper is called the <strong>Gossip Protocol</strong>. If one node takes a nap, the others know instantly.
          </p>
        </div>

        {/* Concept 2 */}
        <div style={explainerCard('#52c41a')}>
          <div style={{ fontSize: '1.8rem' }}>🛡️</div>
          <strong style={{ fontSize: '1rem', color: '#222' }}>2. The 3 Copies Rule (Replication RF=3)</strong>
          <p style={{ fontSize: '0.83rem', color: '#555', lineHeight: 1.5, margin: 0 }}>
            When you order Butter Chicken, Cassandra doesn't just write it down once. It writes identical receipts into
            <strong> all 3 computers</strong> at the same time! Even if someone pulls the plug on Node 2, Node 1 and Node 3
            still have your order safe and sound.
          </p>
        </div>

        {/* Concept 3 */}
        <div style={explainerCard('#1890ff')}>
          <div style={{ fontSize: '1.8rem' }}>🎯</div>
          <strong style={{ fontSize: '1rem', color: '#222' }}>3. The Magic Number Machine (Tokens)</strong>
          <p style={{ fontSize: '0.83rem', color: '#555', lineHeight: 1.5, margin: 0 }}>
            How does Cassandra know which computer holds Mumbai's restaurants?
            It runs the word <strong>"Mumbai"</strong> through a magic math formula called a <strong>Hash Function</strong>.
            It turns the city into a unique token number and points straight to that computer in 1 millisecond without searching!
          </p>
        </div>

        {/* Concept 4 */}
        <div style={explainerCard('#722ed1')}>
          <div style={{ fontSize: '1.8rem' }}>⚡</div>
          <strong style={{ fontSize: '1rem', color: '#222' }}>4. Why No SQL Joins? (Fast Tables)</strong>
          <p style={{ fontSize: '0.83rem', color: '#555', lineHeight: 1.5, margin: 0 }}>
            Old SQL databases store data in messy piles and have to "JOIN" 5 tables together whenever you open an app.
            Cassandra says: <em>"That's too slow!"</em> Instead, it keeps ready-made tables like <code>restaurants_by_city</code>{' '}
            and <code>orders_by_restaurant</code> so lookups are lightning fast!
          </p>
        </div>
      </div>
    </div>
  );
}
