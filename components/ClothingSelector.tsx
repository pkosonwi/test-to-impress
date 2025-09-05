
import React, { useState } from 'react';
import type { ClothingCategory, ClothingItem } from '../types';
import { CheckIcon } from './icons';

interface ClothingSelectorProps {
  categories: { id: ClothingCategory; name:string }[];
  clothingData: ClothingItem[];
  placedItemIds: string[];
  onItemSelect: (item: ClothingItem) => void;
  isLoading: boolean;
}

interface ClothingItemCardProps {
    item: ClothingItem;
    isPlaced: boolean;
    onItemSelect: (item: ClothingItem) => void;
    isLoading: boolean;
}

// Define component outside of the parent to avoid re-renders
const ClothingItemCard: React.FC<ClothingItemCardProps> = ({ item, isPlaced, onItemSelect, isLoading }) => {
    return (
        <div 
            onClick={() => !isLoading && onItemSelect(item)}
            className={`relative rounded-lg border-2 p-2 transition-all duration-200 ease-in-out ${
                isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer group transform hover:scale-105'
            } ${isPlaced ? 'border-neutral-900 bg-white/80' : 'border-transparent bg-white/60 hover:shadow-md'}`}
        >
            <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-full h-32 object-cover rounded-md pointer-events-none"
            />
            <p className="mt-2 text-sm font-medium text-neutral-800 text-center truncate">{item.name}</p>
            {isPlaced && (
                <div className="absolute top-2 right-2 bg-neutral-900 text-white rounded-md p-1 shadow">
                    <CheckIcon className="w-4 h-4" />
                </div>
            )}
        </div>
    );
};

export const ClothingSelector: React.FC<ClothingSelectorProps> = ({ categories, clothingData, placedItemIds, onItemSelect, isLoading }) => {
  const [activeTab, setActiveTab] = useState<ClothingCategory>(categories[0].id);

  const filteredItems = clothingData.filter(item => item.category === activeTab);
  const placedIdSet = new Set(placedItemIds);

  return (
    <div className="flex flex-col h-full bg-white/40 backdrop-blur-2xl rounded-xl shadow-lg border border-white/20 p-4">
      <div className="flex-shrink-0 p-1.5 bg-neutral-900/5 rounded-lg">
        <nav className="flex items-center justify-between space-x-1" aria-label="Tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`${
                activeTab === category.id
                  ? 'bg-white text-neutral-900 shadow'
                  : 'text-neutral-500 hover:text-neutral-800'
              } flex-1 whitespace-nowrap py-2 px-1 rounded-md font-semibold text-sm transition-all duration-300 ease-in-out focus:outline-none`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-4 overflow-y-auto flex-grow">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <ClothingItemCard 
                key={item.id}
                item={item}
                isPlaced={placedIdSet.has(item.id)}
                onItemSelect={onItemSelect}
                isLoading={isLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
