import supabase from '../utils/supabase';
import type { ClothingItem, ClothingCategory } from '../types';
import { clothingData as fallbackData } from '../data/clothing';

interface ClothingRow {
    id: string;
    name: string;
    price: number;
    type: ClothingCategory;
    image_uri: string;
    shop_uri: string;
}

export const fetchClothingData = async (): Promise<ClothingItem[]> => {
    try {
        const { data, error } = await supabase
            .from('clothings')
            .select('id, name, price, type, image_uri, shop_uri');

        if (error) {
            console.warn("Could not fetch data from Supabase, falling back to local data. Error:", error.message);
            return fallbackData;
        }

        if (!data) {
            return [];
        }

        // Map the Supabase row format to the application's ClothingItem format
        const clothingItems: ClothingItem[] = data.map((row: ClothingRow) => ({
            id: row.id,
            name: row.name,
            category: row.type,
            imageUrl: row.image_uri,
            price: row.price,
            checkoutUrl: row.shop_uri,
        }));

        return clothingItems;
    } catch (e) {
        console.error("Failed to connect to Supabase, falling back to local data.", e);
        return fallbackData;
    }
};
