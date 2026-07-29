const STADIUM_MAP_BASE = 'https://maps.gametime.co/v2/centurylink_field/edsheeran/edsheeran-8.png';

/** Widths used for mildly responsive stadium map srcsets. */
export const STADIUM_MAP_WIDTHS = [480, 768, 1280] as const;

/**
 * Gametime static stadium map URL. The CDN `width` query param controls
 * encode size — pick based on layout, not viewport CSS alone.
 */
export function stadiumMapImageUrl(width: number): string {
  return `${STADIUM_MAP_BASE}?width=${width}&auto=webp`;
}

/** Default `src` + `srcSet` for web `<img>` tags over the checkout map. */
export function stadiumMapImageSrcSet(): { src: string; srcSet: string } {
  const srcSet = STADIUM_MAP_WIDTHS.map((width) => `${stadiumMapImageUrl(width)} ${width}w`).join(
    ', ',
  );
  return {
    src: stadiumMapImageUrl(768),
    srcSet,
  };
}
