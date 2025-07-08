import { Button } from "@/components/ui/button";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { ImpactTree } from "@shared/schema";

interface CanvasHeaderProps {
  impactTree?: ImpactTree;
  isNew?: boolean;
  isVisible?: boolean;
  magneticZoneRef?: React.RefObject<HTMLDivElement>;
}

export function CanvasHeader({ impactTree, isNew, isVisible = true, magneticZoneRef }: CanvasHeaderProps) {
  return (
    <>
      {/* Magnetic zone for nav return */}
      <div 
        ref={magneticZoneRef}
        className="fixed top-0 left-0 w-24 h-16 z-50 pointer-events-none"
        style={{ 
          background: !isVisible ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          transition: 'background 0.3s ease'
        }}
      />
      
      <header 
        className={`
          bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 
          px-4 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-40
          transition-all duration-500 ease-out
          ${isVisible 
            ? 'transform translate-y-0 opacity-100 shadow-sm' 
            : 'transform -translate-y-full opacity-0 shadow-none'
          }
        `}
        style={{
          animationName: isVisible ? 'navSlideIn' : undefined,
          animationDuration: '0.5s',
          animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          animationFillMode: 'both'
        }}
      >
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Back</span>
            </Button>
          </Link>
          
          <div>
            <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isNew ? "New Impact Tree" : impactTree?.name || "Impact Tree"}
            </h1>
          </div>
        </div>

        <UserProfileMenu />
      </header>

      {/* Subtle hint overlay when nav is hidden (appears after delay) */}
      {!isVisible && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/60 text-white px-3 py-1.5 rounded-md text-xs hint-fade-in pointer-events-none backdrop-blur-sm"
          style={{ 
            animationDelay: '2s',
            opacity: 0,
            animation: 'hintFadeIn 0.3s ease-out 2s forwards'
          }}
        >
          <div className="text-center text-gray-200">
            Top-left corner • ESC • Double-click
          </div>
        </div>
      )}
    </>
  );
}