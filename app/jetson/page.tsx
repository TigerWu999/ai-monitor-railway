// app/jetson/page.tsx
/**
 * Jetson Edge Nodes Dashboard
 * 邊緣節點管理儀表板
 */

'use client';

import { useState, useEffect } from 'react';

interface NodeStatus {
  node_id: string;
  name: string;
  status: string;
  cpu_percent: number | null;
  memory_percent: number | null;
  cameras_active: number;
  inference_fps: number | null;
  last_heartbeat: string | null;
}

interface Alert {
  alert_id: string;
  node_id: string;
  camera_id: string;
  alert_type: string;
  timestamp: string;
  confidence: number;
  node_name: string;
}

interface DashboardData {
  stats: {
    nodes_online: number;
    nodes_total: number;
    cameras_active: number;
    cameras_total: number;
    alerts_today: number;
    alerts_week: number;
    alerts_pending: number;
  };
  nodes: NodeStatus[];
  recent_alerts: Alert[];
  alerts_by_type: { alert_type: string; count: number }[];
}

export default function JetsonDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/jetson/dashboard');
      if (!response.ok) throw new Error('Failed to fetch');
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError('無法載入資料');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 每10秒更新
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Jetson Vision 邊緣節點</h1>
          <p className="text-gray-400 mt-2">Edge Node Management Dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="節點在線"
            value={`${data?.stats.nodes_online || 0}/${data?.stats.nodes_total || 0}`}
            color="green"
          />
          <StatCard
            title="攝像頭運行"
            value={`${data?.stats.cameras_active || 0}/${data?.stats.cameras_total || 0}`}
            color="blue"
          />
          <StatCard
            title="今日告警"
            value={data?.stats.alerts_today || 0}
            color="yellow"
          />
          <StatCard
            title="待處理"
            value={data?.stats.alerts_pending || 0}
            color="red"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Nodes Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">節點狀態</h2>
            {data?.nodes.length === 0 ? (
              <p className="text-gray-400">尚無註冊節點</p>
            ) : (
              <div className="space-y-3">
                {data?.nodes.map((node) => (
                  <div
                    key={node.node_id}
                    className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            node.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="font-medium">{node.name}</span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {node.cameras_active} 攝像頭 |{' '}
                        {node.inference_fps?.toFixed(1) || '-'} FPS
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>CPU: {node.cpu_percent?.toFixed(0) || '-'}%</div>
                      <div>RAM: {node.memory_percent?.toFixed(0) || '-'}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Alerts */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">最新告警</h2>
            {data?.recent_alerts.length === 0 ? (
              <p className="text-gray-400">暫無告警</p>
            ) : (
              <div className="space-y-2">
                {data?.recent_alerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium">{alert.alert_type}</span>
                      <div className="text-sm text-gray-400">
                        {alert.camera_id} @ {alert.node_name || alert.node_id}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>{(alert.confidence * 100).toFixed(0)}%</div>
                      <div>{new Date(alert.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alert Types Chart */}
        {data?.alerts_by_type && data.alerts_by_type.length > 0 && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">告警類型分布（24小時）</h2>
            <div className="flex flex-wrap gap-4">
              {data.alerts_by_type.map((item) => (
                <div
                  key={item.alert_type}
                  className="bg-gray-700 rounded-lg px-4 py-2"
                >
                  <span className="font-medium">{item.alert_type}</span>
                  <span className="ml-2 text-blue-400">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-900/50 border border-red-500 rounded-lg p-4">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: 'green' | 'blue' | 'yellow' | 'red';
}) {
  const colorClasses = {
    green: 'bg-green-900/50 border-green-500',
    blue: 'bg-blue-900/50 border-blue-500',
    yellow: 'bg-yellow-900/50 border-yellow-500',
    red: 'bg-red-900/50 border-red-500',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
