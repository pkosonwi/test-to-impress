
import { ClothingCategory } from './types';

// WARNING: These image URLs are hosted on Discord and may expire or be blocked by CORS policies.
// For a production application, host these images on a reliable CDN with proper CORS headers.
export const BASE_MODEL_URLS = [
  'https://cdn.discordapp.com/attachments/1413490323539361914/1413490529332760752/Gemini_Generated_Image_xrz732xrz732xrz7.png?ex=68bc1f23&is=68bacda3&hm=2e9e20a0061eb073ec4d85f0decab78e098582dbd91baca1913cd6e3104f6e4d&',
  'https://cdn.discordapp.com/attachments/1413490323539361914/1413490529764642906/Gemini_Generated_Image_sqk5z8sqk5z8sqk5.png?ex=68bc1f23&is=68bacda3&hm=5ad1785f06ea5ff197f9f0f39192c4571ba3ebad847d6e85ee2688873f28d01c&',
  'https://cdn.discordapp.com/attachments/1413490323539361914/1413490530188263434/Gemini_Generated_Image_1zy9c1zy9c1zy9c1.png?ex=68bc1f23&is=68bacda3&hm=47240b65b4f057f52d72f6a7fd25920ea0d6ef2d8d88ca3ad1151f21ece53c50&'
];

export const CLOTHING_CATEGORIES: { id: ClothingCategory; name: string }[] = [
    { id: 'shirts', name: 'Shirts' },
    { id: 'skirts', name: 'Skirts' },
    { id: 'leggings', name: 'Leggings' },
    { id: 'shoes', name: 'Shoes' },
];
