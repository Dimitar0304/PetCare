export interface MessageDto {
  id: string;
  senderId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  isRead: boolean;
}

export interface SendMessagePayload {
  recipientEmail: string;
  subject: string;
  body: string;
}
