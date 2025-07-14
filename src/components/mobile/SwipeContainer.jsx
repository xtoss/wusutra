import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function SwipeContainer({ 
  sections = [], 
  onClose, 
  showCloseButton = true,
  className = "" 
}) {
  const [currentSection, setCurrentSection] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
    if (isRightSwipe && currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const goToSection = (index) => {
    setCurrentSection(index);
  };

  const goNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const goPrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  return (
    <div className={`relative h-screen bg-white overflow-hidden ${className}`}>
      {/* Content Area */}
      <div
        ref={containerRef}
        className="h-full flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentSection * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {sections.map((section, index) => (
          <div key={index} className="w-full h-full flex-shrink-0 overflow-y-auto">
            {section}
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Desktop) */}
      <div className="hidden md:block">
        {currentSection > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        
        {currentSection < sections.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Pagination Dots */}
          <div className="flex items-center gap-2">
            {sections.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSection(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSection ? 'bg-gray-900' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Section Counter */}
          <div className="text-sm text-gray-500 font-medium">
            {currentSection + 1} / {sections.length}
          </div>

          {/* Close Button */}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="font-medium">关闭</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}