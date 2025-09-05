
export type ClothingCategory = 'shirts' | 'skirts' | 'leggings' | 'shoes';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  imageUrl: string;
}

export interface PlacedItemData {
  id: string; // Unique instance ID
  itemId: string; // Original clothing item ID
  name: string;
  imageUrl: string;
  processedImageUrl: string; // With background removed
  category: ClothingCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}
