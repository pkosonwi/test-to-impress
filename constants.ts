
import { ClothingCategory } from './types';

// WARNING: These image URLs are hosted on Discord and may expire or be blocked by CORS policies.
// For a production application, host these images on a reliable CDN with proper CORS headers.
export const BASE_MODEL_URLS = [
  'https://cdn.discordapp.com/attachments/1413490323539361914/1413490529332760752/Gemini_Generated_Image_xrz732xrz732xrz7.png?ex=68bcc7e3&is=68bb7663&hm=d3fb463731c3648a33fbc2282689b75ddb7bb789e53f065c6653793d04df6df3&',
  'https://cdn.discordapp.com/attachments/1413490323539361914/1413490529764642906/Gemini_Generated_Image_sqk5z8sqk5z8sqk5.png?ex=68bcc7e3&is=68bb7663&hm=2c0ad5368b21d2eaa9a7b5456076eadad652fbc92332d70ca70e1fc7f9eaae4a&',
  'https://cdn.discordapp.com/attachments/1413490323539361914/1413490530188263434/Gemini_Generated_Image_1zy9c1zy9c1zy9c1.png?ex=68bcc7e3&is=68bb7663&hm=7c41d9f0278c843baf37210e2122bbec531f38bf14d915fc5c9aa1f4daff9bcb&'
];

export const CLOTHING_CATEGORIES: { id: ClothingCategory; name: string }[] = [
    { id: 'shirts', name: 'Shirts' },
    { id: 'skirts', name: 'Skirts' },
    { id: 'leggings', name: 'Leggings' },
    { id: 'shoes', name: 'Shoes' },
];
