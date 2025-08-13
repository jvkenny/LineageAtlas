import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { 
  insertFamilyMemberSchema,
  insertLocationSchema,
  insertEventSchema,
  insertStorySchema,
  insertGeopackageLayerSchema,
  insertAtlasProjectSchema
} from "@shared/schema";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

async function geocodeLocation(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Using a simple geocoding approach - in production, use proper geocoding service
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

function parseGedcomData(gedcomText: string): { members: any[], events: any[] } {
  const members: any[] = [];
  const events: any[] = [];
  
  // Simple GEDCOM parsing - in production, use proper GEDCOM parser
  const lines = gedcomText.split('\n');
  let currentIndividual: any = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('0') && trimmed.includes('INDI')) {
      if (currentIndividual) {
        members.push(currentIndividual);
      }
      currentIndividual = {
        name: '',
        birthDate: null,
        deathDate: null,
        birthPlace: null,
        deathPlace: null,
        notes: '',
        photos: []
      };
    } else if (currentIndividual) {
      if (trimmed.includes('NAME')) {
        currentIndividual.name = trimmed.split('NAME ')[1] || '';
      } else if (trimmed.includes('BIRT')) {
        // Birth event processing would go here
      } else if (trimmed.includes('DEAT')) {
        // Death event processing would go here
      } else if (trimmed.includes('DATE')) {
        const date = trimmed.split('DATE ')[1];
        if (!currentIndividual.birthDate) {
          currentIndividual.birthDate = date;
        } else if (!currentIndividual.deathDate) {
          currentIndividual.deathDate = date;
        }
      } else if (trimmed.includes('PLAC')) {
        const place = trimmed.split('PLAC ')[1];
        if (!currentIndividual.birthPlace) {
          currentIndividual.birthPlace = place;
        } else if (!currentIndividual.deathPlace) {
          currentIndividual.deathPlace = place;
        }
      }
    }
  }
  
  if (currentIndividual) {
    members.push(currentIndividual);
  }
  
  return { members, events };
}

