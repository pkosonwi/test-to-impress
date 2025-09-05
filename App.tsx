import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ClothingSelector } from './components/ClothingSelector';
import { ModelViewer } from './components/ModelViewer';
import { clothingData } from './data/clothing';
import { BASE_MODEL_URLS, CLOTHING_CATEGORIES } from './constants';
import { removeWhiteBackground } from './utils/imageHelper';
import { generateOutfitOnModel } from './services/geminiService';
import type { ClothingItem, PlacedItemData } from './types';
import { XIcon } from './components/icons';

// History state type for undo/redo
interface HistoryState {
    modelImages: string[];
    placedItems: PlacedItemData[];
}

// Placed Item component defined outside to prevent re-renders
const PlacedItemDisplay: React.FC<{item: PlacedItemData, onRemove: (id: string) => void}> = ({ item, onRemove }) => (
    <div className="flex items-center justify-between bg-white/60 backdrop-blur-md p-2 rounded-lg shadow-sm border border-white/30">
        <div className="flex items-center">
            <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-md object-cover mr-4" />
            <div>
                <p className="text-sm font-semibold text-neutral-800">{item.name}</p>
                <p className="text-xs text-neutral-500 capitalize">{item.category}</p>
            </div>
        </div>
        <button onClick={() => onRemove(item.id)} className="text-neutral-500 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-500/10">
            <XIcon className="w-5 h-5" />
        </button>
    </div>
);


