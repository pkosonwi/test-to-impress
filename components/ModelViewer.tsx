import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon, XIcon, UndoIcon, RedoIcon, CheckIcon } from './icons';
import type { PlacedItemData, ClothingItem, SkinTone } from '../types';
import { SKIN_TONE_OPTIONS } from '../constants';

interface PlacedItemProps {
  item: PlacedItemData;
  onUpdate: (item: PlacedItemData) => void;
  onRemove: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  index: number;
  onInteraction: () => void;
}

const PlacedItem: React.FC<PlacedItemProps> = ({ item, onUpdate, onRemove, containerRef, isLoading, index, onInteraction }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 }); // Offset of click within the item
  const itemStartPos = useRef({ x: 0, y: 0 }); // Item's position when drag starts
  const containerRectRef = useRef<DOMRect | null>(null); // Cache container dimensions for performance

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !itemRef.current || !containerRectRef.current) return;
    
    // Prevent page scrolling on touch devices
    if (e.cancelable) e.preventDefault();

    const el = itemRef.current;
    if (el.style.transition !== 'none') {
        el.style.transition = 'none';
    }

    const containerRect = containerRectRef.current;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    let newX = clientX - containerRect.left - dragStartPos.current.x;
    let newY = clientY - containerRect.top - dragStartPos.current.y;
    
    newX = Math.max(0, Math.min(newX, containerRect.width - item.width));
    newY = Math.max(0, Math.min(newY, containerRect.height - item.height));

    const deltaX = newX - itemStartPos.current.x;
    const deltaY = newY - itemStartPos.current.y;
    
    requestAnimationFrame(() => {
        if (itemRef.current) {
            itemRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
        }
    });

  }, [item.width, item.height]);

  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !itemRef.current) return;
    
    isDraggingRef.current = false;
    const el = itemRef.current;

    el.style.transform = '';
    el.style.transition = '';
    el.classList.remove('cursor-grabbing', 'z-50', 'scale-105', 'shadow-2xl', 'shadow-neutral-500/40', 'border-solid', 'border-neutral-600');
    el.classList.add('cursor-grab', 'border-dashed', 'border-transparent');
    
    // Remove all listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);

    const containerRect = containerRectRef.current;
    if (!containerRect) return;
    
    // For touchend, use changedTouches
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

    let finalX = clientX - containerRect.left - dragStartPos.current.x;
    let finalY = clientY - containerRect.top - dragStartPos.current.y;
    
    finalX = Math.max(0, Math.min(finalX, containerRect.width - item.width));
    finalY = Math.max(0, Math.min(finalY, containerRect.height - item.height));
    
    if (finalX !== item.x || finalY !== item.y) {
        onUpdate({ ...item, x: finalX, y: finalY });
    }
    
    containerRectRef.current = null;

  }, [item, onUpdate, handleDragMove]);

  // Combined handler for mouse and touch start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    onInteraction(); // Reset timer on any attempt to drag/interact
    if (isLoading || !itemRef.current || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    containerRectRef.current = containerRef.current.getBoundingClientRect();

    isDraggingRef.current = true;
    const el = itemRef.current;
    
    el.classList.remove('cursor-grab', 'border-dashed', 'border-transparent');
    el.classList.add('cursor-grabbing', 'z-50', 'scale-105', 'shadow-2xl', 'shadow-neutral-500/40', 'border-solid', 'border-neutral-600');

    const itemRect = el.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = {
        x: clientX - itemRect.left,
        y: clientY - itemRect.top,
    };
    itemStartPos.current = { x: item.x, y: item.y };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  return (
    <div
      ref={itemRef}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      className={`absolute select-none group border-2 p-1 transition-all duration-200 animate-[pop-in_0.3s_ease-out] ${isLoading ? 'cursor-progress border-transparent' : 'cursor-grab border-dashed border-transparent hover:border-neutral-500'}`}
      style={{
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        zIndex: item.zIndex,
        willChange: 'transform',
      }}
      aria-label={`Placed ${item.name}`}
    >
        <img src={item.processedImageUrl} alt={item.name} className="w-full h-full object-contain pointer-events-none" />
        {!isLoading && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                }} 
                className="absolute -top-2 -right-2 bg-white rounded-md p-0.5 text-neutral-600 hover:text-red-500 hover:bg-red-100 transition-all shadow-md opacity-0 group-hover:opacity-100"
                aria-label={`Remove ${item.name}`}
            >
                <XIcon className="w-4 h-4" />
            </button>
        )}
    </div>
  );
};


