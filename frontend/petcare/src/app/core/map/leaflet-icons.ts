import * as L from 'leaflet';

/**
 * Configures Leaflet to load its default marker icons from a public CDN.
 *
 * Leaflet resolves marker assets using static paths relative to the bundle.
 * When bundled with Angular those paths break, which results in missing
 * marker images. This helper overrides `L.Icon.Default.prototype._getIconUrl`
 * so every default marker references stable URLs on unpkg.
 *
 * Call once during application bootstrap before rendering any `L.marker`.
 */
export function configureLeafletIcons(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconDefault = L.Icon.Default;

  // Replace internal getter so the default icon URLs work in dev/prod.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (iconDefault.prototype as any)._getIconUrl = function (iconType: string) {
    const baseUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images';
    if (iconType === 'shadow') return `${baseUrl}/marker-shadow.png`;
    if (iconType === 'iconRetinaUrl') return `${baseUrl}/marker-icon-2x.png`;
    return `${baseUrl}/marker-icon.png`;
  };
}

