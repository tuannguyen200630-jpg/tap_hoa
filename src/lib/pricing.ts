/**
 * Calculate new suggested sell price based on cost change.
 * 
 * Formula (auto mode):
 *   new_price = roundUpToStep(base_price + (new_cost - base_cost))
 * 
 * Always calculates from base (anchor) values, never cumulative.
 * 
 * @param baseCost - Anchor cost (giá nhập cơ bản)
 * @param basePrice - Anchor price (giá bán cơ bản)
 * @param newCost - New purchase cost
 * @param roundingStep - Rounding step (default 500)
 * @returns Suggested new sell price (rounded up to step)
 */
export function calculateSuggestedPrice(
  baseCost: number,
  basePrice: number,
  newCost: number,
  roundingStep: number = 500
): number {
  const rawPrice = basePrice + (newCost - baseCost)
  return roundUpToStep(rawPrice, roundingStep)
}

/**
 * Round up to the nearest step.
 * 12300 with step 500 → 12500
 * 14000 with step 500 → 14000 (already on step)
 * 8000 with step 500 → 8000 (already on step)
 */
export function roundUpToStep(value: number, step: number): number {
  if (step <= 0) return value
  return Math.ceil(value / step) * step
}

/**
 * Check if cost has changed from base cost.
 */
export function hasCostChanged(baseCost: number, newCost: number): boolean {
  return baseCost !== newCost
}

/**
 * Check if the suggested price is at or below cost (dangerous - selling at a loss).
 */
export function isPriceBelowOrEqualCost(price: number, cost: number): boolean {
  return price <= cost
}

/**
 * Determine new base values after user confirms price.
 * 
 * Rules:
 * - If user accepts the exact suggested price → keep old base values
 * - If user modifies the price or keeps old price → set new base: baseCost=newCost, basePrice=confirmedPrice
 */
export function getNewBaseValues(
  oldBaseCost: number,
  oldBasePrice: number,
  newCost: number,
  suggestedPrice: number,
  confirmedPrice: number
): { baseCost: number; basePrice: number } {
  if (confirmedPrice === suggestedPrice) {
    // User accepted suggestion exactly → keep old base
    return { baseCost: oldBaseCost, basePrice: oldBasePrice }
  }
  // User modified price or kept old price → reset base
  return { baseCost: newCost, basePrice: confirmedPrice }
}
