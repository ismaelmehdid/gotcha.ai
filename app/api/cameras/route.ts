import { NextRequest, NextResponse } from 'next/server';
import { createCamera } from '@/application/cameras/create-camera';
import { listCameras } from '@/application/cameras/list-cameras';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createCamera(body);

    if (result.result === 'failure') {
      return NextResponse.json(
        { error: 'Bad Request', message: result.reason },
        { status: 400 },
      );
    }

    return NextResponse.json(result.payload, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 },
    );
  }
}

export async function GET() {
  const result = await listCameras();

  if (result.result === 'failure') {
    return NextResponse.json(
      { error: 'Internal Server Error', message: result.reason },
      { status: 500 },
    );
  }

  return NextResponse.json(result.payload);
}
