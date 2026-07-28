export interface InventoryHoldStatus {
  held: boolean;
  currentPrice: number;
}

export interface InventoryProvider {
  getHoldStatus(listingId: string): Promise<InventoryHoldStatus>;
  placeHold(listingId: string): Promise<{ price: number }>;
  releaseHold(listingId: string): Promise<void>;
}

export class FakeInventoryProvider implements InventoryProvider {
  private basePrices = new Map<string, number>();
  private overridePrices = new Map<string, number>();
  private held = new Set<string>();

  seedListing(listingId: string, price: number): void {
    this.basePrices.set(listingId, price);
  }

  setPrice(listingId: string, price: number): void {
    this.overridePrices.set(listingId, price);
  }

  releaseListing(listingId: string): void {
    this.held.delete(listingId);
  }

  async placeHold(listingId: string): Promise<{ price: number }> {
    const price = this.currentPrice(listingId);
    if (price === undefined) throw new Error(`Unknown listing: ${listingId}`);
    this.held.add(listingId);
    return { price };
  }

  async getHoldStatus(listingId: string): Promise<InventoryHoldStatus> {
    return {
      held: this.held.has(listingId),
      currentPrice: this.currentPrice(listingId) ?? 0,
    };
  }

  async releaseHold(listingId: string): Promise<void> {
    this.held.delete(listingId);
  }

  private currentPrice(listingId: string): number | undefined {
    return this.overridePrices.get(listingId) ?? this.basePrices.get(listingId);
  }
}
