/**
 * Utility functions for promotional offers
 * Arboveya Tier System:
 * - Buy 2: Buy 2 Get {X}% Off
 * - Buy 3: Buy 3 Get {Y}% Off
 * - Buy more than 3: Buy more than 3 Get {Z}% Off (valid for 4, 5, ..., 10, etc.)
 */

export interface ProductOfferTier {
  id: 'buy2' | 'buy3' | 'buyMore';
  label: string; // e.g. "Buy 2 Get 10% Off"
  minQty: number; // 2 for buy2, 3 for buy3, 4 for buyMore
  percentage: number;
}

/**
 * Parses all enabled offer tiers from offerName string
 * (Format e.g.: "Buy 2 Get 10% Off | Buy 3 Get 15% Off | Buy more than 3 Get 20% Off")
 */
export function parseOfferTiers(offerName?: string, defaultDiscount?: number): ProductOfferTier[] {
  if (!offerName || !offerName.trim()) return [];

  const tiers: ProductOfferTier[] = [];
  const parts = offerName.split(/[|;,]/).map(p => p.trim()).filter(Boolean);

  for (const part of parts) {
    // Check for "Buy more than 3" or "Buy >3" or "Buy 4+"
    const matchMore = part.match(/buy\s*(?:more\s*than\s*3|>3|4\+?)\s*get\s*(\d+(?:\.\d+)?)%/i);
    if (matchMore) {
      const pct = parseFloat(matchMore[1]);
      if (!isNaN(pct) && pct > 0) {
        tiers.push({
          id: 'buyMore',
          label: `Buy more than 3 Get ${pct}% Off`,
          minQty: 4,
          percentage: pct
        });
        continue;
      }
    }

    // Check for "Buy 3"
    const match3 = part.match(/buy\s*3\s*get\s*(\d+(?:\.\d+)?)%/i);
    if (match3) {
      const pct = parseFloat(match3[1]);
      if (!isNaN(pct) && pct > 0) {
        tiers.push({
          id: 'buy3',
          label: `Buy 3 Get ${pct}% Off`,
          minQty: 3,
          percentage: pct
        });
        continue;
      }
    }

    // Check for "Buy 2"
    const match2 = part.match(/buy\s*2\s*get\s*(\d+(?:\.\d+)?)%/i);
    if (match2) {
      const pct = parseFloat(match2[1]);
      if (!isNaN(pct) && pct > 0) {
        tiers.push({
          id: 'buy2',
          label: `Buy 2 Get ${pct}% Off`,
          minQty: 2,
          percentage: pct
        });
        continue;
      }
    }

    // Generic fallback for any other "Buy X Get Y% Off"
    const genericMatch = part.match(/buy\s*(\d+)\s*get\s*(\d+(?:\.\d+)?)%/i);
    if (genericMatch) {
      const qty = parseInt(genericMatch[1], 10);
      const pct = parseFloat(genericMatch[2]);
      if (!isNaN(qty) && !isNaN(pct) && pct > 0) {
        tiers.push({
          id: qty === 2 ? 'buy2' : qty === 3 ? 'buy3' : 'buyMore',
          label: qty > 3 ? `Buy more than 3 Get ${pct}% Off` : `Buy ${qty} Get ${pct}% Off`,
          minQty: qty,
          percentage: pct
        });
        continue;
      }
    }
  }

  // If no tier matched from parts but defaultDiscount > 0, attempt single offer recovery
  if (tiers.length === 0 && defaultDiscount && defaultDiscount > 0) {
    const rawMatch = offerName.match(/buy\s*(\d+)/i);
    const qty = rawMatch ? parseInt(rawMatch[1], 10) : 2;
    tiers.push({
      id: qty === 2 ? 'buy2' : qty === 3 ? 'buy3' : 'buyMore',
      label: qty > 3 ? `Buy more than 3 Get ${defaultDiscount}% Off` : `Buy ${qty} Get ${defaultDiscount}% Off`,
      minQty: qty,
      percentage: defaultDiscount
    });
  }

  // De-duplicate by id (keep latest)
  const map = new Map<'buy2' | 'buy3' | 'buyMore', ProductOfferTier>();
  for (const t of tiers) {
    map.set(t.id, t);
  }

  return Array.from(map.values()).sort((a, b) => a.minQty - b.minQty);
}

/**
 * Returns the best active tier for a given purchase quantity.
 * For example:
 * - quantity = 1 => null
 * - quantity = 2 => buy2 (if enabled)
 * - quantity = 3 => buy3 (if enabled) else buy2
 * - quantity = 10 => buyMore (if enabled) else buy3 else buy2
 */
export function getActiveOfferTierForQuantity(
  tiers: ProductOfferTier[],
  quantity: number
): ProductOfferTier | null {
  if (!tiers || tiers.length === 0 || quantity < 2) return null;

  const qualifying = tiers.filter(t => quantity >= t.minQty);
  if (qualifying.length === 0) return null;

  // Pick highest minQty tier (e.g. buyMore for 10 items)
  qualifying.sort((a, b) => b.minQty - a.minQty || b.percentage - a.percentage);
  return qualifying[0];
}

/**
 * Backward compatible minimum quantity parser
 */
export function parseOfferMinQuantity(offerName?: string): number {
  if (!offerName) return 1;
  const tiers = parseOfferTiers(offerName);
  if (tiers.length > 0) {
    return Math.min(...tiers.map(t => t.minQty));
  }
  return 1;
}

export function isOfferActiveForQuantity(offerName?: string, discountPercentage?: number, quantity: number = 1): boolean {
  const tiers = parseOfferTiers(offerName, discountPercentage);
  return getActiveOfferTierForQuantity(tiers, quantity) !== null;
}

export function calculateEffectivePrice(
  rawPrice: number,
  discountPercentage?: number,
  offerName?: string,
  quantity: number = 1
): {
  unitPrice: number;
  totalPrice: number;
  isDiscountApplied: boolean;
  activeTier: ProductOfferTier | null;
  allTiers: ProductOfferTier[];
  discountPercentage: number;
  savingsTotal: number;
} {
  const allTiers = parseOfferTiers(offerName, discountPercentage);
  const activeTier = getActiveOfferTierForQuantity(allTiers, quantity);

  if (activeTier) {
    const pct = activeTier.percentage;
    const unitPrice = rawPrice * (1 - pct / 100);
    const totalPrice = unitPrice * quantity;
    const rawTotal = rawPrice * quantity;
    const savingsTotal = Math.max(0, rawTotal - totalPrice);

    return {
      unitPrice,
      totalPrice,
      isDiscountApplied: true,
      activeTier,
      allTiers,
      discountPercentage: pct,
      savingsTotal
    };
  }

  return {
    unitPrice: rawPrice,
    totalPrice: rawPrice * quantity,
    isDiscountApplied: false,
    activeTier: null,
    allTiers,
    discountPercentage: 0,
    savingsTotal: 0
  };
}
