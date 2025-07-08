import { Button } from "@/components/ui/button";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { TreePine, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { ImpactTree } from "@shared/schema";

interface CanvasHeaderProps {
  impactTree?: ImpactTree;
  isNew?: boolean;
}

export function CanvasHeader({ impactTree, isNew }: CanvasHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between relative z-10">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Button>
        </Link>
        
        <div className="flex items-center space-x-3">
          <TreePine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isNew ? "New Impact Tree" : impactTree?.name || "Impact Tree"}
            </h1>
            {impactTree?.description && !isNew && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {impactTree.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          {impactTree && !isNew && (
            <span>
              {Array.isArray(impactTree.nodes) ? impactTree.nodes.length : 0} nodes
            </span>
          )}
        </div>
        
        <UserProfileMenu />
      </div>
    </header>
  );
}