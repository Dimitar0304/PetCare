/**
 * Generic paged-result envelope matching the backend `PagedResult<T>`.
 */
export type PagedResultDto<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Advertisement projection used in the admin moderation panel.
 * Mirrors the backend admin endpoint response.
 */
export type AdminAdDto = {
  id: string;
  ownerId?: string;
  ownerEmail?: string;
  title: string;
  description: string;
  town: string;
  price: number;
  /** Numeric service type matching `AdServiceType` on the backend. */
  serviceType: number;
  startDate?: string | null;
  endDate?: string | null;
};

/**
 * Message projection used in the admin moderation panel.
 */
export type AdminMessageDto = {
  id: string;
  senderId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  isRead: boolean;
};

