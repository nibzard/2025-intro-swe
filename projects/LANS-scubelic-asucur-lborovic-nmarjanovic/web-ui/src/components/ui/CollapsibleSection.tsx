import { useState, ReactNode } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  theme: string;
  isComplete?: boolean;
  defaultOpen?: boolean;
  isOpen?: boolean; // Controlled state
  onToggle?: () => void; // Controlled handler
  className?: string;
}

export function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  theme, 
  isComplete = false, 
  defaultOpen = true,
  isOpen: propsIsOpen,
  onToggle,
  className = ''
}: CollapsibleSectionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  // Use props.isOpen if controlled, otherwise internal state
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const glassCardClass = theme === 'dark'
    ? 'glass-card'
    : 'glass-card-light';

  return (
    <div className={`${glassCardClass} overflow-hidden transition-all duration-300 ${className}`}>
      <button 
        onClick={handleToggle}
        className={`w-full flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors ${isComplete && !isOpen ? 'opacity-70' : 'opacity-100'}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <div className="flex flex-col items-start">
            <h2 className="section-title text-base">{title}</h2>
            {isComplete && !isOpen && (
               <span className="text-xs text-emerald-500 flex items-center gap-1">
                 <CheckCircle2 className="w-3 h-3" /> Configured
               </span>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6 pt-0 border-t border-dashed border-gray-200/10">
           <div className="pt-6">
             {children}
           </div>
        </div>
      </div>
    </div>
  );
}
