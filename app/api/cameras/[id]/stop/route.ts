import { NextRequest, NextResponse } from 'next/server';
import { stopCamera } from '@/application/cameras/stop-camera';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await stopCamera(id);

    if (result.result === 'failure') {
      return NextResponse.json(
        { error: 'Bad Request', message: result.reason },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to stop camera' },
      { status: 500 },
    );
  }
}
