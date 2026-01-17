import { NextRequest, NextResponse } from 'next/server';
import { deleteCameraUseCase } from '@/application/cameras/delete-camera';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await deleteCameraUseCase(id);

    if (result.result === 'failure') {
      return NextResponse.json(
        { error: 'Not Found', message: result.reason },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete camera' },
      { status: 500 },
    );
  }
}


