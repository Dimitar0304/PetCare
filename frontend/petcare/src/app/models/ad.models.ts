export type AdServiceType = 1 | 2 | 3 | 4 | 5;

export interface AdDto {
  id: string;
  title: string;
  description: string;
  serviceType: AdServiceType;
  town: string;
  xcordinates?: string;
  ycordinates?: string;
  price: number;
  startDate?: string | null;
  endDate?: string | null;
  isTrue?: boolean;
  // Backend has a typo: `Erors` -> `erors` after camelCase conversion.
  erors?: string[];
}

export interface Ad {
  id: string;
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

