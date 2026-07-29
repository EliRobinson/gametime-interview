import { DEMO_PRICE_CHANGE } from '@repo/api-contracts';

export interface InventoryHoldStatus {
  held: boolean;
  currentPrice: number;
}

export interface ListingAvailabilityRow {
  listingId: string;
  priceCents: number;
  available: boolean;
}

export interface InventoryProvider {
  getHoldStatus(listingId: string): Promise<InventoryHoldStatus>;
  placeHold(listingId: string): Promise<{ price: number }>;
  releaseHold(listingId: string): Promise<void>;
  listListings(): Promise<ListingAvailabilityRow[]>;
}

export class ListingAlreadyHeldError extends Error {
  constructor(listingId: string) {
    super(`Listing already held: ${listingId}`);
  }
}

type FakeInventoryOptions = {
  /** Injectable clock for the demo timed price bump. */
  now?: () => number;
};

export class FakeInventoryProvider implements InventoryProvider {
  private basePrices = new Map<string, number>();
  private overridePrices = new Map<string, number>();
  private held = new Set<string>();
  private holdStartedAtMs = new Map<string, number>();
  private readonly now: () => number;

  constructor(options: FakeInventoryOptions = {}) {
    this.now = options.now ?? Date.now;
  }

  seedListing(listingId: string, price: number): void {
    this.basePrices.set(listingId, price);
  }

  setPrice(listingId: string, price: number): void {
    this.overridePrices.set(listingId, price);
  }

  releaseListing(listingId: string): void {
    this.clearHold(listingId);
  }

  async placeHold(listingId: string): Promise<{ price: number }> {
    const price = this.catalogPrice(listingId);
    if (price === undefined) throw new Error(`Unknown listing: ${listingId}`);
    if (this.held.has(listingId)) throw new ListingAlreadyHeldError(listingId);
    this.held.add(listingId);
    this.holdStartedAtMs.set(listingId, this.now());
    return { price };
  }

  async getHoldStatus(listingId: string): Promise<InventoryHoldStatus> {
    return {
      held: this.held.has(listingId),
      currentPrice: this.heldPrice(listingId) ?? 0,
    };
  }

  async releaseHold(listingId: string): Promise<void> {
    this.clearHold(listingId);
  }

  async listListings(): Promise<ListingAvailabilityRow[]> {
    return [...this.basePrices.keys()].map((listingId) => {
      const priceCents = this.catalogPrice(listingId) ?? 0;
      return {
        listingId,
        priceCents,
        available: !this.held.has(listingId),
      };
    });
  }

  /** Price shown on the selection catalog — never the demo hold bump. */
  private catalogPrice(listingId: string): number | undefined {
    return this.overridePrices.get(listingId) ?? this.basePrices.get(listingId);
  }

  /**
   * Live price under a hold. The demo listing ages into a higher price so
   * complete/confirm can surface reconfirmation without a manual `setPrice`.
   */
  private heldPrice(listingId: string): number | undefined {
    const override = this.overridePrices.get(listingId);
    if (override !== undefined) return override;

    if (
      listingId === DEMO_PRICE_CHANGE.listingId &&
      this.held.has(listingId) &&
      this.demoBumpIsDue(listingId)
    ) {
      return DEMO_PRICE_CHANGE.heldPriceAfterBumpCents;
    }

    return this.basePrices.get(listingId);
  }

  private demoBumpIsDue(listingId: string): boolean {
    const startedAt = this.holdStartedAtMs.get(listingId);
    if (startedAt === undefined) return false;
    return this.now() - startedAt >= DEMO_PRICE_CHANGE.afterMs;
  }

  private clearHold(listingId: string): void {
    this.held.delete(listingId);
    this.holdStartedAtMs.delete(listingId);
  }
}
