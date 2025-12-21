import { NextRequest, NextResponse } from 'next/server';

const XCMS_BASE_URL = 'http://100.113.105.10:9001';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || '';
  const url = new URL(request.url);
  const targetUrl = `${XCMS_BASE_URL}/${path}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        host: new URL(XCMS_BASE_URL).host,
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
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || '';
  const url = new URL(request.url);
  const targetUrl = `${XCMS_BASE_URL}/${path}${url.search}`;

  try {
    const body = await request.text();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        host: new URL(XCMS_BASE_URL).host,
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