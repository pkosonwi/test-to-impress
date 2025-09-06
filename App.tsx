import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ClothingSelector } from './components/ClothingSelector';
import { ModelViewer } from './components/ModelViewer';
import { Header } from './components/Header';
import { clothingData } from './data/clothing';
import { BASE_MODEL_URLS, CLOTHING_CATEGORIES } from './constants';
import { imageUrlToBase64 } from './utils/imageHelper';
import { generateOutfitOnModel } from './services/geminiService';
import type { ClothingItem, PlacedItemData } from './types';
import { XIcon, OutfitIcon, ChevronUpIcon, ChevronDownIcon, ExternalLinkIcon } from './components/icons';

// History state types for undo/redo
interface PreApplyHistoryState {
    modelImages: string[];
    placedItems: PlacedItemData[];
}
interface PostApplyHistoryState {
    modelImages: string[];
}

type ControlTab = 'wardrobe' | 'outfit';

const INACTIVITY_TIMEOUT = 2500; // 2.5 seconds

// Animate price changes
const AnimatedPrice: React.FC<{ value: number }> = ({ value }) => {
  const [currentValue, setCurrentValue] = useState(value);
  const valueRef = useRef(value);
  // FIX: Initialize useRef with null and update the type to allow null, as requestAnimationFrame ID is not available on mount.
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = valueRef.current;
    const endValue = value;
    const duration = 400; // ms
    let startTime: number | null = null;

    // FIX: The animation loop is defined as a const with an arrow function.
    // This is a more common and block-scoped pattern within useEffect, which can prevent unexpected behavior.
    const animateLoop = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const animatedValue = startValue + (endValue - startValue) * progress;

      setCurrentValue(animatedValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animateLoop);
      } else {
        valueRef.current = endValue;
      }
    };
    
    frameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      // Set final value in ref for next animation start
      valueRef.current = endValue;
    };
  }, [value]);

  return (
    <span className="text-lg font-bold text-neutral-800">
      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentValue)}
    </span>
  );
};


// Placed Item component defined outside to prevent re-renders
const PlacedItemDisplay: React.FC<{
    item: PlacedItemData;
    onRemove: (id: string) => void;
    isOutfitFinalized: boolean;
}> = ({ item, onRemove, isOutfitFinalized }) => (
    <div className="flex items-center justify-between bg-white/90 p-2 rounded-lg shadow-sm border border-white/30 animate-[fadeIn_0.3s_ease-out]">
        <div className="flex items-center min-w-0">
            <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-md object-cover mr-4 flex-shrink-0" />
            <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-800 truncate">{item.name}</p>
                <p className="text-xs text-neutral-500 capitalize">
                    {item.category} &bull; {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}
                </p>
            </div>
        </div>
        {!isOutfitFinalized && (
            <button onClick={() => onRemove(item.id)} className="text-neutral-500 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-500/10 flex-shrink-0 ml-2">
                <XIcon className="w-5 h-5" />
            </button>
        )}
    </div>
);

const CheckoutModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    items: PlacedItemData[];
    totalPrice: number;
}> = ({ isOpen, onClose, items, totalPrice }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
        >
            <div 
                className="bg-white/95 rounded-2xl shadow-2xl p-6 lg:p-8 w-full max-w-md lg:max-w-2xl border border-white/20 transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="checkout-title" className="text-2xl font-bold font-lora text-neutral-800">Your Outfit</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-500/20 text-neutral-600 transition-colors" aria-label="Close checkout modal">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-white/80 p-3 rounded-lg">
                            <div className="flex items-center min-w-0">
                                <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-md object-cover mr-4"/>
                                <div className="min-w-0">
                                    <p className="font-semibold text-neutral-800 truncate">{item.name}</p>
                                    <p className="text-sm text-neutral-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}</p>
                                </div>
                            </div>
                            <a 
                                href={item.checkoutUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="ml-4 flex-shrink-0 flex items-center gap-2 text-sm bg-neutral-800 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-all duration-200 shadow-md transform hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                Buy Now <ExternalLinkIcon className="w-4 h-4" />
                            </a>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-300/80 flex justify-between items-center">
                    <span className="text-lg font-semibold text-neutral-600">Total</span>
                    <span className="text-2xl font-bold text-neutral-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice)}
                    </span>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [modelImages, setModelImages] = useState<string[]>(BASE_MODEL_URLS);
  const [currentPoseIndex, setCurrentPoseIndex] = useState<number>(0);
  const [placedItems, setPlacedItems] = useState<PlacedItemData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOutfitFinalized, setIsOutfitFinalized] = useState<boolean>(false);
  const [isItemBeingDragged, setIsItemBeingDragged] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);

  // State for the floating panel on mobile
  const [isPanelOpen, setPanelOpen] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState<ControlTab>('wardrobe');

  // Undo/Redo state
  const [preApplyState, setPreApplyState] = useState<PreApplyHistoryState | null>(null);
  const [postApplyState, setPostApplyState] = useState<PostApplyHistoryState | null>(null);

  const processedImageCache = useRef<Record<string, string>>({});
  const inactivityTimerRef = useRef<number | null>(null);
  
  // A callback to reset the inactivity timer. This is the core of the auto-pose-change feature.
  // It's memoized with useCallback to prevent re-creation on every render.
  const resetInactivityTimer = useCallback(() => {
    // Always clear the previous timer to prevent multiple timers running.
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Pause auto-cycling if the AI is working, if the outfit is finalized, or if there's nothing to cycle through.
    if (isLoading || isOutfitFinalized || modelImages.length <= 1) {
      return;
    }

    // Set a new timer.
    inactivityTimerRef.current = window.setTimeout(() => {
      // When the timer fires, advance to the next pose.
      setCurrentPoseIndex(p => (p + 1) % modelImages.length);
    }, INACTIVITY_TIMEOUT);
  }, [isLoading, isOutfitFinalized, modelImages.length]);

  // This effect hook manages the lifecycle of the inactivity timer, creating a continuous cycle.
  // It runs whenever its dependencies change. By including `currentPoseIndex`, we ensure that
  // after an automatic pose change, the timer is reset, thus creating a loop.
  useEffect(() => {
    // Start or reset the timer.
    resetInactivityTimer();
    
    // Cleanup function: It's crucial to clear the timer when the component unmounts
    // or before the effect runs again to prevent memory leaks or buggy behavior.
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer, currentPoseIndex]);


  const handleBackToStart = useCallback(() => {
    setModelImages(BASE_MODEL_URLS);
    setPlacedItems([]);
    setIsOutfitFinalized(false);
    setPreApplyState(null);
    setPostApplyState(null);
    setCurrentPoseIndex(0);
  }, []);

  const handleGoToCheckout = useCallback(() => {
    setActiveControlTab('outfit');
    // On mobile, ensure the panel is open to see the outfit tab
    if (window.innerWidth < 1024) {
      setPanelOpen(true);
    }
  }, []);

  // On non-mobile screens, the panel should be considered "open"
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 1024) {
            setPanelOpen(true);
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Called whenever the outfit is changed to invalidate the undo/redo history
  const handleOutfitChange = () => {
      setPreApplyState(null);
      setPostApplyState(null);
      if (isOutfitFinalized) {
          setIsOutfitFinalized(false);
      }
  };
  
  const addPlacedItem = useCallback(async (item: ClothingItem, position?: { x: number; y: number }) => {
    resetInactivityTimer();
    handleOutfitChange();
    const itemWidth = 150;
    const itemHeight = 150;

    let processedImageUrl = processedImageCache.current[item.imageUrl];
    if (!processedImageUrl) {
      try {
        setError(null);
        setIsLoading(true);
        // Convert image to Base64 to handle CORS for canvas drawing, but don't remove background.
        processedImageUrl = await imageUrlToBase64(item.imageUrl);
        processedImageCache.current[item.imageUrl] = processedImageUrl;
      } catch (err)
 {
        setError(err instanceof Error ? err.message : "Failed to load clothing image.");
        return;
      } finally {
        setIsLoading(false);
      }
    }

    setPlacedItems(prev => {
        const existingItem = prev.find(p => p.category === item.category);
        const otherItems = prev.filter(p => p.category !== item.category);

        let x, y;
        const containerWidth = 512; // based on max-w-lg from ModelViewer
        const containerHeight = containerWidth * 4 / 3;

        if (position) {
            // Case 1: Item was dropped, use the drop coordinates.
            x = position.x - itemWidth / 2;
            y = position.y - itemHeight / 2;
        } else if (existingItem) {
            // Case 2: Item was clicked, replacing an existing item. Use the old item's position.
            x = existingItem.x;
            y = existingItem.y;
        } else {
            // Case 3: Item was clicked, and it's a new category. Use a default centered position.
            x = (containerWidth / 2) - (itemWidth / 2) + (otherItems.length % 5 - 2) * 10;
            y = (containerHeight / 2.5) - (itemHeight / 2) + (otherItems.length % 5 - 2) * 10;
        }

        // Final boundary check
        x = Math.max(0, Math.min(x, containerWidth - itemWidth));
        y = Math.max(0, Math.min(y, containerHeight - itemHeight));

        const newItem: PlacedItemData = {
          id: `${item.id}-${Date.now()}`,
          itemId: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          processedImageUrl,
          category: item.category,
          price: item.price,
          checkoutUrl: item.checkoutUrl,
          x,
          y,
          width: existingItem?.width ?? itemWidth,
          height: existingItem?.height ?? itemHeight,
          zIndex: existingItem?.zIndex ?? prev.length + 1,
        };
        // Return the list of other items plus the new/replacement item.
        return [...otherItems, newItem];
    });
  }, [isOutfitFinalized, resetInactivityTimer]);

  const handleAddItem = useCallback((item: ClothingItem) => {
    addPlacedItem(item);
  }, [addPlacedItem]);

  const handleDropItem = useCallback((item: ClothingItem, x: number, y: number) => {
    addPlacedItem(item, { x, y });
  }, [addPlacedItem]);

  const handleUpdatePlacedItem = useCallback((updatedItem: PlacedItemData) => {
    resetInactivityTimer();
    handleOutfitChange();
    setPlacedItems(prev => prev.map(p => p.id === updatedItem.id ? updatedItem : p));
  }, [isOutfitFinalized, resetInactivityTimer]);
  
  const handleRemovePlacedItem = useCallback((id: string) => {
    resetInactivityTimer();
    handleOutfitChange();
    setPlacedItems(prev => prev.filter(p => p.id !== id));
  }, [isOutfitFinalized, resetInactivityTimer]);

  const handleNextPose = () => {
    setCurrentPoseIndex(p => (p + 1) % modelImages.length);
    resetInactivityTimer();
  };

  const handlePrevPose = () => {
    setCurrentPoseIndex(p => (p - 1 + modelImages.length) % modelImages.length);
    resetInactivityTimer();
  };

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
        setIsOutfitFinalized(true);

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
        setIsOutfitFinalized(false);
    }
  };

  const handleRedo = () => {
      if (postApplyState) {
          setModelImages(postApplyState.modelImages);
          setIsOutfitFinalized(true);
      }
  };

  const placedItemIds = useMemo(() => placedItems.map(p => p.itemId), [placedItems]);
  const totalPrice = useMemo(() => placedItems.reduce((sum, item) => sum + item.price, 0), [placedItems]);
  const canUndo = postApplyState !== null && isOutfitFinalized;
  const canRedo = preApplyState !== null && postApplyState !== null && !isOutfitFinalized;

  return (
    <div className="w-full h-screen bg-transparent font-inter flex flex-col">
      <Header />
      <main className="relative flex-1 min-h-0 w-full h-full lg:grid lg:grid-cols-2 max-w-screen-2xl lg:mx-auto lg:p-6 lg:gap-6">
        {/* Model Viewer (Right Panel on Desktop) */}
        <div className="h-full lg:h-auto lg:order-2 pb-[80px] lg:pb-0">
            <ModelViewer
              images={modelImages}
              currentPoseIndex={currentPoseIndex}
              onNextPose={handleNextPose}
              onPrevPose={handlePrevPose}
              onApply={handleApplyChanges}
              isLoading={isLoading}
              error={error}
              onErrorClear={() => setError(null)}
              placedItems={placedItems}
              onUpdatePlacedItem={handleUpdatePlacedItem}
              onRemovePlacedItem={handleRemovePlacedItem}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              onItemDrop={handleDropItem}
              isOutfitFinalized={isOutfitFinalized}
              onInteraction={resetInactivityTimer}
              isItemBeingDragged={isItemBeingDragged}
              onItemDragEnd={() => setIsItemBeingDragged(false)}
            />
        </div>
        
        {/* Controls (Left Panel on Desktop, Floating on Mobile) */}
        <div
            className={`
                ${isPanelOpen ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'}
                lg:translate-y-0
                transform transition-transform duration-300 ease-in-out
                fixed bottom-0 left-0 right-0 z-30
                flex flex-col
                bg-white/95 rounded-t-2xl border-t border-neutral-200/80
                max-h-[75vh]
                lg:static lg:z-auto lg:rounded-2xl lg:border lg:shadow-lg lg:p-4 lg:max-h-full lg:order-1
            `}
        >
            <button 
                onClick={() => setPanelOpen(p => !p)}
                className="lg:hidden w-full flex-shrink-0 flex justify-center items-center py-4 cursor-pointer"
                aria-label={isPanelOpen ? 'Collapse wardrobe' : 'Expand wardrobe'}
            >
                {isPanelOpen 
                    ? <ChevronDownIcon className="w-6 h-6 text-neutral-600" /> 
                    : <ChevronUpIcon className="w-6 h-6 text-neutral-600" />
                }
                <span className="text-lg font-semibold text-neutral-800 ml-3">
                    Controls
                </span>
            </button>
            
            <div className={`flex flex-col lg:h-full flex-1 min-h-0 p-4 pt-0 lg:p-0 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} lg:opacity-100 lg:pointer-events-auto`}>
              <div className="flex-shrink-0 p-1 bg-neutral-200/60 rounded-lg mb-4">
                  <nav className="flex items-center justify-between space-x-1" aria-label="Controls">
                      <button
                          onClick={() => setActiveControlTab('wardrobe')}
                          className={`flex-1 whitespace-nowrap py-2 px-1 rounded-md font-semibold text-sm transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-400 ${
                              activeControlTab === 'wardrobe' ? 'bg-white text-neutral-800 shadow' : 'text-neutral-500 hover:text-neutral-700'
                          }`}
                      >
                          Wardrobe
                      </button>
                      <button
                          onClick={() => setActiveControlTab('outfit')}
                          className={`flex-1 whitespace-nowrap py-2 px-1 rounded-md font-semibold text-sm transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-400 flex items-center justify-center ${
                              activeControlTab === 'outfit' ? 'bg-white text-neutral-800 shadow' : 'text-neutral-500 hover:text-neutral-700'
                          }`}
                      >
                          <span className="mr-1.5">•</span> Outfit ({placedItems.length})
                      </button>
                  </nav>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                  {activeControlTab === 'wardrobe' ? (
                      <ClothingSelector
                          categories={CLOTHING_CATEGORIES}
                          clothingData={clothingData}
                          placedItemIds={placedItemIds}
                          onItemSelect={handleAddItem}
                          isLoading={isLoading}
                          isOutfitFinalized={isOutfitFinalized}
                          onBackToStart={handleBackToStart}
                          onGoToCheckout={handleGoToCheckout}
                          onItemDragStart={() => setIsItemBeingDragged(true)}
                          onItemDragEnd={() => setIsItemBeingDragged(false)}
                      />
                  ) : (
                      <div className="h-full flex flex-col">
                          {placedItems.length > 0 ? (
                              <>
                                  <div className="flex-1 space-y-2 min-h-0 overflow-y-auto pr-2">
                                      {placedItems.map(item => (
                                          <PlacedItemDisplay key={item.id} item={item} onRemove={handleRemovePlacedItem} isOutfitFinalized={isOutfitFinalized}/>
                                      ))}
                                  </div>
                                  <div className="flex-shrink-0 mt-4 pt-4 border-t border-neutral-300/70">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-base font-semibold text-neutral-600">Total Price</span>
                                        <AnimatedPrice value={totalPrice} />
                                    </div>
                                    <button
                                        onClick={() => setIsCheckoutModalOpen(true)}
                                        className="w-full flex items-center justify-center px-5 py-2.5 bg-neutral-800 text-white rounded-lg text-base font-semibold hover:bg-neutral-700 transition-all duration-200 shadow-lg transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
                                    >
                                        Checkout
                                    </button>
                                </div>
                              </>
                          ) : (
                              <div className="h-full text-center py-6 px-4 bg-white/30 rounded-lg border border-white/20 flex flex-col items-center justify-center">
                                  <OutfitIcon className="w-10 h-10 text-neutral-400 mb-2"/>
                                  <p className="text-sm text-neutral-500">Your selected outfit items will appear here.</p>
                              </div>
                          )}
                      </div>
                  )}
              </div>
            </div>
        </div>
      </main>

      <CheckoutModal 
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        items={placedItems}
        totalPrice={totalPrice}
      />
    </div>
  );
};

export default App;