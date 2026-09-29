import type React from 'react';
import WorkflowDiagram from '../components/WorkflowDiagram';
import WorkflowCassandraExplainer from '../components/WorkflowCassandraExplainer';
import WorkflowButtonCatalog from '../components/WorkflowButtonCatalog';
import WorkflowLiveSimulator from '../components/WorkflowLiveSimulator';

const pageStyle: React.CSSProperties = {
  padding: '24px 20px',
  maxWidth: 1100,
  margin: '0 auto',
};

const tablesCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 16,
  padding: '24px',
  marginBottom: 28,
  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
};

const tableGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
  marginTop: 16,
};

const tableBox: React.CSSProperties = {
  background: '#fafafa',
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  padding: '16px',
};

export default function Workflow() {
  return (
    <div style={pageStyle}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h2 style={{ margin: 0, color: '#222', fontSize: '1.6rem' }}>
            🔄 End-to-End System Workflow & Database Internals
          </h2>
          <span
            style={{
              background: '#e8f5e9',
              color: '#2e7d32',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 12,
            }}
          >
            Full Stack Deep Dive
          </span>
        </div>
        <p style={{ color: '#666', fontSize: '0.94rem', lineHeight: 1.5, margin: 0 }}>
          A visual, step-by-step demonstration of how the React UI communicates through Docker networks to read,
          store, alter, and delete data in a 3-node Apache Cassandra distributed cluster.
        </p>
      </div>

      {/* 1. Architecture Flow Pipeline */}
      <WorkflowDiagram />

      {/* 2. 10-Year-Old Friendly Cassandra Core Concepts */}
      <WorkflowCassandraExplainer />

      {/* 3. Interactive Button-to-CQL Inspector */}
      <WorkflowButtonCatalog />

      {/* 4. Live Interactive Cassandra Simulator Lab */}
      <WorkflowLiveSimulator />

      {/* 5. Cassandra Tables & Query-Driven Modeling Reference */}
      <div style={tablesCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: '#222' }}>
              📚 Cassandra Query-Driven Tables Reference
            </h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
              In Cassandra, each table is designed around a single query pattern to eliminate slow SQL JOIN operations.
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', background: '#f5f5f5', padding: '4px 10px', borderRadius: 8, color: '#555' }}>
            Keyspace: <code>food_delivery</code> (RF=3)
          </span>
        </div>

        <div style={tableGrid}>
          {/* Table 1 */}
          <div style={tableBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: '#FF5733', fontSize: '0.92rem' }}>restaurants_by_city</strong>
              <span style={{ fontSize: '0.72rem', background: '#e3f2fd', color: '#1565c0', padding: '2px 6px', borderRadius: 6 }}>
                Partition: (city)
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 8px' }}>
              Primary key: <code>((city), restaurant_id)</code>
            </p>
            <p style={{ fontSize: '0.82rem', color: '#444', margin: 0 }}>
              Answers: <em>"Show me all restaurants in Mumbai"</em> in 1 step without reading other cities.
            </p>
          </div>

          {/* Table 2 */}
          <div style={tableBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: '#1890ff', fontSize: '0.92rem' }}>restaurants_by_id</strong>
              <span style={{ fontSize: '0.72rem', background: '#e3f2fd', color: '#1565c0', padding: '2px 6px', borderRadius: 6 }}>
                Partition: (restaurant_id)
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 8px' }}>
              Primary key: <code>(restaurant_id)</code>
            </p>
            <p style={{ fontSize: '0.82rem', color: '#444', margin: 0 }}>
              Answers: <em>"Get restaurant details by UUID"</em> for admin views and cross-city lookups.
            </p>
          </div>

          {/* Table 3 */}
          <div style={tableBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: '#52c41a', fontSize: '0.92rem' }}>menu_by_restaurant</strong>
              <span style={{ fontSize: '0.72rem', background: '#e3f2fd', color: '#1565c0', padding: '2px 6px', borderRadius: 6 }}>
                Partition: (restaurant_id)
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 8px' }}>
              Primary key: <code>((restaurant_id), item_id)</code>
            </p>
            <p style={{ fontSize: '0.82rem', color: '#444', margin: 0 }}>
              Answers: <em>"Fetch full menu for Spice Villa"</em>. All dishes for one restaurant live in one physical node!
            </p>
          </div>

          {/* Table 4 */}
          <div style={tableBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: '#722ed1', fontSize: '0.92rem' }}>orders_by_restaurant</strong>
              <span style={{ fontSize: '0.72rem', background: '#e3f2fd', color: '#1565c0', padding: '2px 6px', borderRadius: 6 }}>
                Partition: (restaurant_id)
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 8px' }}>
              Primary key: <code>((restaurant_id), order_id DESC)</code>
            </p>
            <p style={{ fontSize: '0.82rem', color: '#444', margin: 0 }}>
              Answers: <em>"Show revenue and latest orders for this store"</em>, pre-sorted chronologically.
            </p>
          </div>

          {/* Table 5 */}
          <div style={tableBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: '#fa8c16', fontSize: '0.92rem' }}>orders_by_user</strong>
              <span style={{ fontSize: '0.72rem', background: '#e3f2fd', color: '#1565c0', padding: '2px 6px', borderRadius: 6 }}>
                Partition: (user_id)
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 8px' }}>
              Primary key: <code>((user_id), order_id DESC)</code>
            </p>
            <p style={{ fontSize: '0.82rem', color: '#444', margin: 0 }}>
              Answers: <em>"What are my past orders?"</em> for the customer profile page.
            </p>
          </div>

          {/* Table 6 */}
          <div style={tableBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: '#eb2f96', fontSize: '0.92rem' }}>orders_by_id</strong>
              <span style={{ fontSize: '0.72rem', background: '#e3f2fd', color: '#1565c0', padding: '2px 6px', borderRadius: 6 }}>
                Partition: (order_id)
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 8px' }}>
              Primary key: <code>(order_id)</code>
            </p>
            <p style={{ fontSize: '0.82rem', color: '#444', margin: 0 }}>
              Answers: <em>"Fetch full details of order #f64709b0"</em> for receipt and driver tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