const App: React.FC = () => {
  const [modelImages, setModelImages] = useState<string[]>(BASE_MODEL_URLS);
  const [currentPoseIndex, setCurrentPoseIndex] = useState<number>(0);
  const [placedItems, setPlacedItems] = useState<PlacedItemData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Undo/Redo state
  const [preApplyState, setPreApplyState] = useState<HistoryState | null>(null);
  const [postApplyState, setPostApplyState] = useState<{ modelImages: string[] } | null>(null);

  const processedImageCache = useRef<Record<string, string>>({});
  
  const resetHistory = () => {
      if (preApplyState || postApplyState) {
          setPreApplyState(null);
          setPostApplyState(null);
      }
  };
  
  const handleAddItem = useCallback(async (item: ClothingItem) => {
    resetHistory(); // Invalidate history on canvas change
    const itemWidth = 150;
    const itemHeight = 150;

    let processedImageUrl = processedImageCache.current[item.imageUrl];
    if (!processedImageUrl) {
      try {
        setError(null);
        setIsLoading(true);
        processedImageUrl = await removeWhiteBackground(item.imageUrl);
        processedImageCache.current[item.imageUrl] = processedImageUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process image background.");
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    setPlacedItems(prev => {
        // Default position: slightly offset from the center to avoid perfect stacking
        const containerWidth = 512; // based on max-w-lg
        const containerHeight = containerWidth * 4 / 3;
        const x = (containerWidth / 2) - (itemWidth / 2) + (prev.length % 5 - 2) * 10;
        const y = (containerHeight / 2.5) - (itemHeight / 2) + (prev.length % 5 - 2) * 10;

        const newItem: PlacedItemData = {
          id: `${item.id}-${Date.now()}`,
          itemId: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          processedImageUrl,
          category: item.category,
          x: x,
          y: y,
          width: itemWidth,
          height: itemHeight,
          zIndex: prev.length + 1,
        };
        return [...prev, newItem];
    });
  }, []);

  const handleUpdatePlacedItem = useCallback((updatedItem: PlacedItemData) => {
    resetHistory(); // Invalidate history on canvas change
    setPlacedItems(prev => prev.map(p => p.id === updatedItem.id ? updatedItem : p));
  }, []);
  
  const handleRemovePlacedItem = useCallback((id: string) => {
    resetHistory(); // Invalidate history on canvas change
    setPlacedItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleApplyChanges = useCallback(async () => {
    if (placedItems.length === 0) return;

    const modelContainer = document.getElementById('model-image-container');
    if (!modelContainer) {
        setError("Could not find the model display area.");
        return;
    }
    
    setPreApplyState({ modelImages, placedItems });
    setPostApplyState(null);
    setIsLoading(true);
    setError(null);
    
    try {
        const generationPromises = BASE_MODEL_URLS.map(async (modelUrl) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas is not supported.");

            const modelImage = new Image();
            modelImage.crossOrigin = 'Anonymous';
            await new Promise<void>((resolve, reject) => {
                modelImage.onload = () => resolve();
                modelImage.onerror = () => reject(new Error("Failed to load base model image for composition."));
                modelImage.src = `https://corsproxy.io/?${encodeURIComponent(modelUrl)}`;
            });

            canvas.width = modelImage.naturalWidth;
            canvas.height = modelImage.naturalHeight;
            ctx.drawImage(modelImage, 0, 0);

            const viewWidth = modelContainer.clientWidth;
            const scale = modelImage.naturalWidth / viewWidth;

            // Use Promise.all to load and draw all item images concurrently
            await Promise.all(placedItems.map(item => 
                new Promise<void>((resolve, reject) => {
                    const itemImage = new Image();
                    itemImage.crossOrigin = 'Anonymous';
                    itemImage.onload = () => {
                        ctx.drawImage(itemImage, item.x * scale, item.y * scale, item.width * scale, item.height * scale);
                        resolve();
                    };
                    itemImage.onerror = () => reject(new Error(`Failed to load clothing item: ${item.name}`));
                    itemImage.src = item.processedImageUrl; // This is a data URL, no proxy needed
                })
            ));

            const compositeImageBase64 = canvas.toDataURL('image/png');
            return generateOutfitOnModel(compositeImageBase64);
        });
      
        const newImages = await Promise.all(generationPromises);
      
        setPostApplyState({ modelImages: newImages });
        setModelImages(newImages);
        setPlacedItems([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setPreApplyState(null); // Clear history on failure
    } finally {
      setIsLoading(false);
    }
  }, [placedItems, modelImages]);

  const handleUndo = () => {
    if (preApplyState) {
        setModelImages(preApplyState.modelImages);
        setPlacedItems(preApplyState.placedItems);
    }
  };

  const handleRedo = () => {
      if (postApplyState) {
          setModelImages(postApplyState.modelImages);
          setPlacedItems([]);
      }
  };

  const placedItemIds = useMemo(() => placedItems.map(p => p.itemId), [placedItems]);
  const canUndo = postApplyState !== null && placedItems.length === 0;
  const canRedo = preApplyState !== null && postApplyState !== null && placedItems.length > 0;

  return (
    <div className="min-h-screen bg-transparent font-sans relative">
      <main className="grid grid-cols-1 lg:grid-cols-2 max-w-screen-2xl mx-auto h-screen p-6 gap-6">
        {/* Left Panel */}
        <div className="flex flex-col h-[calc(100vh-3rem)]">
          <header className="mb-4">
            <h1 className="text-5xl font-bold text-neutral-900 font-lora">Test to Impress</h1>
            <p className="text-neutral-600 mt-1">Click items from the wardrobe to dress the model.</p>
          </header>

          {/* Placed Items */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2 text-neutral-800">Your Outfit</h2>
            {placedItems.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {placedItems.map(item => (
                        <PlacedItemDisplay key={item.id} item={item} onRemove={handleRemovePlacedItem}/>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 px-4 bg-white/30 backdrop-blur-sm rounded-lg border border-white/20">
                    <p className="text-sm text-neutral-500">Click items from the categories below.</p>
                </div>
            )}
          </div>
          
          <div className="flex-grow min-h-0">
             <ClothingSelector
                categories={CLOTHING_CATEGORIES}
                clothingData={clothingData}
                placedItemIds={placedItemIds}
                onItemSelect={handleAddItem}
                isLoading={isLoading}
              />
          </div>
        </div>

        {/* Right Panel */}
        <div className="h-[calc(100vh-3rem)]">
            <ModelViewer
              images={modelImages}
              currentPoseIndex={currentPoseIndex}
              onNextPose={() => setCurrentPoseIndex(p => (p + 1) % modelImages.length)}
              onPrevPose={() => setCurrentPoseIndex(p => (p - 1 + modelImages.length) % modelImages.length)}
              onApply={handleApplyChanges}
              isLoading={isLoading}
              placedItems={placedItems}
              onUpdatePlacedItem={handleUpdatePlacedItem}
              onRemovePlacedItem={handleRemovePlacedItem}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
        </div>
      </main>

      {/* Error Modal */}
      {error && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4" role="alert">
              <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-900 px-4 py-3 rounded-lg shadow-lg flex items-center justify-between animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex-grow">
                      <strong className="font-bold">Error: </strong>
                      <span className="sm:inline ml-1">{error}</span>
                  </div>
                  <button onClick={() => setError(null)} className="p-1 ml-3 rounded-md hover:bg-red-500/20 transition-colors flex-shrink-0" aria-label="Close error message">
                    <XIcon className="w-5 h-5"/>
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;