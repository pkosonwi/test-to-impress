import { ClothingCategory, SkinToneOption } from './types';

export const LIGHT_SKIN_MODEL_URLS = [
  '/assets/models/model1.png',
  '/assets/models/model2.png',
  '/assets/models/model3.png'
];

export const DARK_SKIN_MODEL_URLS = [
  '/assets/models/model4.jpeg',
  '/assets/models/model5.jpeg',
  '/assets/models/model6.jpeg'
];

export const SKIN_TONE_OPTIONS: SkinToneOption[] = [
    { id: 'light', name: 'Light', color: '#F2D3B8' },
    { id: 'dark', name: 'Dark', color: '#A17A5D' },
];

export const CLOTHING_CATEGORIES: { id: ClothingCategory; name: string }[] = [
    { id: 'shirts', name: 'Shirts' },
    { id: 'skirts', name: 'Skirts' },
    { id: 'leggings', name: 'Leggings' },
    { id: 'shoes', name: 'Shoes' },
];
