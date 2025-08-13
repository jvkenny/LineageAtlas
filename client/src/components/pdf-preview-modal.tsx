import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Users, MapPin, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/pdf-generator";
import type { FamilyMember, Location, Story } from "@shared/schema";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMembers: FamilyMember[];
  locations: Location[];
  stories: Story[];
}

export function PDFPreviewModal({ 
  isOpen, 
  onClose, 
  familyMembers, 
  locations, 
  stories 
}: PDFPreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDFMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      return await generatePDF({ familyMembers, locations, stories });
    },
    onSuccess: (pdfBlob) => {
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'family-atlas.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Generated Successfully",
        description: "Your family atlas has been downloaded.",
      });
      setIsGenerating(false);
    },
    onError: () => {
      toast({
        title: "PDF Generation Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleDownloadPDF = () => {
    generatePDFMutation.mutate();
  };

  // Calculate estimated page count
  const estimatedPages = Math.max(20, 
    2 + // Cover and intro
    Math.ceil(familyMembers.length / 4) + // Family tree pages
    Math.ceil(locations.length / 3) + // Location pages
    Math.ceil(stories.length / 2) + // Story pages
    5 // Maps and appendix
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-serif font-semibold text-heritage-800">
            Family Atlas Preview
          </DialogTitle>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="bg-heritage-500 hover:bg-heritage-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Atlas Statistics */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-serif font-semibold text-heritage-800 mb-4">Atlas Contents</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Users className="h-8 w-8 text-heritage-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-heritage-700">{familyMembers.length}</p>
                    <p className="text-sm text-gray-600">Family Members</p>
                  </div>
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-heritage-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-heritage-700">{locations.length}</p>
                    <p className="text-sm text-gray-600">Locations</p>
                  </div>
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-heritage-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-heritage-700">{stories.length}</p>
                    <p className="text-sm text-gray-600">Stories</p>
                  </div>
                  <div className="text-center">
                    <Calendar className="h-8 w-8 text-heritage-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-heritage-700">{estimatedPages}</p>
                    <p className="text-sm text-gray-600">Est. Pages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDF Page Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Page Preview */}
              <Card className="aspect-[8.5/11]">
                <CardContent className="p-4 h-full">
                  <div className="bg-gradient-to-br from-heritage-50 to-heritage-100 rounded border h-full p-6 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-2xl font-serif font-bold text-heritage-800 mb-2">
                        Family Atlas
                      </h3>
                      <p className="text-heritage-600 mb-4">A Journey Through Time and Place</p>
                      <div className="w-24 h-24 bg-heritage-200 rounded-full flex items-center justify-center mb-4">
                        <Users className="text-heritage-600 h-8 w-8" />
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        Compiled from family records and memories<br/>
                        {familyMembers.length > 0 && (
                          <>
                            {Math.min(...familyMembers.map(m => parseInt(m.birthDate?.substring(0, 4) || '2024')))} - {new Date().getFullYear()}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Migration Map Preview */}
              <Card className="aspect-[8.5/11]">
                <CardContent className="p-4 h-full">
                  <div className="bg-white rounded border h-full p-4">
                    <h4 className="font-serif font-semibold text-heritage-800 mb-3">Migration Map</h4>
                    <div className="bg-heritage-50 rounded h-32 mb-3 flex items-center justify-center">
                      <MapPin className="text-heritage-300 h-12 w-12" />
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                      {locations.slice(0, 3).map((location, index) => (
                        <p key={location.id}>
                          <strong>{location.name}</strong> - {location.locationType || 'Location'} ({location.timeSpan || 'Unknown period'})
                        </p>
                      ))}
                      {locations.length > 3 && (
                        <p className="text-gray-400">...and {locations.length - 3} more locations</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Family Tree Preview */}
              <Card className="aspect-[8.5/11]">
                <CardContent className="p-4 h-full">
                  <div className="bg-white rounded border h-full p-4">
                    <h4 className="font-serif font-semibold text-heritage-800 mb-3">Family Tree</h4>
                    <div className="bg-heritage-50 rounded h-32 mb-3 flex items-center justify-center">
                      <Users className="text-heritage-300 h-12 w-12" />
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                      {familyMembers.slice(0, 4).map((member, index) => (
                        <p key={member.id}>
                          <strong>{member.name}</strong>
                          {member.birthDate && member.deathDate && (
                            <span> ({member.birthDate} - {member.deathDate})</span>
                          )}
                        </p>
                      ))}
                      {familyMembers.length > 4 && (
                        <p className="text-gray-400">...and {familyMembers.length - 4} more family members</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stories Preview */}
              <Card className="aspect-[8.5/11]">
                <CardContent className="p-4 h-full">
                  <div className="bg-white rounded border h-full p-4">
                    <h4 className="font-serif font-semibold text-heritage-800 mb-3">Family Stories</h4>
                    <div className="space-y-3">
                      {stories.slice(0, 2).map((story, index) => (
                        <div key={story.id} className="bg-heritage-50 rounded p-2">
                          <h5 className="font-medium text-heritage-700 text-xs mb-1">{story.title}</h5>
                          <p className="text-xs text-gray-600 line-clamp-3">
                            {story.content.substring(0, 120)}...
                          </p>
                        </div>
                      ))}
                      {stories.length > 2 && (
                        <p className="text-xs text-gray-400">...and {stories.length - 2} more stories</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center text-sm text-gray-500 py-4">
              <p>Preview showing sample pages - Full atlas includes detailed family tree, location maps, photo galleries, and complete migration timeline</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
