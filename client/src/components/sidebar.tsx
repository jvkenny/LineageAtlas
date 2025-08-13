import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, MapPin, Users, Clock } from "lucide-react";
import type { Story } from "@shared/schema";

interface SidebarProps {
  stats: {
    memberCount: number;
    locationCount: number;
    storyCount: number;
    timeSpan: string;
  };
  layerVisibility: Record<string, boolean>;
  onLayerToggle: (layerName: string, visible: boolean) => void;
  stories: Story[];
}

export function Sidebar({ stats, layerVisibility, onLayerToggle, stories }: SidebarProps) {
  const gedcomInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const gpkgInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadGedcomMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest('POST', '/api/upload/gedcom', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "GEDCOM file processed successfully",
        description: `Imported ${data.members} family members, ${data.locations} locations, and ${data.events} events.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process GEDCOM file. Please check the file format.",
        variant: "destructive",
      });
    },
  });

  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest('POST', '/api/upload/csv', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "CSV file processed successfully",
        description: `Imported ${data.members} family members, ${data.locations} locations, and ${data.events} events.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process CSV file. Please check the file format.",
        variant: "destructive",
      });
    },
  });

  const handleGedcomUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadGedcomMutation.mutate(file);
    }
    event.target.value = '';
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadCsvMutation.mutate(file);
    }
    event.target.value = '';
  };

  const handleGpkgUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "QGIS Geopackage Upload",
        description: "Geopackage processing is not yet implemented.",
      });
    }
    event.target.value = '';
  };

  const recentStories = stories.slice(-3).reverse();

  return (
    <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Import Section */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-serif font-semibold text-heritage-800 mb-4">Import Family Data</h2>
        <div className="space-y-3">
          <div 
            className="border-2 border-dashed border-gray-300 hover:border-heritage-400 rounded-lg p-4 text-center cursor-pointer transition-colors"
            onClick={() => gedcomInputRef.current?.click()}
          >
            <Upload className="text-heritage-400 h-6 w-6 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Drop GEDCOM or CSV files here</p>
            <p className="text-xs text-gray-400">or click to browse</p>
          </div>
          
          <div 
            className="border-2 border-dashed border-gray-300 hover:border-heritage-400 rounded-lg p-4 text-center cursor-pointer transition-colors"
            onClick={() => gpkgInputRef.current?.click()}
          >
            <MapPin className="text-heritage-400 h-6 w-6 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Add QGIS Geopackage (.gpkg)</p>
            <p className="text-xs text-gray-400">Vector and raster layers</p>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={gedcomInputRef}
          type="file"
          accept=".ged,.gedcom,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.name.toLowerCase().endsWith('.csv')) {
                handleCsvUpload(e);
              } else {
                handleGedcomUpload(e);
              }
            }
          }}
          className="hidden"
        />
        
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
          className="hidden"
        />
        
        <input
          ref={gpkgInputRef}
          type="file"
          accept=".gpkg"
          onChange={handleGpkgUpload}
          className="hidden"
        />
      </div>

      {/* Family Summary */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-md font-serif font-semibold text-heritage-800 mb-3">Current Atlas</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Family Members:</span>
            <span className="font-medium">{stats.memberCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Locations:</span>
            <span className="font-medium">{stats.locationCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time Span:</span>
            <span className="font-medium">{stats.timeSpan}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Stories Generated:</span>
            <span className="font-medium">{stats.storyCount}</span>
          </div>
        </div>
      </div>

      {/* Map Layers */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-md font-serif font-semibold text-heritage-800 mb-3">Map Layers</h3>
        <div className="space-y-2">
          {Object.entries(layerVisibility).map(([layerKey, isVisible]) => {
            const layerLabels: Record<string, string> = {
              familyLocations: "Family Locations",
              migrationPaths: "Migration Paths",
              historicalMaps: "Historical Maps",
              cemeteries: "Cemeteries",
              customGeopackage: "Custom Layers (GPKG)"
            };
            
            return (
              <div key={layerKey} className="flex items-center space-x-2">
                <Checkbox
                  id={layerKey}
                  checked={isVisible}
                  onCheckedChange={(checked) => onLayerToggle(layerKey, checked as boolean)}
                  className="border-gray-300 text-heritage-600 focus:ring-heritage-500"
                />
                <label htmlFor={layerKey} className="text-sm text-gray-700 cursor-pointer">
                  {layerLabels[layerKey]}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-md font-serif font-semibold text-heritage-800 mb-3">Recent Stories</h3>
        <div className="space-y-3">
          {recentStories.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No stories generated yet</p>
              <p className="text-xs text-gray-400 mt-1">Import family data to start creating stories</p>
            </div>
          ) : (
            recentStories.map((story) => (
              <div key={story.id} className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-start space-x-3">
                  <MapPin className="text-heritage-500 mt-1 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{story.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{story.content.substring(0, 100)}...</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
