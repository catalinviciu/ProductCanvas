import { Button } from "@/components/ui/button";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { InlineRename } from "@/components/inline-rename";
import { useTreeManagement } from "@/hooks/use-tree-management";
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
  const { renameTree, isRenaming } = useTreeManagement();

  const handleRename = (newName: string) => {
    if (impactTree) {
      renameTree({ treeId: impactTree.id, name: newName });
    }
  };

  return (
    <>
      {/* Invisible magnetic zone for nav return - full top strip */}
      <div 
        ref={magneticZoneRef}
        className="fixed top-0 left-0 right-0 h-16 z-50 pointer-events-none"
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
            {isNew ? (
              <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Impact Tree
              </h1>
            ) : impactTree ? (
              <InlineRename
                value={impactTree.name}
                onSave={handleRename}
                isLoading={isRenaming}
                placeholder="Enter tree name..."
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              />
            ) : (
              <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Impact Tree
              </h1>
            )}
          </div>
        </div>

        <UserProfileMenu />
      </header>
    </>
  );
}