import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Book } from "lucide-react";
import type { Story } from "@shared/schema";

interface StoryPanelProps {
  currentStory: Story | null;
  onNextStory: () => void;
  onPreviousStory: () => void;
  storiesCount: number;
}

export function StoryPanel({ currentStory, onNextStory, onPreviousStory, storiesCount }: StoryPanelProps) {
  if (!currentStory || storiesCount === 0) {
    return (
      <div className="h-48 bg-white border-t border-gray-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <Book className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-serif font-semibold text-gray-400 mb-2">No Stories Yet</h3>
          <p className="text-gray-500">Import family data to generate stories automatically</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-48 bg-white border-t border-gray-200 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-serif font-semibold text-heritage-800">Featured Story</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousStory}
            disabled={storiesCount <= 1}
            className="text-gray-400 hover:text-heritage-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500">
            1 of {storiesCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextStory}
            disabled={storiesCount <= 1}
            className="text-gray-400 hover:text-heritage-600"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            size="sm"
            className="bg-heritage-500 hover:bg-heritage-600 text-white ml-4"
          >
            View All Stories
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-32">
        <div className="space-y-2">
          <h4 className="font-serif font-semibold text-heritage-700">{currentStory.title}</h4>
          <p className="text-sm text-gray-600 leading-relaxed overflow-hidden line-clamp-4">
            {currentStory.content}
          </p>
        </div>
        <div className="flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-400">
            <Book className="h-12 w-12 mx-auto mb-2" />
            <p className="text-xs">Story illustration</p>
          </div>
        </div>
      </div>
    </div>
  );
}
