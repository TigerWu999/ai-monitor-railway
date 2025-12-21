import { NextRequest, NextResponse } from 'next/server';

// 使用 Railway-XCMS Bridge 服務
// Bridge 服務可以透過 Tailscale 訪問
const XCMS_BRIDGE_URL = process.env.XCMS_BRIDGE_URL || 'http://100.113.105.10:8080';
const XCMS_API_KEY = process.env.XCMS_API_KEY || 'ba980299eaa093c9a3805a779b32c2a619fb5e69737ca721b7ce537910c9d0bb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path?.join('/') || '';
  const url = new URL(request.url);
  const targetUrl = `${XCMS_BRIDGE_URL}/${path}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'X-API-Key': XCMS_API_KEY,
        host: new URL(XCMS_BRIDGE_URL).host,
      },
    });

    const contentType = response.headers.get('content-type');

    // 處理不同類型的內容
    if (contentType?.includes('text/html')) {
      let html = await response.text();
      // 修改 HTML 中的絕對路徑為相對路徑
      html = html.replace(/href="\//g, 'href="/api/xcms/');
      html = html.replace(/src="\//g, 'src="/api/xcms/');
      html = html.replace(/action="\//g, 'action="/api/xcms/');

      return new NextResponse(html, {
        status: response.status,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });
    }

    // 對於其他類型的內容，直接轉發
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'content-type': contentType || 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path?.join('/') || '';
  const url = new URL(request.url);
  const targetUrl = `${XCMS_BRIDGE_URL}/${path}${url.search}`;

  try {
    const body = await request.text();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'X-API-Key': XCMS_API_KEY,
        host: new URL(XCMS_BRIDGE_URL).host,
      },
      body: body,
    });

    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'content-type': contentType || 'text/plain',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 502 }
    );
  }
}