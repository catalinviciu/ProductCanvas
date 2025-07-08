import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Clock, User, GitBranch } from "lucide-react";
import { useEnhancedTreePersistence } from "@/hooks/use-enhanced-tree-persistence";
import { formatDistanceToNow } from "date-fns";

interface TreeVersionHistoryProps {
  treeId: number;
}

export function TreeVersionHistory({ treeId }: TreeVersionHistoryProps) {
  const { versions, versionsLoading } = useEnhancedTreePersistence(treeId);

  if (versionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>Loading version history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>No version history available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Version snapshots will appear here as you make significant changes to your tree.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History
        </CardTitle>
        <CardDescription>
          Automatic snapshots of significant tree changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div key={version.id} className="flex items-start space-x-4 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 bg-blue-100 rounded-full">
                    <GitBranch className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">
                      Version {version.versionNumber}
                    </p>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {version.changeDescription || 'Automatic snapshot'}
                  </p>
                  
                  <div className="flex items-center text-xs text-muted-foreground space-x-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      User
                    </div>
                  </div>
                  
                  {version.treeSnapshot && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="inline-block mr-3">
                        {version.treeSnapshot.nodes?.length || 0} nodes
                      </span>
                      <span className="inline-block mr-3">
                        {version.treeSnapshot.connections?.length || 0} connections
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  <Button variant="ghost" size="sm" disabled>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}