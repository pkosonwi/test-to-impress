

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ClothingCategory, ClothingItem } from '../types';
import { CheckIcon, OutfitIcon, UndoIcon } from './icons';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: { min: number; max: number };
  onChange: (newValue: { min: number; max: number }) => void;
  step?: number;
  disabled?: boolean;
}

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({ min, max, value, onChange, step = 1, disabled = false }) => {
    const minPos = max > min ? ((value.min - min) / (max - min)) * 100 : 0;
    const maxPos = max > min ? ((value.max - min) / (max - min)) * 100 : 100;

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Math.min(Number(e.target.value), value.max - step);
        onChange({ ...value, min: newMin });
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Math.max(Number(e.target.value), value.min + step);
        onChange({ ...value, max: newMax });
    };

    return (
        <div className={`mb-4 transition-opacity duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-neutral-800">Price Range</span>
                <div className="text-xs font-medium bg-white/80 px-2 py-1 rounded-md shadow-sm border border-neutral-200/50">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value.min)} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value.max)}
                </div>
            </div>
            <div className="relative h-5 flex items-center">
                <div className="relative w-full h-full">
                    {/* Track */}
                    <div className="absolute top-1/2 -translate-y-1/2 h-1.5 w-full bg-neutral-200 rounded-full"></div>
                    {/* Selected Range */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-neutral-800 rounded-full"
                        style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
                    ></div>
                    {/* Sliders */}
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value.min}
                        onChange={handleMinChange}
                        className="thumb-slider"
                        aria-label="Minimum price"
                        disabled={disabled}
                    />
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value.max}
                        onChange={handleMaxChange}
                        className="thumb-slider"
                        aria-label="Maximum price"
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
};


interface ClothingSelectorProps {
  categories: { id: ClothingCategory; name:string }[];
  clothingData: ClothingItem[];
  placedItemIds: string[];
  onItemSelect: (item: ClothingItem) => void;
  isLoading: boolean;
  isCatalogLoading: boolean;
  isOutfitFinalized: boolean;
  onBackToStart: () => void;
  onGoToCheckout: () => void;
  onItemDragStart: () => void;
  onItemDragEnd: () => void;
  priceRange: { min: number; max: number };
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  minPrice: number;
  maxPrice: number;
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
    const [imageSrc, setImageSrc] = useState('');
    const [loadFailed, setLoadFailed] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const objectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        let isActive = true;

        // Reset state for new item
        setLoadFailed(false);
        setIsImageLoaded(false);
        setImageSrc('');
        
        // Clean up previous URL
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        const loadImage = (url: string) => {
            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error(`Fetch failed for ${url}`);
                    return res.blob();
                })
                .then(blob => {
                    // Ensure the fetched content is an image before creating an object URL.
                    if (!blob.type.startsWith('image/')) {
                        throw new Error(`Content type for ${url} is not an image: ${blob.type}`);
                    }
                    if (isActive) {
                        const newUrl = URL.createObjectURL(blob);
                        objectUrlRef.current = newUrl;
                        setImageSrc(newUrl);
                    }
                })
                .catch(() => {
                    if (isActive) {
                        setLoadFailed(true);
                    }
                });
        };

        loadImage(item.imageUrl);
        
        return () => {
            isActive = false;
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, [item.imageUrl]);

    const handleLoad = () => {
        setIsImageLoaded(true);
    };

    const handleError = () => {
        setLoadFailed(true);
    };
    
    const handleDragStartInternal = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(); // Signal that dragging has started
    };

    const isDisabled = isLoading || loadFailed || !isImageLoaded || isOutfitFinalized;
    // Show skeleton only on the very first load attempt for an item card.
    const isInitialLoading = !isImageLoaded && !loadFailed;
    
    return (
        <div 
            onClick={() => !isDisabled && onItemSelect(item)}
            draggable={!isDisabled}
            onDragStart={(e) => !isDisabled && handleDragStartInternal(e)}
            onDragEnd={() => !isDisabled && onDragEnd()}
            className={`relative rounded-lg border-2 p-2 transition-all duration-200 ease-in-out bg-white
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer group hover:shadow-md hover:scale-105'}
                ${isPlaced && !loadFailed ? 'border-neutral-600' : 'border-transparent'}
                ${loadFailed ? 'opacity-60 grayscale' : ''}
            `}
        >
            {/* Skeleton loader */}
            {isInitialLoading && (
                <div className="absolute inset-2" aria-hidden="true">
                    <div className="w-full aspect-square bg-neutral-200/80 rounded-md animate-pulse"></div>
                    <div className="mt-2 h-4 w-3/4 mx-auto bg-neutral-200/80 rounded animate-pulse"></div>
                    <div className="mt-1 h-3 w-1/4 mx-auto bg-neutral-200/80 rounded animate-pulse"></div>
                </div>
            )}
            
            {/* Content, hidden only during initial loading */}
            <div className={`transition-opacity duration-300 ${isInitialLoading ? 'opacity-0' : 'opacity-100'}`}>
                 <div 
                    className="w-full aspect-square rounded-md bg-neutral-100 flex items-center justify-center overflow-hidden"
                >
                    {imageSrc && !loadFailed && (<img 
                        src={imageSrc}
                        onLoad={handleLoad}
                        onError={handleError}
                        alt={item.name} 
                        className="w-full h-full object-contain pointer-events-none"
                    />)}
                </div>
                <p className="mt-2 text-sm font-medium text-neutral-800 text-center truncate">{item.name}</p>
                <p className="text-xs font-semibold text-neutral-600 text-center">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}</p>
            </div>
            
            {/* Overlays */}
            {loadFailed && !isInitialLoading && (
                <div className="absolute top-2 left-2 right-2 aspect-square flex items-center justify-center rounded-md z-10 pointer-events-none">
                    <p className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded text-center leading-tight shadow-md">
                        Load failed
                    </p>
                </div>
            )}
            {isPlaced && !loadFailed && isImageLoaded && (
                <div className="absolute top-2 right-2 bg-neutral-600 text-white rounded-md p-1 shadow">
                    <CheckIcon className="w-4 h-4" />
                </div>
            )}
        </div>
    );
};

export const ClothingSelector: React.FC<ClothingSelectorProps> = ({ categories, clothingData, placedItemIds, onItemSelect, isLoading, isCatalogLoading, isOutfitFinalized, onBackToStart, onGoToCheckout, onItemDragStart, onItemDragEnd, priceRange, onPriceRangeChange, minPrice, maxPrice }) => {
  const [activeTab, setActiveTab] = useState<ClothingCategory>(categories[0].id);

  const filteredItems = clothingData
    .filter(item => item.category === activeTab)
    .filter(item => item.price >= priceRange.min && item.price <= priceRange.max);
    
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
      <PriceRangeSlider
        min={minPrice}
        max={maxPrice}
        value={priceRange}
        onChange={onPriceRangeChange}
        disabled={isOutfitFinalized}
      />
      <div className="flex-shrink-0 p-1.5 bg-neutral-100/30 rounded-lg">
        <nav className="flex items-center justify-between space-x-1" aria-label="Tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              disabled={isOutfitFinalized}
              className={`${
                activeTab === category.id
                  ? 'bg-white text-neutral-800 shadow'
                  : 'text-neutral-500 hover:text-neutral-700'
              } flex-1 whitespace-nowrap py-2 px-1 rounded-md font-semibold text-sm transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-neutral-500`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-4 overflow-y-auto flex-grow">
        {isCatalogLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="relative rounded-lg p-2">
                        <div className="w-full aspect-square bg-neutral-200/80 rounded-md animate-pulse"></div>
                        <div className="mt-2 h-4 w-3/4 mx-auto bg-neutral-200/80 rounded animate-pulse"></div>
                        <div className="mt-1 h-3 w-1/4 mx-auto bg-neutral-200/80 rounded animate-pulse"></div>
                    </div>
                ))}
            </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
