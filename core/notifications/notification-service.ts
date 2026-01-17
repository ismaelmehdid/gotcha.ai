import type { Result } from 'neverthrow';

export interface NotificationMessage {
  text: string;
  imageUrl?: string;
  caption?: string;
}

export interface NotificationService {
  send(message: NotificationMessage): Promise<Result<void, Error>>;
}
