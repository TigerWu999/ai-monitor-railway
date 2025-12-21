// components/AICameraGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Camera,
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  Brain,
  Eye,
  Shield,
  TrendingUp
} from 'lucide-react';

interface AICamera {
  id: number;
  name: string;
  status: 'online' | 'offline' | 'processing';
  streamUrl: string;
  aiFeatures: {
    motionDetection: boolean;
    faceRecognition: boolean;
    objectTracking: boolean;
    anomalyDetection: boolean;
  };
  analytics?: {
    lastMotion?: string;
    detectedObjects?: string[];
    alertCount?: number;
  };
  location?: string;
  lastUpdate?: string;
}

export default function AICameraGrid() {
  const [cameras, setCameras] = useState<AICamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState<string>('checking');

  useEffect(() => {
    fetchAICameras();
    const interval = setInterval(fetchAICameras, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAICameras = async () => {
    try {
      const response = await fetch('/api/ai-monitor/cameras');
      const data = await response.json();

      if (response.ok) {
        setCameras(data.cameras || []);
        setAiStatus(data.aiStatus || 'active');
      }
    } catch (error) {
      console.error('Failed to fetch AI cameras:', error);
      setAiStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'online': return <Wifi className="h-3 w-3" />;
      case 'processing': return <Activity className="h-3 w-3 animate-pulse" />;
      case 'offline': return <WifiOff className="h-3 w-3" />;
      default: return <WifiOff className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Brain className="h-12 w-12 text-blue-500 animate-pulse mb-4" />
          <p className="text-gray-600">Loading AI Monitor System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI System Status Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">AI Monitor System</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              aiStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {aiStatus === 'active' ? 'AI Active' : 'AI Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              {cameras.length} Cameras
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              {cameras.reduce((sum, c) => sum + (c.analytics?.alertCount || 0), 0)} Alerts
            </span>
          </div>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <div key={camera.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Camera Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{camera.name}</h3>
                  <p className="text-sm text-gray-500">{camera.location}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(camera.status)}`}>
                  {getStatusIcon(camera.status)}
                  {camera.status}
                </span>
              </div>
            </div>

            {/* Camera Preview */}
            <div className="relative aspect-video bg-gray-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-12 w-12 text-gray-600" />
              </div>
              {camera.status === 'processing' && (
                <div className="absolute top-2 right-2">
                  <div className="bg-yellow-500 rounded-full p-1 animate-pulse">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* AI Features */}
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                {camera.aiFeatures.motionDetection && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Motion
                  </span>
                )}
                {camera.aiFeatures.faceRecognition && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Face
                  </span>
                )}
                {camera.aiFeatures.objectTracking && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Tracking
                  </span>
                )}
                {camera.aiFeatures.anomalyDetection && (
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Anomaly
                  </span>
                )}
              </div>

              {/* Analytics */}
              {camera.analytics && (
                <div className="text-xs text-gray-600 space-y-1">
                  {camera.analytics.lastMotion && (
                    <p>Last motion: {new Date(camera.analytics.lastMotion).toLocaleTimeString()}</p>
                  )}
                  {camera.analytics.detectedObjects && camera.analytics.detectedObjects.length > 0 && (
                    <p>Detected: {camera.analytics.detectedObjects.join(', ')}</p>
                  )}
                  {camera.analytics.alertCount !== undefined && camera.analytics.alertCount > 0 && (
                    <p className="text-yellow-600 font-medium">
                      {camera.analytics.alertCount} active alerts
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                View Stream
              </button>
              <button className="flex-1 px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                Analytics
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}