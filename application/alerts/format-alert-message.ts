import type { ShopliftingAlert } from '@/shared/types/shoplifting-alert';
import type { NotificationMessage } from '@/core/notifications/notification-service';

function getSeverityEmoji(severity: string): string {
  const emojiMap: Record<string, string> = {
    low: '⚠️',
    medium: '🟠',
    high: '🔴',
    critical: '🚨',
  };
  return emojiMap[severity] ?? '⚠️';
}

function getSeverityLabel(severity: string): string {
  const labelMap: Record<string, string> = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    critical: 'CRITICAL',
  };
  return labelMap[severity] ?? 'UNKNOWN';
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

export function formatShopliftingAlertMessage(alert: ShopliftingAlert): string {
  const severityEmoji = getSeverityEmoji(alert.severity);
  const severityLabel = getSeverityLabel(alert.severity);

  const lines: string[] = [
    `${severityEmoji} <b>SHOPLIFTING DETECTED</b> ${severityEmoji}`,
    '',
    `<b>Severity:</b> ${severityLabel}`,
    `<b>Confidence:</b> ${formatConfidence(alert.confidence)}`,
    '',
    `📹 <b>Camera:</b> ${alert.camera.name}`,
    `🆔 <b>Camera ID:</b> <code>${alert.camera.id}</code>`,
  ];

  if (alert.camera.location) {
    lines.push(`📍 <b>Location:</b> ${alert.camera.location}`);
  }

  lines.push(`⏰ <b>Time:</b> ${formatTimestamp(alert.timestamp)}`);

  if (alert.description) {
    lines.push('', `📝 <b>Details:</b> ${alert.description}`);
  }

  lines.push(
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '⚡ <b>Immediate action required!</b>',
    'Review footage and respond accordingly.',
  );

  return lines.join('\n');
}

export function formatPhotoCaption(alert: ShopliftingAlert): string {
  return `📸 Detection snapshot from <b>${alert.camera.name}</b> at ${formatTimestamp(alert.timestamp)}`;
}

export function alertToNotificationMessage(
  alert: ShopliftingAlert,
): NotificationMessage {
  return {
    text: formatShopliftingAlertMessage(alert),
    imageUrl: alert.imageUrl,
    caption: alert.imageUrl ? formatPhotoCaption(alert) : undefined,
  };
}

