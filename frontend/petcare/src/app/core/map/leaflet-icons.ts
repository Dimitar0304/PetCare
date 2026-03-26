import * as L from 'leaflet';

// Leaflet uses static paths for marker icons. When bundling with Angular,
// those defaults can break. This config ensures markers render correctly.
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

