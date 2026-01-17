import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendShopliftingAlert } from '@/application/alerts/send-shoplifting-alert';
import { transformWebhookPayloadToAlertDTO } from '@/application/alerts/transform-webhook-payload';

const DetectionWebhookPayloadSchema = z.object({
  camera_id: z.string().min(1, 'camera_id is required and cannot be empty'),
  camera_name: z.string().min(1, 'camera_name is required and cannot be empty'),
  camera_location: z.string().optional(),
  timestamp: z.string().datetime({
    message: 'timestamp must be a valid ISO 8601 datetime string',
  }),
  confidence: z
    .number()
    .min(0)
    .max(100, 'confidence must be between 0 and 100'),
  image_url: z.url('image_url must be a valid URL'),
  description: z.string().optional(),
});

const EXPECTED_BODY_DOCUMENTATION = {
  camera_id: 'string (required, non-empty)',
  camera_name: 'string (required, non-empty)',
  camera_location: 'string (optional)',
  timestamp: 'string ISO 8601 datetime (required)',
  confidence: 'number 0-100 (required)',
  image_url: 'string URL (optional)',
  description: 'string (optional)',
} as const;

// function validateWebhookSecret(request: NextRequest): boolean {
//   const webhookSecret = process.env.WEBHOOK_SECRET;
//   if (!webhookSecret) {
//     console.warn('WEBHOOK_SECRET not configured - webhook security disabled');
//     return true;
//   }

//   const apiKey = request.headers.get('x-api-key');
//   return apiKey === webhookSecret;
// }

export async function POST(request: NextRequest) {
//   if (!validateWebhookSecret(request)) {
//     return NextResponse.json(
//       { error: 'Unauthorized', message: 'Invalid or missing API key' },
//       { status: 401 },
//     );
//   }

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const validationResult = DetectionWebhookPayloadSchema.safeParse(rawPayload);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Invalid payload structure',
        details: validationResult.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
        expected: EXPECTED_BODY_DOCUMENTATION,
      },
      { status: 400 },
    );
  }

  const payload = validationResult.data;
  const alertDTO = transformWebhookPayloadToAlertDTO(payload);
  const result = await sendShopliftingAlert(alertDTO);

  if (result.result === 'failure') {
    console.error('Failed to enqueue shoplifting alert:', result.reason);
    return NextResponse.json(
      { error: 'Internal Server Error', message: result.reason },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: 'Alert queued successfully',
      alertId: alertDTO.id,
      jobId: result.payload.jobId,
    },
    { status: 202 },
  );
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Detection Webhook',
    method: 'POST',
    expectedHeaders: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-webhook-secret',
    },
    expectedBody: EXPECTED_BODY_DOCUMENTATION,
  });
}
