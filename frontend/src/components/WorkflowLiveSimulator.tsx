import type React from 'react';
import { useState } from 'react';
import api from '../api';

interface LogEntry {
  timestamp: string;
  action: string;
  durationMs: number;
  cql: string;
  status: 'SUCCESS' | 'ERROR';
  responseSnippet: string;
}

export default function WorkflowLiveSimulator() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = (entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev.slice(0, 7)]);
  };

  const handleTestOrder = async () => {
    setRunning(true);
    const start = performance.now();
    try {
      // Pick first restaurant or Spice Villa
      const restId = 'e1cc25ee-9513-452c-ac08-5512c96241ad';
      const res = await api.post(`/admin/restaurants/${restId}/demo-order`);
      const duration = Math.round(performance.now() - start);

      addLog({
        timestamp: new Date().toLocaleTimeString(),
        action: 'Place Order Across 3 Cassandra Nodes',
        durationMs: duration,
        cql: `INSERT INTO orders_by_user ...; INSERT INTO orders_by_id ...; INSERT INTO orders_by_restaurant ...;`,
        status: 'SUCCESS',
        responseSnippet: `Order #${(res.data.order_id || '').slice(0, 8)} created for ₹${res.data.total}. Status: ${res.data.status}`,
      });
    } catch (err: unknown) {
      addLog({
        timestamp: new Date().toLocaleTimeString(),
        action: 'Place Order Across 3 Cassandra Nodes',
        durationMs: Math.round(performance.now() - start),
        cql: 'INSERT INTO orders_by_user ...',
        status: 'ERROR',
        responseSnippet: err instanceof Error ? err.message : 'Error executing order write',
      });
    } finally {
      setRunning(false);
    }
  };

  const handleTestCluster = async () => {
    setRunning(true);
    const start = performance.now();
    try {
      const res = await api.get('/admin/cluster');
      const duration = Math.round(performance.now() - start);
      addLog({
        timestamp: new Date().toLocaleTimeString(),
        action: 'Poll 3-Node Cassandra Cluster TCP Ping',
        durationMs: duration,
        cql: 'client.hosts.forEach(h => h.isUp()) via binary protocol :9042',
        status: 'SUCCESS',
        responseSnippet: `Connected to ${res.data.upCount}/${res.data.nodeCount} Cassandra nodes (DC1 RF=3)`,
      });
    } catch (err: unknown) {
      addLog({
        timestamp: new Date().toLocaleTimeString(),
        action: 'Poll 3-Node Cassandra Cluster TCP Ping',
        durationMs: Math.round(performance.now() - start),
        cql: 'client.hosts.forEach()',
        status: 'ERROR',
        responseSnippet: err instanceof Error ? err.message : 'Cluster unreachable',
      });
    } finally {
      setRunning(false);
    }
  };

  const handleTestReadMenu = async () => {
    setRunning(true);
    const start = performance.now();
    try {
      const restId = 'e1cc25ee-9513-452c-ac08-5512c96241ad';
      const res = await api.get(`/menu/${restId}`);
      const duration = Math.round(performance.now() - start);
      addLog({
        timestamp: new Date().toLocaleTimeString(),
        action: 'Query menu_by_restaurant partition',
        durationMs: duration,
        cql: `SELECT * FROM menu_by_restaurant WHERE restaurant_id = ${restId};`,
        status: 'SUCCESS',
        responseSnippet: `Fetched ${res.data.length} dishes in ${duration}ms from Cassandra`,
      });
    } catch (err: unknown) {
      addLog({
        timestamp: new Date().toLocaleTimeString(),
        action: 'Query menu_by_restaurant partition',
        durationMs: Math.round(performance.now() - start),
        cql: 'SELECT * FROM menu_by_restaurant',
        status: 'ERROR',
        responseSnippet: err instanceof Error ? err.message : 'Read error',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '24px', marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: '#222' }}>
            ⚡ Live Cassandra Interactive Query Lab
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.88rem' }}>
            Click buttons below to trigger live database operations and observe the Cassandra latency and CQL commands!
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleTestOrder}
            disabled={running}
            style={{
              background: '#FF5733',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            {running ? 'Executing...' : '▶️ Trigger 3-Node Order Write'}
          </button>

          <button
            type="button"
            onClick={handleTestReadMenu}
            disabled={running}
            style={{
              background: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            ▶️ Read Partition Menu
          </button>

          <button
            type="button"
            onClick={handleTestCluster}
            disabled={running}
            style={{
              background: '#52c41a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            ▶️ Ping 3 Nodes (:9042)
          </button>
        </div>
      </div>

      {/* Live Log Console */}
      <div style={{ background: '#181824', borderRadius: 12, padding: '16px', color: '#eee', minHeight: 140 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid #333', paddingBottom: 6 }}>
          <span style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>
            Live Query Terminal Output
          </span>
          <span style={{ fontSize: '0.75rem', color: '#52c41a' }}>● Cassandra Driver Connected</span>
        </div>

        {logs.length === 0 ? (
          <p style={{ color: '#777', fontSize: '0.82rem', margin: '20px 0', textAlign: 'center' }}>
            Click one of the test buttons above to run live CQL against Docker-hosted Cassandra!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ background: '#222232', borderRadius: 8, padding: '10px 12px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong style={{ color: log.status === 'SUCCESS' ? '#95de64' : '#ff7875' }}>
                    {log.status === 'SUCCESS' ? '✓' : '✗'} {log.action}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#aaa' }}>
                    ⏱️ {log.durationMs}ms • {log.timestamp}
                  </span>
                </div>
                <div style={{ color: '#aaa', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: 4 }}>
                  CQL: <code>{log.cql}</code>
                </div>
                <div style={{ color: '#ffd591', fontSize: '0.78rem' }}>
                  Response: {log.responseSnippet}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
