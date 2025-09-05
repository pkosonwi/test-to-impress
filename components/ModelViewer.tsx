import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon, XIcon, UndoIcon, RedoIcon } from './icons';
import type { PlacedItemData } from '../types';

interface PlacedItemProps {
  item: PlacedItemData;
  onUpdate: (item: PlacedItemData) => void;
  onRemove: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  index: number;
}

const PlacedItem: React.FC<PlacedItemProps> = ({ item, onUpdate, onRemove, containerRef, isLoading, index }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 }); // Offset of click within the item
  const itemStartPos = useRef({ x: 0, y: 0 }); // Item's position when drag starts
  const containerRectRef = useRef<DOMRect | null>(null); // Cache container dimensions for performance

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !itemRef.current || !containerRectRef.current) return;
    
    const el = itemRef.current;
    // On first move, disable transitions for performance.
    // This allows the initial mousedown scale animation to start,
    // and then ensures subsequent dragging is smooth.
    if (el.style.transition !== 'none') {
        el.style.transition = 'none';
    }

    const containerRect = containerRectRef.current;
    
    // Calculate new desired position relative to the container
    let newX = e.clientX - containerRect.left - dragStartPos.current.x;
    let newY = e.clientY - containerRect.top - dragStartPos.current.y;
    
    // Constrain within container
    newX = Math.max(0, Math.min(newX, containerRect.width - item.width));
    newY = Math.max(0, Math.min(newY, containerRect.height - item.height));

    // Calculate delta for transform
    const deltaX = newX - itemStartPos.current.x;
    const deltaY = newY - itemStartPos.current.y;
    
    // Apply transform for smooth movement without React re-renders
    requestAnimationFrame(() => {
        if (itemRef.current) {
            // Combine translate with scale to maintain the "lifted" effect
            itemRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
        }
    });

  }, [item.width, item.height]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !itemRef.current) return;
    
    isDraggingRef.current = false;
    const el = itemRef.current;

    // Clean up styles and listeners
    el.style.transform = '';
    el.style.transition = ''; // Reset inline transition style
    el.classList.remove('cursor-grabbing', 'z-50', 'scale-105', 'shadow-2xl', 'shadow-blue-500/40', 'border-solid', 'border-blue-600');
    el.classList.add('cursor-grab', 'border-dashed', 'border-transparent');
    document.removeEventListener('mousemove', handleMouseMove);

    // Calculate final position
    const containerRect = containerRectRef.current;
    if (!containerRect) return; // Should not happen, but a good guard
    
    let finalX = e.clientX - containerRect.left - dragStartPos.current.x;
    let finalY = e.clientY - containerRect.top - dragStartPos.current.y;
    
    // Constrain final position
    finalX = Math.max(0, Math.min(finalX, containerRect.width - item.width));
    finalY = Math.max(0, Math.min(finalY, containerRect.height - item.height));
    
    // Commit the final position to parent state
    // Only update if position has actually changed to avoid unnecessary re-renders
    if (finalX !== item.x || finalY !== item.y) {
        onUpdate({ ...item, x: finalX, y: finalY });
    }
    
    // Clear cached rect
    containerRectRef.current = null;

  }, [item, onUpdate, handleMouseMove]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLoading || !itemRef.current || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Cache container dimensions on drag start
    containerRectRef.current = containerRef.current.getBoundingClientRect();

    isDraggingRef.current = true;
    const el = itemRef.current;
    
    // Add visual feedback classes for dragging
    el.classList.remove('cursor-grab', 'border-dashed', 'border-transparent');
    el.classList.add('cursor-grabbing', 'z-50', 'scale-105', 'shadow-2xl', 'shadow-blue-500/40', 'border-solid', 'border-blue-600');

    const itemRect = el.getBoundingClientRect();
    dragStartPos.current = {
        x: e.clientX - itemRect.left,
        y: e.clientY - itemRect.top,
    };
    itemStartPos.current = { x: item.x, y: item.y };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp, { once: true });
  };

  return (
    <div
      ref={itemRef}
      onMouseDown={handleMouseDown}
      className={`absolute select-none group border-2 p-1 transition-all duration-200 ${isLoading ? 'cursor-progress border-transparent animate-wave' : 'cursor-grab border-dashed border-transparent hover:border-blue-500'}`}
      style={{
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        zIndex: item.zIndex,
        willChange: 'transform',
        animationDelay: isLoading ? `${index * 120}ms` : '0s',
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
                className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 text-neutral-600 hover:text-red-500 hover:bg-red-100 transition-all shadow-md opacity-0 group-hover:opacity-100"
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
  placedItems: PlacedItemData[];
  onUpdatePlacedItem: (item: PlacedItemData) => void;
  onRemovePlacedItem: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ images, currentPoseIndex, onNextPose, onPrevPose, onApply, isLoading, placedItems, onUpdatePlacedItem, onRemovePlacedItem, onUndo, onRedo, canUndo, canRedo }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
        <div
          id="model-image-container"
          ref={containerRef}
          className={`relative w-full max-w-lg aspect-[3/4] rounded-xl border border-white/20 overflow-hidden bg-neutral-200 transition-all duration-300`}
        >
            <img 
                key={images[currentPoseIndex]} // Force re-render on image change for animation
                src={images[currentPoseIndex]} 
                alt={`AI model pose ${currentPoseIndex + 1}`} 
                className="w-full h-full object-cover animate-[fadeIn_0.5s_ease-in-out]"
            />

            {/* Render Placed Items */}
            <div className="absolute inset-0">
              {placedItems.map((item, index) => (
                  <PlacedItem
                      key={item.id}
                      item={item}
                      onUpdate={onUpdatePlacedItem}
                      onRemove={onRemovePlacedItem}
                      containerRef={containerRef}
                      isLoading={isLoading}
                      index={index}
                  />
              ))}
            </div>

            {/* Pagination Controls */}
            <button onClick={onPrevPose} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/60 rounded-lg hover:bg-white/90 backdrop-blur-md border border-white/20 transition-all text-neutral-800 z-10 focus:outline-none">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button onClick={onNextPose} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/60 rounded-lg hover:bg-white/90 backdrop-blur-md border border-white/20 transition-all text-neutral-800 z-10 focus:outline-none">
                <ChevronRightIcon className="w-6 h-6" />
            </button>
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {images.map((_, index) => (
                    <div
                        key={index}
                        className={`w-2 h-2 rounded-sm transition-colors ${index === currentPoseIndex ? 'bg-neutral-900/80' : 'bg-neutral-900/30'}`}
                    />
                ))}
            </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-center space-x-4">
            {canUndo ? (
                <button
                    onClick={onUndo}
                    className="flex items-center justify-center px-10 py-4 bg-neutral-900 text-white font-semibold text-lg rounded-lg shadow-lg hover:bg-neutral-800 transition-all duration-300 transform hover:scale-105"
                    aria-label="Undo Try On"
                >
                    <UndoIcon className="w-6 h-6 mr-3" />
                    Undo
                </button>
            ) : (
                <button
                    onClick={onApply}
                    disabled={isLoading || placedItems.length === 0}
                    className="flex items-center justify-center px-10 py-4 bg-neutral-900 text-white font-semibold text-lg rounded-lg shadow-lg hover:bg-neutral-800 transition-all duration-300 disabled:bg-neutral-400 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105"
                >
                    <SparklesIcon className="w-6 h-6 mr-3" />
                    Try On
                </button>
            )}
            
            {canRedo && (
                <button
                    onClick={onRedo}
                    className="flex items-center justify-center px-8 py-4 bg-white text-neutral-700 border border-neutral-300 font-semibold text-lg rounded-lg shadow-md hover:bg-neutral-100 transition-all duration-300 transform hover:scale-105"
                    aria-label="Redo Try On"
                >
                    <RedoIcon className="w-6 h-6 mr-2" />
                    Redo
                </button>
            )}
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
@keyframes wave {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}
.animate-wave {
    animation: wave 1.5s ease-in-out infinite;
}
`;
document.head.appendChild(style);