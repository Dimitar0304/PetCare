declare module 'leaflet' {
  // Leaflet ships types in many versions, but some environments may still
  // report missing declarations when building with the Angular compiler.
  // This local fallback unblocks compilation.
  const L: any;
  export = L;
}

