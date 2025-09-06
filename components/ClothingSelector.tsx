import React, { useState, useEffect } from 'react';
import type { ClothingCategory, ClothingItem } from '../types';
import { CheckIcon, OutfitIcon, UndoIcon } from './icons';

interface ClothingSelectorProps {
  categories: { id: ClothingCategory; name:string }[];
  clothingData: ClothingItem[];
  placedItemIds: string[];
  onItemSelect: (item: ClothingItem) => void;
  isLoading: boolean;
  isOutfitFinalized: boolean;
  onBackToStart: () => void;
  onGoToCheckout: () => void;
  onItemDragStart: () => void;
  onItemDragEnd: () => void;
}

interface ClothingItemCardProps {
    item: ClothingItem;
    isPlaced: boolean;
    onItemSelect: (item: ClothingItem) => void;
    isLoading: boolean;
    isOutfitFinalized: boolean;
    onDragStart: () => void;
    onDragEnd: () => void;
}

// Define component outside of the parent to avoid re-renders
const ClothingItemCard: React.FC<ClothingItemCardProps> = ({ item, isPlaced, onItemSelect, isLoading, isOutfitFinalized, onDragStart, onDragEnd }) => {
    const [imageSrc, setImageSrc] = useState(item.imageUrl);
    const [hasError, setHasError] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const fallbackImageUrl = 'https://cdn.discordapp.com/attachments/1413490323539361914/1413597855540580442/Classic_T-Shirt_--_Bright_White.png?ex=68bc8318&is=68bb3198&hm=d31feb24e13eab6abdc53102dc21419c66bd9404c3c0bb45fd986046d36b68f0&';

    // Reset image src and error state if the item prop changes
    useEffect(() => {
        setImageSrc(item.imageUrl);
        setHasError(false);
        setIsImageLoaded(false);
    }, [item.imageUrl]);

    const handleLoad = () => {
        setIsImageLoaded(true);
    };

    const handleError = () => {
        // Prevent infinite loop if fallback image also fails
        if (imageSrc !== fallbackImageUrl) {
            setHasError(true);
            setImageSrc(fallbackImageUrl);
        }
    };
    
    const handleDragStartInternal = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(); // Signal that dragging has started
    };

    const isDisabled = isLoading || hasError || !isImageLoaded || isOutfitFinalized;
    const isImageLoading = !isImageLoaded && !hasError;
    
    return (
        <div 
            onClick={() => !isDisabled && onItemSelect(item)}
            draggable={!isDisabled}
            onDragStart={(e) => !isDisabled && handleDragStartInternal(e)}
            onDragEnd={() => !isDisabled && onDragEnd()}
            className={`relative rounded-lg border-2 p-2 transition-all duration-200 ease-in-out bg-white
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer group hover:shadow-md hover:scale-105'}
                ${isPlaced && !hasError ? 'border-neutral-600' : 'border-transparent'}
                ${hasError ? 'opacity-60 grayscale' : ''}
            `}
        >
            {/* Skeleton loader */}
            {isImageLoading && (
                <div className="absolute inset-2" aria-hidden="true">
                    <div className="w-full aspect-square bg-neutral-200/80 rounded-md animate-pulse"></div>
                    <div className="mt-2 h-4 w-3/4 mx-auto bg-neutral-200/80 rounded animate-pulse"></div>
                    <div className="mt-1 h-3 w-1/4 mx-auto bg-neutral-200/80 rounded animate-pulse"></div>
                </div>
            )}
            
            {/* Content, hidden while loading */}
            <div className={`transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}>
                 <div className="w-full aspect-square rounded-md bg-neutral-100 flex items-center justify-center overflow-hidden">
                    <img 
                        src={imageSrc}
                        onLoad={handleLoad}
                        onError={handleError}
                        alt={item.name} 
                        className="w-full h-full object-contain pointer-events-none"
                    />
                </div>
                <p className="mt-2 text-sm font-medium text-neutral-800 text-center truncate">{item.name}</p>
                <p className="text-xs font-semibold text-neutral-600 text-center">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}</p>
            </div>
            
            {/* Overlays */}
            {hasError && (
                <div className="absolute top-2 left-2 right-2 aspect-square flex items-center justify-center bg-black/50 rounded-md z-10 pointer-events-none">
                    <p className="text-white text-xs font-bold px-2 text-center leading-tight">Load failed</p>
                </div>
            )}
            {isPlaced && !hasError && isImageLoaded && (
                <div className="absolute top-2 right-2 bg-neutral-600 text-white rounded-md p-1 shadow">
                    <CheckIcon className="w-4 h-4" />
                </div>
            )}
        </div>
    );
};

export const ClothingSelector: React.FC<ClothingSelectorProps> = ({ categories, clothingData, placedItemIds, onItemSelect, isLoading, isOutfitFinalized, onBackToStart, onGoToCheckout, onItemDragStart, onItemDragEnd }) => {
  const [activeTab, setActiveTab] = useState<ClothingCategory>(categories[0].id);

  const filteredItems = clothingData.filter(item => item.category === activeTab);
  const placedIdSet = new Set(placedItemIds);

  return (
    <div className="relative flex flex-col h-full">
      {isOutfitFinalized && (
        <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center text-center p-4 rounded-lg">
          <p className="font-semibold text-neutral-800">Outfit Applied!</p>
          <p className="text-sm text-neutral-600 mt-1">Undo or start over to create a new look.</p>
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={onBackToStart}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm font-semibold hover:bg-neutral-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
            >
              <UndoIcon className="w-4 h-4 mr-2" />
              Back to Start
            </button>
            <button
                onClick={onGoToCheckout}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400"
            >
                <OutfitIcon className="w-4 h-4 mr-2" />
                Go to checkout
            </button>
          </div>
        </div>
      )}
      <div className="flex-shrink-0 p-1.5 bg-neutral-100/30 rounded-lg">
        <nav className="flex items-center justify-between space-x-1" aria-label="Tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`${
                activeTab === category.id
                  ? 'bg-white text-neutral-800 shadow'
                  : 'text-neutral-500 hover:text-neutral-700'
              } flex-1 whitespace-nowrap py-2 px-1 rounded-md font-semibold text-sm transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-400`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-4 overflow-y-auto flex-grow">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-4">
          {filteredItems.map(item => (
            <ClothingItemCard 
                key={item.id}
                item={item}
                isPlaced={placedIdSet.has(item.id)}
                onItemSelect={onItemSelect}
                isLoading={isLoading}
                isOutfitFinalized={isOutfitFinalized}
                onDragStart={onItemDragStart}
                onDragEnd={onItemDragEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
};