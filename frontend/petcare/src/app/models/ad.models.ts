/**
 * Numeric discriminator for an advertised service, matching the backend
 * `AdServiceType` enum: 1 = DogWalking, 2 = FeedingAnimal, 3 = OvernightCare,
 * 4 = PetSitting, 5 = SomethingSpecific.
 */
export type AdServiceType = 1 | 2 | 3 | 4 | 5;

/**
 * Raw advertisement shape as returned by the backend API.
 *
 * Keeps the backend casing for fields such as `xcordinates`/`ycordinates` and
 * preserves the server-side typo `erors` so the same DTO can be used without a
 * rename on every request.
 */
export interface AdDto {
  id: string;
  ownerId?: string;
  ownerEmail?: string;
  title: string;
  description: string;
  serviceType: AdServiceType;
  town: string;
  xcordinates?: string;
  ycordinates?: string;
  price: number;
  startDate?: string | null;
  endDate?: string | null;
  /** Indicates a successful server operation on write endpoints. */
  isTrue?: boolean;
  // Backend has a typo: `Erors` -> `erors` after camelCase conversion.
  erors?: string[];
}

/**
 * Generic paged-result envelope mirroring the backend `PagedResult<T>`.
 */
export interface PagedResultDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Frontend-friendly advertisement model with coordinates parsed to numbers and
 * `town` renamed to `city` for display purposes.
 */
export interface Ad {
  id: string;
  ownerId?: string;
  ownerEmail?: string;
  title: string;
  description: string;
  serviceType: AdServiceType;
  city: string;
  latitude?: number;
  longitude?: number;
  price: number;
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * Payload sent to the backend when creating or updating an advertisement.
 * Field names intentionally match the backend's JSON contract.
 */
export interface CreateAdPayload {
  title: string;
  description: string;
  serviceType: AdServiceType;
  town: string; // backend uses Town
  xcordinates?: string;
  ycordinates?: string;
  price: number;
  startDate?: string | null;
  endDate?: string | null;
}

