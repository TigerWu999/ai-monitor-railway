/**
 * XCMS Integration Service
 * 整合 XCMS 視頻行為分析系統
 */

export interface XCMSCamera {
  id: number;
  name: string;
  status: 'online' | 'offline';
  url: string;
  streamUrl?: string;
  snapshotUrl?: string;
}

export interface XCMSEvent {
  id: number;
  cameraId: number;
  cameraName: string;
  type: 'motion' | 'person' | 'vehicle' | 'intrusion' | 'loitering' | 'fall' | 'fight';
  timestamp: string;
  confidence: number;
  snapshot?: string;
  video?: string;
  metadata?: {
    objects?: Array<{
      type: string;
      confidence: number;
      bbox?: number[];
    }>;
    tracks?: Array<{
      id: number;
      type: string;
      path: number[][];
    }>;
  };
}

export interface XCMSAnalytics {
  cameraId: number;
  period: string;
  stats: {
    totalEvents: number;
    motionEvents: number;
    personDetections: number;
    vehicleDetections: number;
    alerts: number;
  };
  timeline: Array<{
    timestamp: string;
    eventType: string;
    count: number;
  }>;
}

export class XCMSService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // 支援多種連接方式
    // 優先順序：Tailscale > 本地網路 > Cloudflare Tunnel
    const host = process.env.XCMS_HOST || process.env.AI_MONITOR_HOST || '192.168.1.184';
    const port = process.env.XCMS_PORT || process.env.AI_MONITOR_PORT || '9001';

    this.baseUrl = `http://${host}:${port}`;
    this.apiKey = process.env.XCMS_API_KEY || process.env.AI_MONITOR_API_KEY || '';
  }

  /**
   * 獲取所有攝影機列表
   */
  async getCameras(): Promise<XCMSCamera[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/cameras`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`XCMS API error: ${response.status}`);
      }

      const data = await response.json();

      // 轉換 XCMS 格式到標準格式
      return this.transformCameras(data);
    } catch (error) {
      console.error('Failed to fetch XCMS cameras:', error);
      // 返回默認攝影機列表
      return this.getDefaultCameras();
    }
  }

  /**
   * 獲取攝影機串流 URL
   */
  getStreamUrl(cameraId: number): string {
    const host = process.env.XCMS_HOST || '192.168.1.184';
    const rtspPort = process.env.XCMS_RTSP_PORT || '9554';
    const httpPort = process.env.XCMS_MEDIA_PORT || '9002';

    return {
      rtsp: `rtsp://${host}:${rtspPort}/stream/${cameraId}`,
      http: `http://${host}:${httpPort}/stream/${cameraId}`,
      hls: `http://${host}:${httpPort}/stream/${cameraId}.m3u8`,
      snapshot: `http://${host}:${httpPort}/snapshot/${cameraId}.jpg`,
    };
  }

  /**
   * 獲取 AI 事件（行為分析結果）
   */
  async getAIEvents(params?: {
    cameraId?: number;
    startTime?: string;
    endTime?: string;
    eventType?: string;
    limit?: number;
  }): Promise<XCMSEvent[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.cameraId) queryParams.append('camera_id', params.cameraId.toString());
      if (params?.startTime) queryParams.append('start_time', params.startTime);
      if (params?.endTime) queryParams.append('end_time', params.endTime);
      if (params?.eventType) queryParams.append('event_type', params.eventType);
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(
        `${this.baseUrl}/api/v1/events?${queryParams.toString()}`,
        {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error(`XCMS Events API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformEvents(data);
    } catch (error) {
      console.error('Failed to fetch XCMS events:', error);
      return this.getDefaultEvents();
    }
  }

  /**
   * 獲取分析統計
   */
  async getAnalytics(cameraId: number, period: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<XCMSAnalytics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/analytics/${cameraId}?period=${period}`,
        {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error(`XCMS Analytics API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch XCMS analytics:', error);
      return this.getDefaultAnalytics(cameraId, period);
    }
  }

  /**
   * 控制攝影機（開始/停止錄影、PTZ 控制等）
   */
  async controlCamera(cameraId: number, action: string, params?: any): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/cameras/${cameraId}/control`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ action, ...params }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error(`XCMS Control API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to control camera:', error);
      throw error;
    }
  }

  /**
   * 獲取即時 AI 檢測結果（WebSocket 或輪詢）
   */
  async getRealtimeDetections(cameraId: number): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/detections/${cameraId}/realtime`,
        {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.detections || [];
    } catch (error) {
      console.error('Failed to fetch realtime detections:', error);
      return [];
    }
  }

  // ========== 私有方法 ==========

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
    };
  }

  private transformCameras(data: any): XCMSCamera[] {
    if (!data || !data.cameras) {
      return this.getDefaultCameras();
    }

    return data.cameras.map((cam: any, index: number) => ({
      id: cam.id || index + 1,
      name: cam.name || `Camera ${index + 1}`,
      status: cam.status || 'online',
      url: cam.url || this.getStreamUrl(cam.id || index + 1).rtsp,
      streamUrl: this.getStreamUrl(cam.id || index + 1).http,
      snapshotUrl: this.getStreamUrl(cam.id || index + 1).snapshot,
    }));
  }

  private transformEvents(data: any): XCMSEvent[] {
    if (!data || !data.events) {
      return this.getDefaultEvents();
    }

    return data.events.map((event: any) => ({
      id: event.id,
      cameraId: event.camera_id,
      cameraName: event.camera_name || `Camera ${event.camera_id}`,
      type: this.mapEventType(event.event_type),
      timestamp: event.timestamp,
      confidence: event.confidence || 0.9,
      snapshot: event.snapshot_url,
      video: event.video_url,
      metadata: event.metadata,
    }));
  }

  private mapEventType(type: string): XCMSEvent['type'] {
    const typeMap: Record<string, XCMSEvent['type']> = {
      'motion': 'motion',
      'person_detected': 'person',
      'vehicle_detected': 'vehicle',
      'intrusion': 'intrusion',
      'loitering': 'loitering',
      'fall_detected': 'fall',
      'fight_detected': 'fight',
    };
    return typeMap[type] || 'motion';
  }

  private getDefaultCameras(): XCMSCamera[] {
    return [
      {
        id: 1,
        name: '入口攝影機',
        status: 'online',
        url: this.getStreamUrl(1).rtsp,
        streamUrl: this.getStreamUrl(1).http,
        snapshotUrl: this.getStreamUrl(1).snapshot,
      },
    ];
  }

  private getDefaultEvents(): XCMSEvent[] {
    const now = new Date();
    return [
      {
        id: 1,
        cameraId: 1,
        cameraName: '入口攝影機',
        type: 'person',
        timestamp: new Date(now.getTime() - 300000).toISOString(),
        confidence: 0.95,
        metadata: {
          objects: [
            { type: 'person', confidence: 0.95, bbox: [100, 100, 200, 300] },
          ],
        },
      },
    ];
  }

  private getDefaultAnalytics(cameraId: number, period: string): XCMSAnalytics {
    return {
      cameraId,
      period,
      stats: {
        totalEvents: 0,
        motionEvents: 0,
        personDetections: 0,
        vehicleDetections: 0,
        alerts: 0,
      },
      timeline: [],
    };
  }
}

// 單例模式
export const xcmsService = new XCMSService();
