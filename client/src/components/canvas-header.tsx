import { Button } from "@/components/ui/button";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { ImpactTree } from "@shared/schema";

interface CanvasHeaderProps {
  impactTree?: ImpactTree;
  isNew?: boolean;
}

export function CanvasHeader({ impactTree, isNew }: CanvasHeaderProps) {
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-2 flex items-center justify-between relative z-10">
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
  );
}