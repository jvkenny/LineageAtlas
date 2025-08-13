import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapView } from "@/components/map-view";
import { Sidebar } from "@/components/sidebar";
import { StoryPanel } from "@/components/story-panel";
import { PDFPreviewModal } from "@/components/pdf-preview-modal";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, FileText, Settings } from "lucide-react";
import type { FamilyMember, Location, Event, Story, GeopackageLayer } from "@shared/schema";

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [timelineYear, setTimelineYear] = useState(1920);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("map");
  const [layerVisibility, setLayerVisibility] = useState({
    familyLocations: true,
    migrationPaths: true,
    historicalMaps: false,
    cemeteries: false,
    customGeopackage: true,
  });

  const { data: familyMembers = [] } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family-members"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const { data: geopackageLayers = [] } = useQuery<GeopackageLayer[]>({
    queryKey: ["/api/geopackage-layers"],
  });

  const handleLayerToggle = (layerName: string, visible: boolean) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerName]: visible
    }));
  };

  const handleTimelineChange = (year: number) => {
    setTimelineYear(year);
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const nextStory = () => {
    setCurrentStoryIndex((prev) => (prev + 1) % stories.length);
  };

  const previousStory = () => {
    setCurrentStoryIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const currentStory = stories[currentStoryIndex] || null;

  // Calculate statistics
  const stats = {
    memberCount: familyMembers.length,
    locationCount: locations.length,
    storyCount: stories.length,
    timeSpan: familyMembers.length > 0 ? 
      `${Math.min(...familyMembers.map(m => parseInt(m.birthDate?.substring(0, 4) || '2024')))}-${new Date().getFullYear()}` : 
      '1847-2024'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MapPin className="text-heritage-500 h-8 w-8" />
                <h1 className="text-xl font-serif font-semibold text-heritage-800">Legacy Atlas Studio</h1>
              </div>
              <nav className="hidden md:flex space-x-6 ml-8">
                <button 
                  className={`font-medium pb-1 ${activeTab === 'map' ? 'text-heritage-600 border-b-2 border-heritage-500' : 'text-gray-500 hover:text-heritage-600'}`}
                  onClick={() => setActiveTab('map')}
                >
                  Map View
                </button>
                <button 
                  className={`font-medium pb-1 ${activeTab === 'tree' ? 'text-heritage-600 border-b-2 border-heritage-500' : 'text-gray-500 hover:text-heritage-600'}`}
                  onClick={() => setActiveTab('tree')}
                >
                  Family Tree
                </button>
                <button 
                  className={`font-medium pb-1 ${activeTab === 'timeline' ? 'text-heritage-600 border-b-2 border-heritage-500' : 'text-gray-500 hover:text-heritage-600'}`}
                  onClick={() => setActiveTab('timeline')}
                >
                  Timeline
                </button>
                <button 
                  className={`font-medium pb-1 ${activeTab === 'stories' ? 'text-heritage-600 border-b-2 border-heritage-500' : 'text-gray-500 hover:text-heritage-600'}`}
                  onClick={() => setActiveTab('stories')}
                >
                  Stories
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                className="bg-heritage-500 hover:bg-heritage-600 text-white"
                onClick={() => setShowPDFPreview(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Atlas
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <Sidebar 
          stats={stats}
          layerVisibility={layerVisibility}
          onLayerToggle={handleLayerToggle}
          stories={stories}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Map Container */}
          <div className="flex-1 relative">
            <MapView 
              locations={locations}
              events={events}
              layerVisibility={layerVisibility}
              timelineYear={timelineYear}
              onTimelineChange={handleTimelineChange}
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
              onCloseLocationPanel={() => setSelectedLocation(null)}
            />
          </div>

          {/* Bottom Panel - Story Preview */}
          <StoryPanel 
            currentStory={currentStory}
            onNextStory={nextStory}
            onPreviousStory={previousStory}
            storiesCount={stories.length}
          />
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 space-y-3 z-30">
        <Button
          className="bg-vintage-500 hover:bg-vintage-600 text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl"
          size="icon"
          onClick={() => setShowPDFPreview(true)}
          title="Generate PDF Atlas"
        >
          <FileText className="w-5 h-5" />
        </Button>
        <Button
          className="bg-heritage-500 hover:bg-heritage-600 text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl"
          size="icon"
          title="Add Family Member"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal 
        isOpen={showPDFPreview}
        onClose={() => setShowPDFPreview(false)}
        familyMembers={familyMembers}
        locations={locations}
        stories={stories}
      />
    </div>
  );
}
