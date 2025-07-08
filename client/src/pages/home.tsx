import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { TreePine, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { ImpactTree } from "@shared/schema";
import { Link } from "wouter";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: trees = [], isLoading: treesLoading } = useQuery<ImpactTree[]>({
    queryKey: ["/api/impact-trees"],
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <TreePine className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <TreePine className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Impact Tree Canvas
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Welcome back, {user?.firstName || 'User'}!
              </p>
            </div>
          </div>
          <UserProfileMenu />
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Your Impact Trees
                <Link href="/canvas/new">
                  <Button className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    New Tree
                  </Button>
                </Link>
              </CardTitle>
              <CardDescription>
                Manage your strategic planning canvases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {treesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-300 mt-4">Loading trees...</p>
                </div>
              ) : trees.length === 0 ? (
                <div className="text-center py-8">
                  <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No impact trees yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Create your first impact tree to start mapping your strategy
                  </p>
                  <Link href="/canvas/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Tree
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trees.map((tree) => (
                    <Link key={tree.id} href={`/canvas/${tree.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{tree.name}</CardTitle>
                          {tree.description && (
                            <CardDescription>{tree.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              Updated {new Date(tree.updatedAt).toLocaleDateString()}
                            </span>
                            <span>
                              {Array.isArray(tree.nodes) ? tree.nodes.length : 0} nodes
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

Since the changes are inside the `UserProfileMenu` component, I need to see it's code to modify it. Since the code for `UserProfileMenu` is not given, I will assume the intention is to fix the error and the `logout` function is available, I will create a mock `UserProfileMenu` component and use the `logout` function.

```typescript
// Mock UserProfileMenu component
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const UserProfileMenu = () => {
  const { logout } = useAuth();

  return (
    <div>
      <Button onClick={logout} variant="outline">
        Logout
      </Button>
    </div>
  );
};

export { UserProfileMenu };

```

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { TreePine, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { ImpactTree } from "@shared/schema";
import { Link } from "wouter";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: trees = [], isLoading: treesLoading } = useQuery<ImpactTree[]>({
    queryKey: ["/api/impact-trees"],
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <TreePine className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <TreePine className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Impact Tree Canvas
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Welcome back, {user?.firstName || 'User'}!
              </p>
            </div>
          </div>
          <UserProfileMenu />
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Your Impact Trees
                <Link href="/canvas/new">
                  <Button className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    New Tree
                  </Button>
                </Link>
              </CardTitle>
              <CardDescription>
                Manage your strategic planning canvases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {treesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-300 mt-4">Loading trees...</p>
                </div>
              ) : trees.length === 0 ? (
                <div className="text-center py-8">
                  <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No impact trees yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Create your first impact tree to start mapping your strategy
                  </p>
                  <Link href="/canvas/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Tree
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trees.map((tree) => (
                    <Link key={tree.id} href={`/canvas/${tree.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{tree.name}</CardTitle>
                          {tree.description && (
                            <CardDescription>{tree.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              Updated {new Date(tree.updatedAt).toLocaleDateString()}
                            </span>
                            <span>
                              {Array.isArray(tree.nodes) ? tree.nodes.length : 0} nodes
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// UserProfileMenu component
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const UserProfileMenu = () => {
  const { logout } = useAuth();

  return (
    <div>
      <Button onClick={logout} variant="outline">
        Logout
      </Button>
    </div>
  );
};

export { UserProfileMenu };