export function validateRtspUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'RTSP URL is required' };
  }

  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'RTSP URL cannot be empty' };
  }

  const rtspPattern =
    /^rtsp:\/\/([a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])(:\d+)?(\/.*)?$/;

  if (!rtspPattern.test(trimmed)) {
    return {
      valid: false,
      error:
        'RTSP URL must start with rtsp:// and have a valid format (e.g., rtsp://host:port/path)',
    };
  }

  try {
    const urlObj = new URL(trimmed);
    if (urlObj.protocol !== 'rtsp:') {
      return { valid: false, error: 'URL must use RTSP protocol' };
    }

    if (!urlObj.hostname) {
      return { valid: false, error: 'RTSP URL must include a hostname' };
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  return { valid: true };
}

