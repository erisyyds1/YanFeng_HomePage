import React from 'react';

interface RetroCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'ticket' | 'paper' | 'screen';
}

const RetroCard: React.FC<RetroCardProps> = ({ 
  children, 
  title, 
  subtitle, 
  className = '', 
  variant = 'ticket' 
}) => {
  // Styles for the "Menu" aesthetic
  
  if (variant === 'ticket') {
    return (
      <div className={`relative group ${className}`}>
        {/* Shadow layer */}
        <div className="absolute top-2 left-2 w-full h-full bg-[var(--theme-border)] rounded-lg opacity-20 transition-transform group-hover:translate-x-1 group-hover:translate-y-1"></div>
        
        {/* Main Card */}
        <div className="relative bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg p-1 overflow-hidden">
          {/* Dashed Inner Border */}
          <div className="border-2 border-dashed border-[var(--theme-primary)] rounded h-full flex flex-col">
            
            {/* Header Section */}
            {(title || subtitle) && (
              <div className="p-4 border-b-2 border-dashed border-[var(--theme-primary)] bg-opacity-10 bg-[var(--theme-primary)] flex justify-between items-center">
                 <div>
                    {subtitle && (
                      <span className="inline-block text-2xl font-bold tracking-wider px-5 py-2 mb-3 border-2 border-[var(--theme-border)] rounded-md bg-[var(--theme-secondary)] text-[var(--theme-border)] shadow-[4px_4px_0px_rgba(0,0,0,0.1)] transform -rotate-1">
                        {subtitle}
                      </span>
                    )}
                    {title && <h3 className="text-xl md:text-2xl font-retro text-[var(--theme-primary)] drop-shadow-sm">{title}</h3>}
                 </div>
                 <div className="w-8 h-8 rounded-full border-2 border-[var(--theme-primary)] flex items-center justify-center">
                    <div className="w-4 h-4 bg-[var(--theme-primary)] rounded-full animate-pulse"></div>
                 </div>
              </div>
            )}
            
            {/* Content */}
            <div className="p-4 flex-grow">
              {children}
            </div>
          </div>
          
          {/* Ticket Cutouts (Simulated with pseudo-circles matching bg color) */}
          <div className="absolute top-1/2 -left-2 w-4 h-8 bg-[var(--theme-secondary)] border-r-4 border-[var(--theme-border)] rounded-r-full transform -translate-y-1/2"></div>
          <div className="absolute top-1/2 -right-2 w-4 h-8 bg-[var(--theme-secondary)] border-l-4 border-[var(--theme-border)] rounded-l-full transform -translate-y-1/2"></div>
        </div>
      </div>
    );
  }

  // Variant: Screen (for videos)
  if (variant === 'screen') {
    return (
      <div className={`relative bg-black rounded-xl border-8 border-gray-800 shadow-2xl overflow-hidden ${className}`}>
        <div className="absolute top-0 w-full h-8 bg-gray-800 flex items-center px-4 space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="pt-8">
            {children}
        </div>
      </div>
    );
  }

  // Default fallback
  return <div className={className}>{children}</div>;
};

export default RetroCard;