interface ModelViewerProps {
  images: string[];
  currentPoseIndex: number;
  onNextPose: () => void;
  onPrevPose: () => void;
  onApply: () => void;
  isLoading: boolean;
  error: string | null;
  onErrorClear: () => void;
  placedItems: PlacedItemData[];
  onUpdatePlacedItem: (item: PlacedItemData) => void;
  onRemovePlacedItem: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onItemDrop: (item: ClothingItem, x: number, y: number) => void;
  isOutfitFinalized: boolean;
  onInteraction: () => void;
  isItemBeingDragged: boolean;
  onItemDragEnd: () => void;
  skinTone: SkinTone;
  onSkinToneChange: (tone: SkinTone) => void;
}

const loadingMessages = [
    "Warming up the AI stylist...",
    "Tailoring the fit...",
    "Adjusting lighting and shadows...",
    "Adding realistic fabric folds...",
    "Final touches on the look...",
    "Almost ready for the runway!"
];

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-6 w-6 text-neutral-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const ModelViewer: React.FC<ModelViewerProps> = ({ images, currentPoseIndex, onNextPose, onPrevPose, onApply, isLoading, error, onErrorClear, placedItems, onUpdatePlacedItem, onRemovePlacedItem, onUndo, onRedo, canUndo, canRedo, onItemDrop, isOutfitFinalized, onInteraction, isItemBeingDragged, onItemDragEnd, skinTone, onSkinToneChange }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [animationClass, setAnimationClass] = useState('animate-[fadeIn_0.5s_ease-in-out]');
  const prevIndexRef = useRef(currentPoseIndex);

  const [messageIndex, setMessageIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
        setAnimationKey(prevKey => prevKey + 1);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setMessageIndex(0);
    }
  }, [isLoading]);

  useEffect(() => {
    if (prevIndexRef.current === currentPoseIndex) return;

    // Determine direction of change, accounting for wrapping around the array
    const isNext = (currentPoseIndex > prevIndexRef.current && !(prevIndexRef.current === images.length - 1 && currentPoseIndex === 0)) || (currentPoseIndex === 0 && prevIndexRef.current === images.length - 1);
    
    if (isNext) {
        setAnimationClass('animate-slide-in-right');
    } else {
        setAnimationClass('animate-slide-in-left');
    }

    prevIndexRef.current = currentPoseIndex;
  }, [currentPoseIndex, images.length]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
        setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      onItemDragEnd();

      try {
          const itemJSON = e.dataTransfer.getData('application/json');
          if (!itemJSON) return;

          const item: ClothingItem = JSON.parse(itemJSON);
          if (!item || !item.id) return;

          if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              onItemDrop(item, x, y);
          }
      } catch (err) {
          console.error("Failed to handle drop:", err);
      }
  };
  
  const currentImageSrc = images[currentPoseIndex];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 lg:p-4">
        <div
          id="model-image-container"
          ref={containerRef}
          onDragEnter={!isOutfitFinalized ? handleDragEnter : undefined}
          onDragLeave={!isOutfitFinalized ? handleDragLeave : undefined}
          onDragOver={!isOutfitFinalized ? handleDragOver : undefined}
          onDrop={!isOutfitFinalized ? handleDrop : undefined}
          className={`relative w-full max-w-lg aspect-[3/4] overflow-hidden rounded-2xl transition-all duration-300 ${isDraggingOver ? 'ring-4 ring-neutral-500 ring-offset-2 ring-offset-white/80' : ''} ${isItemBeingDragged ? 'scale-105 shadow-2xl' : ''}`}
          style={{
            backgroundColor: '#fff0f5',
            backgroundImage: `url("data:image/svg+xml,%3csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='0' y='0' width='16' height='16' fill='%23f3e8ff' rx='4'/%3e%3crect x='20' y='20' width='16' height='16' fill='%23f3e8ff' rx='4'/%3e%3c/svg%3e")`,
          }}
        >
            {/* Floating Feedback Bubbles */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 z-40 w-full max-w-[80%] sm:max-w-xs pointer-events-none">
                {isLoading && (
                    <div className="relative bg-white border border-neutral-200 text-neutral-800 px-4 py-3 rounded-xl shadow-lg flex items-center animate-[pop-in_0.3s_ease-out]">
                        <LoadingSpinner />
                        <p key={animationKey} className="ml-3 font-semibold text-sm animate-[fadeIn_0.5s,slide-up_0.5s]">
                            {loadingMessages[messageIndex]}
                        </p>
                        <div className="absolute bottom-[-9px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white" style={{ filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))' }}></div>
                    </div>
                )}
                {error && !isLoading && (
                    <div className="relative bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-[pop-in_0.3s_ease-out] pointer-events-auto">
                        <div className="flex-grow">
                            <strong className="font-bold">Error: </strong>
                            <span className="sm:inline ml-1 text-sm">{error}</span>
                        </div>
                        <button onClick={onErrorClear} className="p-1 ml-3 rounded-md hover:bg-red-200/60 transition-colors flex-shrink-0" aria-label="Close error message">
                        <XIcon className="w-5 h-5"/>
                        </button>
                        <div className="absolute bottom-[-9px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-red-100"></div>
                    </div>
                )}
            </div>

            {/* Action Buttons & Skin Tone */}
            <div className="absolute top-4 left-4 z-20 flex flex-col space-y-3">
                <div className="bg-white/90 p-1 rounded-full shadow-md flex items-center space-x-1 self-start">
                    {SKIN_TONE_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => onSkinToneChange(option.id)}
                            disabled={isOutfitFinalized}
                            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 focus:outline-none ${
                                skinTone === option.id 
                                ? 'border-neutral-700 scale-110 ring-2 ring-white' 
                                : 'border-transparent hover:scale-110 hover:border-neutral-400'
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-transparent`}
                            style={{ backgroundColor: option.color }}
                            aria-label={`Select ${option.name} skin tone`}
                        >
                            {skinTone === option.id && (
                                <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-full">
                                    <CheckIcon className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
                {canUndo && (
                    <button
                        onClick={onUndo}
                        className="w-11 h-11 flex items-center justify-center bg-white/90 hover:bg-white text-neutral-800 rounded-xl shadow-md hover:shadow-lg border border-white/20 transition-all duration-300 transform hover:scale-105"
                        aria-label="Undo"
                    >
                        <UndoIcon className="w-6 h-6" />
                    </button>
                )}
                
                {canRedo && (
                    <button
                        onClick={onRedo}
                        className="w-11 h-11 flex items-center justify-center bg-white/90 hover:bg-white text-neutral-800 rounded-xl shadow-md hover:shadow-lg border border-white/20 transition-all duration-300 transform hover:scale-105"
                        aria-label="Redo"
                    >
                        <RedoIcon className="w-6 h-6" />
                    </button>
                )}
            </div>
            
            {currentImageSrc ? (
                <img 
                    key={currentPoseIndex + currentImageSrc} // Force re-render on image change for animation
                    src={currentImageSrc} 
                    alt={`AI model pose ${currentPoseIndex + 1}`} 
                    className={`w-full h-full object-contain mix-blend-multiply ${animationClass}`}
                />
            ) : (
                <div className="w-full h-full bg-neutral-200/80 animate-pulse" />
            )}

            {/* Render Placed Items - only when not finalized */}
            <div className="absolute inset-0">
              {!isOutfitFinalized && placedItems.map((item, index) => (
                  <PlacedItem
                      key={item.id}
                      item={item}
                      onUpdate={onUpdatePlacedItem}
                      onRemove={onRemovePlacedItem}
                      containerRef={containerRef}
                      isLoading={isLoading}
                      index={index}
                      onInteraction={onInteraction}
                  />
              ))}
            </div>

            {/* Floating "Try On" Button */}
            {placedItems.length > 0 && !isOutfitFinalized && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 animate-[fadeIn_0.3s_ease-out]">
                    <button
                        onClick={onApply}
                        disabled={isLoading}
                        className="flex items-center justify-center px-5 py-2.5 bg-neutral-800 text-white rounded-xl text-sm font-semibold hover:bg-neutral-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:bg-neutral-500 disabled:cursor-wait disabled:transform-none"
                    >
                        {!isLoading && <SparklesIcon className="w-5 h-5 mr-2 -ml-1" />}
                        {isLoading ? 'Creating...' : 'Try On'}
                    </button>
                </div>
            )}

            {/* Pagination Controls */}
            <button onClick={onPrevPose} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-lg hover:bg-white border border-white/20 transition-all text-neutral-800 z-10 focus:outline-none focus:ring-2 focus:ring-neutral-400">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button onClick={onNextPose} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-lg hover:bg-white border border-white/20 transition-all text-neutral-800 z-10 focus:outline-none focus:ring-2 focus:ring-neutral-400">
                <ChevronRightIcon className="w-6 h-6" />
            </button>
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {images.map((_, index) => (
                    <div
                        key={index}
                        className={`h-2.5 rounded-full transition-all duration-300 ${index === currentPoseIndex ? 'bg-neutral-600 w-6' : 'bg-neutral-600/30 w-2.5'}`}
                    />
                ))}
            </div>
        </div>
    </div>
  );
};

// Add keyframes for animations in a style tag for Tailwind
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pop-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes slide-in-left {
  from { opacity: 0.5; transform: translateX(-25px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slide-in-right {
  from { opacity: 0.5; transform: translateX(25px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slide-up {
    from { transform: translateY(15px); }
    to { transform: translateY(0); }
}
`;
document.head.appendChild(style);