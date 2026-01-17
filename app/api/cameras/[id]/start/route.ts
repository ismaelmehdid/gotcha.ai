import { NextRequest, NextResponse } from 'next/server';
import { startCamera } from '@/application/cameras/start-camera';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await startCamera(id);

    if (result.result === 'failure') {
      return NextResponse.json(
        { error: 'Bad Request', message: result.reason },
        { status: 400 },
      );
    }

    return NextResponse.json(result.payload, { status: 202 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to start camera' },
      { status: 500 },
    );
  }
}
