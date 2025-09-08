
export type ClothingCategory = 'shirts' | 'skirts' | 'leggings' | 'shoes';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  imageUrl: string;
  price: number;
  checkoutUrl: string;
}

export interface PlacedItemData {
  id: string; // Unique instance ID
  itemId: string; // Original clothing item ID
  name: string;
  imageUrl: string;
  processedImageUrl: string; // With background removed
  category: ClothingCategory;
  price: number;
  checkoutUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export type SkinTone = 'light' | 'dark';

export interface SkinToneOption {
  id: SkinTone;
  name: string;
  color: string;
}
