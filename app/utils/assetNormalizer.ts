/**
 * Asset normalization utility
 * Combines similar assets (e.g., BETH and ETH) into a single normalized asset name
 */

// Define asset normalization rules
const ASSET_NORMALIZATION_MAP: Record<string, string> = {
  'BETH': 'ETH',
  // Add more normalization rules here as needed
  // 'BXXX': 'XXX',
  // 'WXXX': 'XXX',
  // etc.
};

/**
 * Normalizes an asset name by applying predefined normalization rules
 * @param assetName The original asset name
 * @returns The normalized asset name
 */
export function normalizeAssetName(assetName: string): string {
  return ASSET_NORMALIZATION_MAP[assetName] || assetName;
}

/**
 * Interface for combined asset data structure
 */
export interface CombinedAssetData {
  asset: string;
  spotBalance: number;
  spotNotional: number;
  futuresSide: string;
  futuresNotional: number;
  initialMargin: number;
}

/**
 * Combines assets with the same normalized name, properly aggregating their values
 * @param assets Array of asset data objects
 * @returns Array of combined assets
 */
export function combineAssetData(assets: CombinedAssetData[]): CombinedAssetData[] {
  const combinedMap = new Map<string, CombinedAssetData>();
  
  for (const asset of assets) {
    const normalizedName = normalizeAssetName(asset.asset);
    const existingAsset = combinedMap.get(normalizedName);
    
    if (existingAsset) {
      // Combine the assets by summing their values
      combinedMap.set(normalizedName, {
        asset: normalizedName,
        spotBalance: existingAsset.spotBalance + asset.spotBalance,
        spotNotional: existingAsset.spotNotional + asset.spotNotional,
        // For futures, we need to handle the side and notional carefully
        futuresSide: asset.futuresSide || existingAsset.futuresSide,
        futuresNotional: existingAsset.futuresNotional + asset.futuresNotional,
        initialMargin: existingAsset.initialMargin + asset.initialMargin
      });
    } else {
      // First occurrence of this normalized asset
      combinedMap.set(normalizedName, {
        ...asset,
        asset: normalizedName
      });
    }
  }
  
  return Array.from(combinedMap.values());
} 