import './style.css';

import React, { useEffect, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa';

interface ScrollToTopButtonProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  containerRef,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      if (scrollTop > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', toggleVisibility);

      return () => {
        container.removeEventListener('scroll', toggleVisibility);
      };
    }
  }, [containerRef]);

  return (
    <div
      className={`fixed bottom-[140px] md:bottom-16 right-3 md:right-10 z-50 transition-transform duration-500 ease-in-out cursor-pointer ${isVisible ? 'translate-y-0 opacity-100' : 'animate-fade-out -translate-y-full opacity-0'}`}
    >
      <FaArrowUp
        onClick={scrollToTop}
        className={`bg-primary text-white w-7 h-7 md:w-10 md:h-10 text-5xl rounded-lg p-2 md:p-3 opacity-70 hover:opacity-100 hover:-translate-y-2 transition-all duration-300 ${isVisible ? 'animate-fade-in' : 'animate-fade-out'}`}
      />
    </div>
  );
};

export default ScrollToTopButton;
