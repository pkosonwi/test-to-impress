import type { ClothingItem } from '../types';

// WARNING: These image URLs are hosted on Unsplash.
// For a production application, host these images on a reliable CDN to ensure stability and performance.
// Hotlinking from services like Unsplash is not recommended for production environments.
export const clothingData: ClothingItem[] = [
  // Shirts
  {
    id: 'shirt-1',
    name: 'Classic Black Tee',
    category: 'shirts',
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&h=200&fit=crop&q=80',
  },
  {
    id: 'shirt-2',
    name: 'Striped Blouse',
    category: 'shirts',
    imageUrl: 'https://images.unsplash.com/photo-1550838234-399a31442754?w=200&h=200&fit=crop&q=80',
  },
  {
    id: 'shirt-3',
    name: 'Graphic Hoodie',
    category: 'shirts',
    imageUrl: 'https://images.unsplash.com/photo-1556821855-0d055454652e?w=200&h=200&fit=crop&q=80',
  },
  // Skirts
  {
    id: 'skirt-1',
    name: 'Denim Skirt',
    category: 'skirts',
    imageUrl: 'https://images.unsplash.com/photo-1594223193853-f0e21961858a?w=200&h=200&fit=crop&q=80',
  },
  {
    id: 'skirt-2',
    name: 'Pleated Midi',
    category: 'skirts',
    imageUrl: 'https://images.unsplash.com/photo-1589465715979-382f61b28f85?w=200&h=200&fit=crop&q=80',
  },
  {
    id: 'skirt-3',
    name: 'Leather Skirt',
    category: 'skirts',
    imageUrl: 'https://images.unsplash.com/photo-1603923985338-36a7aab15b49?w=200&h=200&fit=crop&q=80',
  },
  // Leggings
  {
    id: 'leggings-1',
    name: 'Black Leggings',
    category: 'leggings',
    imageUrl: 'https://images.unsplash.com/photo-1603241324352-cf8a5b25a3a0?w=200&h=200&fit=crop&q=80',
  },
  {
    id: 'leggings-2',
    name: 'Patterned Leggings',
    category: 'leggings',
    imageUrl: 'https://images.unsplash.com/photo-1612871689353-cccf271d5248?w=200&h=200&fit=crop&q=80',
  },
  // Shoes
  {
    id: 'shoes-1',
    name: 'White Sneakers',
    category: 'shoes',
    imageUrl: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=200&h=200&fit=crop&q=80',
  },
  {
    id: 'shoes-2',
    name: 'Ankle Boots',
    category: 'shoes',
    imageUrl: 'https://images.unsplash.com/photo-1605346337827-dd547a46f481?w=200&h=200&fit=crop&q=80',
  },
];