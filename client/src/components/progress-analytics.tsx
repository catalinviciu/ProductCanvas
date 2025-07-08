import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, TrendingUp, TreePine } from "lucide-react";
import { useUserProgressAnalytics } from "@/hooks/use-enhanced-tree-persistence";
import { useAuth } from "@/hooks/useAuth";

export function ProgressAnalytics() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = useUserProgressAnalytics(user?.id || "");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Analytics</CardTitle>
          <CardDescription>Loading your progress data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Analytics</CardTitle>
          <CardDescription>No analytics data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const completionPercentage = Math.round(analytics.avgCompletionRate * 100);
  const timeSpentHours = Math.round(analytics.totalTimeSpent / (1000 * 60 * 60));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Progress Analytics
        </CardTitle>
        <CardDescription>
          Your impact tree completion and activity insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Completion</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TreePine className="h-4 w-4" />
              Total Trees
            </div>
            <div className="text-2xl font-bold">{analytics.totalTrees}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              Completed
            </div>
            <div className="text-2xl font-bold">{analytics.treesCompleted}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Time Spent
            </div>
            <div className="text-2xl font-bold">{timeSpentHours}h</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Progress Trend
            </div>
            <Badge 
              variant={
                analytics.progressTrend === 'improving' ? 'default' : 
                analytics.progressTrend === 'stable' ? 'secondary' : 
                'destructive'
              }
            >
              {analytics.progressTrend}
            </Badge>
          </div>
        </div>

        {/* Recent Activity */}
        {analytics.recentActivity.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Activity</h4>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    {activity.activityType?.replace('_', ' ')}
                  </span>
                  <span className="font-mono">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Insights</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {completionPercentage < 50 && (
              <p>• Focus on completing template fields for better insights</p>
            )}
            {analytics.totalTrees > 0 && analytics.treesCompleted === 0 && (
              <p>• Try finishing your first tree to see completion patterns</p>
            )}
            {analytics.progressTrend === 'improving' && (
              <p>• Great progress! Keep up the consistent work</p>
            )}
            {analytics.progressTrend === 'declining' && (
              <p>• Consider setting regular tree update schedules</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}