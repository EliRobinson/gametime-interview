/**
 * Server-safe entry for Next.js Server Components / SSR.
 * Only pure modules (copy, fixtures, mappers) — no React components or hooks.
 * Import from `@repo/ui/server` so the main barrel's client components are not pulled in.
 */
export { CHECKOUT_COPY } from './features/checkout/checkout.copy';
export type {
  CheckoutMapBubble,
  CheckoutPresentation,
  CheckoutView,
} from './features/checkout/checkout.view-model';
export { mapCheckoutPresentation } from './features/checkout/mapCheckoutPresentation.util';
export {
  priceUpdatedNotice,
  viewFromErrorCode,
  viewFromSession,
} from './features/checkout/mapCheckoutView.util';
export {
  STADIUM_MAP_WIDTHS,
  stadiumMapImageSrcSet,
  stadiumMapImageUrl,
} from './features/checkout/stadiumMapImage.util';
export { LISTINGS_COPY } from './features/listings/listings.copy';
export { DEMO_EVENT, LISTING_FIXTURES } from './features/listings/listings.fixtures';
export type {
  BubblePosition,
  EventFixture,
  ListingFixture,
  ListingRowView,
  SelectionViewModel,
} from './features/listings/listings.view-model';
export { mapListingsView } from './features/listings/mapListingsView.util';
