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
    price: 25.00,
    checkoutUrl: 'https://example.com/checkout/shirt-1',
  },
  {
    id: 'shirt-2',
    name: 'Shirt 2',
    category: 'shirts',
    imageUrl: 'https://down-bs-th.img.susercontent.com/sg-11134201-7rdw2-mcls1l0bkg2c09.webp',
    price: 32.50,
    checkoutUrl: 'https://example.com/checkout/shirt-2',
  },
  {
    id: 'shirt-3',
    name: 'Shirt 3',
    category: 'shirts',
    imageUrl: 'https://down-ws-th.img.susercontent.com/th-11134207-7rasj-m3rkw3jtd7jb9b.webp',
    price: 45.00,
    checkoutUrl: 'https://s.shopee.co.th/2Vi7o436HZ',
  },
  // Skirts
  {
    id: 'skirt-1',
    name: 'Denim Skirt',
    category: 'skirts',
    imageUrl: 'https://images.unsplash.com/photo-1594223193853-f0e21961858a?w=200&h=200&fit=crop&q=80',
    price: 39.99,
    checkoutUrl: 'https://example.com/checkout/skirt-1',
  },
  {
    id: 'skirt-2',
    name: 'Pleated Midi',
    category: 'skirts',
    imageUrl: 'https://images.unsplash.com/photo-1589465715979-382f61b28f85?w=200&h=200&fit=crop&q=80',
    price: 49.99,
    checkoutUrl: 'https://example.com/checkout/skirt-2',
  },
  {
    id: 'skirt-3',
    name: 'Leather Skirt',
    category: 'skirts',
    imageUrl: 'https://images.unsplash.com/photo-1603923985338-36a7aab15b49?w=200&h=200&fit=crop&q=80',
    price: 55.00,
    checkoutUrl: 'https://example.com/checkout/skirt-3',
  },
  // Leggings
  {
    id: 'leggings-1',
    name: 'Leggings 1',
    category: 'leggings',
    imageUrl: 'https://down-ws-th.img.susercontent.com/th-11134207-7ra0u-md4bjsb2y1jy06.webp',
    price: 29.00,
    checkoutUrl: 'https://example.com/checkout/leggings-1',
  },
  {
    id: 'leggings-2',
    name: 'Patterned Leggings',
    category: 'leggings',
    imageUrl: 'https://images.unsplash.com/photo-1612871689353-cccf271d5248?w=200&h=200&fit=crop&q=80',
    price: 35.00,
    checkoutUrl: 'https://example.com/checkout/leggings-2',
  },
  // Shoes
  {
    id: 'shoes-1',
    name: 'White Sneakers',
    category: 'shoes',
    imageUrl: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=200&h=200&fit=crop&q=80',
    price: 65.00,
    checkoutUrl: 'https://example.com/checkout/shoes-1',
  },
  {
    id: 'shoes-2',
    name: 'Ankle Boots',
    category: 'shoes',
    imageUrl: 'https://images.unsplash.com/photo-1605346337827-dd547a46f481?w=200&h=200&fit=crop&q=80',
    price: 89.99,
    checkoutUrl: 'https://example.com/checkout/shoes-2',
  },
];