import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TreePine, Users, Target, Lightbulb } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <TreePine className="h-12 w-12 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Impact Tree Canvas
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Visualize your product strategy with powerful impact trees. Connect outcomes, 
            opportunities, and solutions in an intuitive canvas interface.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center">
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <CardTitle className="text-gray-900 dark:text-white">Strategic Planning</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Map your objectives to measurable outcomes with clear connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Define clear objectives and outcomes</li>
                <li>• Connect opportunities to solutions</li>
                <li>• Track assumptions and metrics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="text-center">
              <Lightbulb className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <CardTitle className="text-gray-900 dark:text-white">Visual Canvas</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Interactive drag-and-drop interface for intuitive tree building
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Drag and drop node creation</li>
                <li>• Multiple layout orientations</li>
                <li>• Rich text editing support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="text-center">
              <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <CardTitle className="text-gray-900 dark:text-white">Team Collaboration</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Share and collaborate on impact trees with your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Real-time collaboration</li>
                <li>• Prioritization scoring</li>
                <li>• Template-based nodes</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Ready to transform your product strategy?
          </p>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    </div>
  );
}