function generateStoryFromEvents(events: any[], members: any[], locations: any[]): string {
  if (events.length === 0) return '';
  
  const eventsByMember = events.reduce((acc, event) => {
    if (!acc[event.memberId]) acc[event.memberId] = [];
    acc[event.memberId].push(event);
    return acc;
  }, {});
  
  let story = '';
  
  for (const [memberId, memberEvents] of Object.entries(eventsByMember) as [string, any[]][]) {
    const member = members.find(m => m.id === memberId);
    if (!member) continue;
    
    const sortedEvents = memberEvents.sort((a, b) => {
      const dateA = new Date(a.eventDate || '1900-01-01');
      const dateB = new Date(b.eventDate || '1900-01-01');
      return dateA.getTime() - dateB.getTime();
    });
    
    story += `${member.name}'s journey began `;
    
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const location = locations.find(l => l.id === event.locationId);
      
      if (event.eventType === 'birth') {
        story += `with their birth in ${location?.name || 'an unknown location'}`;
        if (event.eventDate) story += ` in ${event.eventDate}`;
      } else if (event.eventType === 'migration') {
        story += `, followed by a significant migration to ${location?.name || 'a new location'}`;
        if (event.eventDate) story += ` in ${event.eventDate}`;
      } else if (event.eventType === 'death') {
        story += `, and their life concluded in ${location?.name || 'an unknown location'}`;
        if (event.eventDate) story += ` in ${event.eventDate}`;
      }
      
      if (i < sortedEvents.length - 1) {
        story += ', ';
      }
    }
    
    story += '. ';
    
    if (member.notes) {
      story += member.notes + ' ';
    }
  }
  
  return story.trim();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Family Members routes
  app.get("/api/family-members", async (req, res) => {
    try {
      const members = await storage.getFamilyMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch family members" });
    }
  });

  app.get("/api/family-members/:id", async (req, res) => {
    try {
      const member = await storage.getFamilyMember(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Family member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch family member" });
    }
  });

  app.post("/api/family-members", async (req, res) => {
    try {
      const validatedData = insertFamilyMemberSchema.parse(req.body);
      const member = await storage.createFamilyMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ message: "Invalid family member data" });
    }
  });

  // Locations routes
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ message: "Invalid location data" });
    }
  });

  // Events routes
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/member/:memberId", async (req, res) => {
    try {
      const events = await storage.getEventsByMember(req.params.memberId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  // Stories routes
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      const validatedData = insertStorySchema.parse(req.body);
      const story = await storage.createStory(validatedData);
      res.status(201).json(story);
    } catch (error) {
      res.status(400).json({ message: "Invalid story data" });
    }
  });

  // Generate story from events
  app.post("/api/stories/generate", async (req, res) => {
    try {
      const { eventIds, memberIds, locationIds } = req.body;
      
      const events = await storage.getEvents();
      const members = await storage.getFamilyMembers();
      const locations = await storage.getLocations();
      
      const relevantEvents = events.filter(e => eventIds?.includes(e.id));
      const relevantMembers = members.filter(m => memberIds?.includes(m.id));
      const relevantLocations = locations.filter(l => locationIds?.includes(l.id));
      
      const content = generateStoryFromEvents(relevantEvents, relevantMembers, relevantLocations);
      
      const story = await storage.createStory({
        title: "Generated Family Story",
        content,
        memberIds: memberIds || [],
        eventIds: eventIds || [],
        locationId: locationIds?.[0] || null,
        isGenerated: true
      });
      
      res.status(201).json(story);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate story" });
    }
  });

  // Geopackage layers routes
  app.get("/api/geopackage-layers", async (req, res) => {
    try {
      const layers = await storage.getGeopackageLayers();
      res.json(layers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch geopackage layers" });
    }
  });

  app.post("/api/geopackage-layers", async (req, res) => {
    try {
      const validatedData = insertGeopackageLayerSchema.parse(req.body);
      const layer = await storage.createGeopackageLayer(validatedData);
      res.status(201).json(layer);
    } catch (error) {
      res.status(400).json({ message: "Invalid geopackage layer data" });
    }
  });

  // File upload routes
  app.post("/api/upload/gedcom", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fs = await import('fs');
      const gedcomData = fs.readFileSync(req.file.path, 'utf-8');
      const { members, events } = parseGedcomData(gedcomData);
      
      const createdMembers = [];
      const createdLocations = [];
      const createdEvents = [];
      
      // Process members and locations
      for (const memberData of members) {
        if (!memberData.name) continue;
        
        const member = await storage.createFamilyMember({
          name: memberData.name,
          birthDate: memberData.birthDate,
          deathDate: memberData.deathDate,
          birthPlace: memberData.birthPlace,
          deathPlace: memberData.deathPlace,
          notes: memberData.notes || '',
          photos: memberData.photos || []
        });
        createdMembers.push(member);
        
        // Create locations for birth and death places
        const places = [
          { place: memberData.birthPlace, type: 'birth' },
          { place: memberData.deathPlace, type: 'death' }
        ].filter(p => p.place);
        
        for (const { place, type } of places) {
          const coords = await geocodeLocation(place);
          if (coords) {
            const location = await storage.createLocation({
              name: place,
              latitude: coords.lat,
              longitude: coords.lng,
              address: place,
              locationType: type,
              timeSpan: type === 'birth' ? memberData.birthDate : memberData.deathDate,
              memberCount: 1
            });
            createdLocations.push(location);
            
            // Create corresponding event
            const event = await storage.createEvent({
              memberId: member.id,
              locationId: location.id,
              eventType: type,
              eventDate: type === 'birth' ? memberData.birthDate : memberData.deathDate,
              description: `${type === 'birth' ? 'Born' : 'Died'} in ${place}`,
              notes: ''
            });
            createdEvents.push(event);
          }
        }
      }
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({
        message: "GEDCOM file processed successfully",
        members: createdMembers.length,
        locations: createdLocations.length,
        events: createdEvents.length
      });
    } catch (error) {
      console.error('GEDCOM processing error:', error);
      res.status(500).json({ message: "Failed to process GEDCOM file" });
    }
  });

  app.post("/api/upload/csv", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fs = await import('fs');
      const csvData = fs.readFileSync(req.file.path, 'utf-8');
      const lines = csvData.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must have header and data rows" });
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const createdMembers = [];
      const createdLocations = [];
      const createdEvents = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        if (!row.name) continue;
        
        const member = await storage.createFamilyMember({
          name: row.name,
          birthDate: row.birth_date || row.birthdate || null,
          deathDate: row.death_date || row.deathdate || null,
          birthPlace: row.birth_place || row.birthplace || null,
          deathPlace: row.death_place || row.deathplace || null,
          notes: row.notes || '',
          photos: []
        });
        createdMembers.push(member);
        
        // Process locations
        const places = [
          { place: row.birth_place || row.birthplace, type: 'birth' },
          { place: row.death_place || row.deathplace, type: 'death' }
        ].filter(p => p.place);
        
        for (const { place, type } of places) {
          const coords = await geocodeLocation(place);
          if (coords) {
            const location = await storage.createLocation({
              name: place,
              latitude: coords.lat,
              longitude: coords.lng,
              address: place,
              locationType: type,
              timeSpan: type === 'birth' ? (row.birth_date || row.birthdate) : (row.death_date || row.deathdate),
              memberCount: 1
            });
            createdLocations.push(location);
            
            const event = await storage.createEvent({
              memberId: member.id,
              locationId: location.id,
              eventType: type,
              eventDate: type === 'birth' ? (row.birth_date || row.birthdate) : (row.death_date || row.deathdate),
              description: `${type === 'birth' ? 'Born' : 'Died'} in ${place}`,
              notes: ''
            });
            createdEvents.push(event);
          }
        }
      }
      
      fs.unlinkSync(req.file.path);
      
      res.json({
        message: "CSV file processed successfully",
        members: createdMembers.length,
        locations: createdLocations.length,
        events: createdEvents.length
      });
    } catch (error) {
      console.error('CSV processing error:', error);
      res.status(500).json({ message: "Failed to process CSV file" });
    }
  });

  // Geocoding endpoint
  app.post("/api/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }
      
      const coords = await geocodeLocation(address);
      if (!coords) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.json(coords);
    } catch (error) {
      res.status(500).json({ message: "Geocoding failed" });
    }
  });

  // Atlas projects routes
  app.get("/api/atlas-projects", async (req, res) => {
    try {
      const projects = await storage.getAtlasProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch atlas projects" });
    }
  });

  app.post("/api/atlas-projects", async (req, res) => {
    try {
      const validatedData = insertAtlasProjectSchema.parse(req.body);
      const project = await storage.createAtlasProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid atlas project data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
