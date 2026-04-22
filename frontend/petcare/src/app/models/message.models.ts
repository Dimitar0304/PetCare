/**
 * Private message DTO returned by inbox and sent-message endpoints.
 */
export interface MessageDto {
  id: string;
  senderId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  /** ISO-8601 UTC timestamp at which the message was sent. */
  sentAt: string;
  isRead: boolean;
}

/**
 * Payload sent to the `message/send` endpoint.
 */
export interface SendMessagePayload {
  recipientEmail: string;
  subject: string;
  body: string;
}
