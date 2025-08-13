import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ZoomIn, Maximize, Camera, Play } from "lucide-react";
import type { Location, Event } from "@shared/schema";

// Import Leaflet dynamically to avoid SSR issues
let L: any = null;
if (typeof window !== 'undefined') {
  import('leaflet').then((leaflet) => {
    L = leaflet.default;
    
    // Fix for default markers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  });
}

interface MapViewProps {
  locations: Location[];
  events: Event[];
  layerVisibility: Record<string, boolean>;
  timelineYear: number;
  onTimelineChange: (year: number) => void;
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
  onCloseLocationPanel: () => void;
}

export function MapView({
  locations,
  events,
  layerVisibility,
  timelineYear,
  onTimelineChange,
  onLocationSelect,
  selectedLocation,
  onCloseLocationPanel,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Calculate timeline bounds
  const timelineBounds = {
    min: 1840,
    max: new Date().getFullYear(),
  };

  useEffect(() => {
    if (!mapRef.current || !L || isMapLoaded) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([42.3601, -71.0589], 6);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    setIsMapLoaded(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMapLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !L || !layerVisibility.familyLocations) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Filter locations by timeline
    const filteredLocations = locations.filter(location => {
      if (!location.timeSpan) return true;
      
      const yearMatch = location.timeSpan.match(/\d{4}/);
      if (!yearMatch) return true;
      
      const locationYear = parseInt(yearMatch[0]);
      return locationYear <= timelineYear;
    });

    // Add markers for filtered locations
    filteredLocations.forEach(location => {
      const marker = L.marker([location.latitude, location.longitude])
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-serif font-semibold">${location.name}</h3>
            <p class="text-sm text-gray-600">${location.memberCount || 0} family members</p>
            <p class="text-sm text-gray-600">${location.timeSpan || 'Unknown period'}</p>
          </div>
        `)
        .on('click', () => {
          onLocationSelect(location);
        });

      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    });

    // Add migration paths if enabled
    if (layerVisibility.migrationPaths && filteredLocations.length > 1) {
      const sortedLocations = filteredLocations.sort((a, b) => {
        const aYear = a.timeSpan ? parseInt(a.timeSpan.match(/\d{4}/)?.[0] || '0') : 0;
        const bYear = b.timeSpan ? parseInt(b.timeSpan.match(/\d{4}/)?.[0] || '0') : 0;
        return aYear - bYear;
      });

      const pathCoords = sortedLocations.map(loc => [loc.latitude, loc.longitude]);
      
      const migrationPath = L.polyline(pathCoords, {
        color: '#2C5530',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 5'
      });

      migrationPath.addTo(mapInstanceRef.current);
      markersRef.current.push(migrationPath);
    }

  }, [locations, events, layerVisibility, timelineYear, onLocationSelect]);

  const handleZoomToFit = () => {
    if (!mapInstanceRef.current || markersRef.current.length === 0) return;
    
    const group = L.featureGroup(markersRef.current.filter(item => item.getLatLng));
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleExportMapView = () => {
    // Placeholder for map export functionality
    console.log('Export map view');
  };

  const handlePlayTimeline = () => {
    // Placeholder for timeline animation
    console.log('Play timeline animation');
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white hover:bg-gray-50 shadow-lg"
          onClick={handleZoomToFit}
          title="Zoom to fit all locations"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-white hover:bg-gray-50 shadow-lg"
          onClick={handleToggleFullscreen}
          title="Toggle fullscreen"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-white hover:bg-gray-50 shadow-lg"
          onClick={handleExportMapView}
          title="Export map view"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline Scrubber */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-heritage-800 min-w-0">Timeline:</span>
          <div className="flex-1">
            <input
              type="range"
              min={timelineBounds.min}
              max={timelineBounds.max}
              value={timelineYear}
              onChange={(e) => onTimelineChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          <div className="flex space-x-2 text-sm text-gray-600">
            <span>{timelineBounds.min}</span>
            <span>-</span>
            <span>{timelineBounds.max}</span>
          </div>
          <Button
            size="sm"
            className="bg-heritage-500 hover:bg-heritage-600 text-white"
            onClick={handlePlayTimeline}
          >
            <Play className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Location Info Panel */}
      {selectedLocation && (
        <Card className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm shadow-lg max-w-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-serif font-semibold text-heritage-800">{selectedLocation.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCloseLocationPanel}
                className="text-gray-400 hover:text-gray-600 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Family Members:</span>
                <span className="font-medium">{selectedLocation.memberCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Period:</span>
                <span className="font-medium">{selectedLocation.timeSpan || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location Type:</span>
                <span className="font-medium">{selectedLocation.locationType || 'General'}</span>
              </div>
            </div>
            {selectedLocation.address && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedLocation.address}
                </p>
              </div>
            )}
            <div className="mt-3 flex space-x-2">
              <Button size="sm" className="bg-heritage-500 hover:bg-heritage-600 text-white">
                View Stories
              </Button>
              <Button size="sm" variant="secondary">
                Edit Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
