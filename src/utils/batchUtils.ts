import { InventoryBatch, Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/seedData';

/**
 * Generate or retrieve a short, unique key code for a product.
 * Examples:
 * - "Blueberry Cold Cheesecake Slices" -> "BCC"
 * - "Brownies Cheesecake Slices" -> "BCS"
 * - "Death By Chocolate Cake (1500gm)" -> "DBC"
 * - "Red velvet cake (1500gm)" -> "RVC"
 * - "Mocha Cake" -> "MC"
 */
export function getProductKeyCode(productName: string, products?: Product[]): string {
  if (!productName || !productName.trim()) return 'PRD';
  const trimmed = productName.trim();

  // 1. Check if configured in products catalog
  if (products && products.length > 0) {
    const found = products.find(p => p.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (found?.keyCode && found.keyCode.trim()) {
      return found.keyCode.trim().toUpperCase();
    }
  }

  // 2. Check in INITIAL_PRODUCTS
  const init = INITIAL_PRODUCTS.find(p => p.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (init && (init as any).keyCode) {
    return (init as any).keyCode.trim().toUpperCase();
  }

  // 3. Fallback: Intelligent acronym generation from product words
  // Remove weights, numbers, units, and punctuation
  const clean = trimmed
    .replace(/\([^)]*\)/g, '')
    .replace(/[0-9]+(?:gm|gr|g|kg|ml|l|pack|slices)?/gi, '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim();

  const stopWords = new Set(['and', 'with', 'the', 'in', 'of', 'for', 'by', 'slices', 'cake', 'items']);
  const words = clean
    .split(/\s+/)
    .filter(w => w.length > 0 && !stopWords.has(w.toLowerCase()));

  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }

  return 'PRD';
}

/**
 * Calculates the next sequential batch number for a specific product.
 * Batch numbers are strictly unique to each product, short, and concise.
 *
 * Example:
 * - Blueberry Cold Cheesecake Slices: BCC-01, BCC-02, BCC-03 ...
 * - Mocha Cake: MC-01, MC-02, MC-03 ...
 *
 * "once i created a batch then after next batch onwards it follows that code list as simultaneously likewise"
 */
export function getNextBatchNumberForProduct(
  productName: string,
  batches: InventoryBatch[],
  products?: Product[]
): string {
  if (!productName || !productName.trim()) return 'B-01';
  const trimmed = productName.trim().toLowerCase();

  const defaultKey = getProductKeyCode(productName, products);

  // Filter batches to only those belonging to this specific product
  const productBatches = batches.filter(
    b => b.productName && b.productName.trim().toLowerCase() === trimmed
  );

  if (productBatches.length === 0) {
    return `${defaultKey}-01`;
  }

  let maxNum = 0;
  let activePrefix = defaultKey;
  let padLength = 2;
  let foundMatchingPattern = false;

  // Inspect existing batch numbers for this product
  for (const b of productBatches) {
    const raw = b.batchNo ? b.batchNo.trim() : '';
    if (!raw) continue;

    // Pattern 1: <PREFIX>-<NUMBER> (e.g. BCC-01, MC-05, MOC-101)
    const matchPrefixDash = raw.match(/^([A-Za-z0-9_]+)-(\d+)$/);
    if (matchPrefixDash) {
      const prefix = matchPrefixDash[1];
      const digits = matchPrefixDash[2];
      const num = parseInt(digits, 10);

      // Skip old legacy format B-2025 or B-2026 if we have modern short key codes
      if (!prefix.startsWith('B-20')) {
        foundMatchingPattern = true;
        activePrefix = prefix.toUpperCase();
        if (num > maxNum) {
          maxNum = num;
          padLength = Math.max(2, digits.length);
        }
      }
      continue;
    }

    // Pattern 2: <PREFIX><NUMBER> (e.g. MC01, BCC02)
    const matchPrefixNoDash = raw.match(/^([A-Za-z]+)(\d+)$/);
    if (matchPrefixNoDash) {
      const prefix = matchPrefixNoDash[1];
      const digits = matchPrefixNoDash[2];
      const num = parseInt(digits, 10);
      foundMatchingPattern = true;
      activePrefix = prefix.toUpperCase();
      if (num > maxNum) {
        maxNum = num;
        padLength = Math.max(2, digits.length);
      }
    }
  }

  if (foundMatchingPattern && maxNum > 0) {
    const nextNum = maxNum + 1;
    return `${activePrefix}-${String(nextNum).padStart(padLength, '0')}`;
  }

  // If existing batches only had legacy B-2025-XXXX numbers, transition cleanly to the short key code
  const nextSeq = productBatches.length + 1;
  return `${defaultKey}-${String(nextSeq).padStart(2, '0')}`;
}
