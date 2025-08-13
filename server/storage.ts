import { 
  type FamilyMember, 
  type InsertFamilyMember,
  type Location,
  type InsertLocation,
  type Event,
  type InsertEvent,
  type Story,
  type InsertStory,
  type GeopackageLayer,
  type InsertGeopackageLayer,
  type AtlasProject,
  type InsertAtlasProject
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Family Members
  getFamilyMembers(): Promise<FamilyMember[]>;
  getFamilyMember(id: string): Promise<FamilyMember | undefined>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: string, member: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined>;
  deleteFamilyMember(id: string): Promise<boolean>;

  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: string): Promise<boolean>;

  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByMember(memberId: string): Promise<Event[]>;
  getEventsByLocation(locationId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Stories
  getStories(): Promise<Story[]>;
  getStory(id: string): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: string, story: Partial<InsertStory>): Promise<Story | undefined>;
  deleteStory(id: string): Promise<boolean>;

  // Geopackage Layers
  getGeopackageLayers(): Promise<GeopackageLayer[]>;
  getGeopackageLayer(id: string): Promise<GeopackageLayer | undefined>;
  createGeopackageLayer(layer: InsertGeopackageLayer): Promise<GeopackageLayer>;
  updateGeopackageLayer(id: string, layer: Partial<InsertGeopackageLayer>): Promise<GeopackageLayer | undefined>;
  deleteGeopackageLayer(id: string): Promise<boolean>;

  // Atlas Projects
  getAtlasProjects(): Promise<AtlasProject[]>;
  getAtlasProject(id: string): Promise<AtlasProject | undefined>;
  createAtlasProject(project: InsertAtlasProject): Promise<AtlasProject>;
  updateAtlasProject(id: string, project: Partial<InsertAtlasProject>): Promise<AtlasProject | undefined>;
  deleteAtlasProject(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private familyMembers: Map<string, FamilyMember>;
  private locations: Map<string, Location>;
  private events: Map<string, Event>;
  private stories: Map<string, Story>;
  private geopackageLayers: Map<string, GeopackageLayer>;
  private atlasProjects: Map<string, AtlasProject>;

  constructor() {
    this.familyMembers = new Map();
    this.locations = new Map();
    this.events = new Map();
    this.stories = new Map();
    this.geopackageLayers = new Map();
    this.atlasProjects = new Map();
  }

  // Family Members
  async getFamilyMembers(): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values());
  }

  async getFamilyMember(id: string): Promise<FamilyMember | undefined> {
    return this.familyMembers.get(id);
  }

  async createFamilyMember(insertMember: InsertFamilyMember): Promise<FamilyMember> {
    const id = randomUUID();
    const member: FamilyMember = {
      ...insertMember,
      id,
      createdAt: new Date(),
    };
    this.familyMembers.set(id, member);
    return member;
  }

  async updateFamilyMember(id: string, updateData: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined> {
    const member = this.familyMembers.get(id);
    if (!member) return undefined;
    
    const updated = { ...member, ...updateData };
    this.familyMembers.set(id, updated);
    return updated;
  }

  async deleteFamilyMember(id: string): Promise<boolean> {
    return this.familyMembers.delete(id);
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async getLocation(id: string): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const location: Location = {
      ...insertLocation,
      id,
      createdAt: new Date(),
    };
    this.locations.set(id, location);
    return location;
  }

  async updateLocation(id: string, updateData: Partial<InsertLocation>): Promise<Location | undefined> {
    const location = this.locations.get(id);
    if (!location) return undefined;
    
    const updated = { ...location, ...updateData };
    this.locations.set(id, updated);
    return updated;
  }

  async deleteLocation(id: string): Promise<boolean> {
    return this.locations.delete(id);
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByMember(memberId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => event.memberId === memberId);
  }

  async getEventsByLocation(locationId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => event.locationId === locationId);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      ...insertEvent,
      id,
      createdAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updated = { ...event, ...updateData };
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Stories
  async getStories(): Promise<Story[]> {
    return Array.from(this.stories.values());
  }

  async getStory(id: string): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = randomUUID();
    const story: Story = {
      ...insertStory,
      id,
      createdAt: new Date(),
    };
    this.stories.set(id, story);
    return story;
  }

  async updateStory(id: string, updateData: Partial<InsertStory>): Promise<Story | undefined> {
    const story = this.stories.get(id);
    if (!story) return undefined;
    
    const updated = { ...story, ...updateData };
    this.stories.set(id, updated);
    return updated;
  }

  async deleteStory(id: string): Promise<boolean> {
    return this.stories.delete(id);
  }

  // Geopackage Layers
  async getGeopackageLayers(): Promise<GeopackageLayer[]> {
    return Array.from(this.geopackageLayers.values());
  }

  async getGeopackageLayer(id: string): Promise<GeopackageLayer | undefined> {
    return this.geopackageLayers.get(id);
  }

  async createGeopackageLayer(insertLayer: InsertGeopackageLayer): Promise<GeopackageLayer> {
    const id = randomUUID();
    const layer: GeopackageLayer = {
      ...insertLayer,
      id,
      createdAt: new Date(),
    };
    this.geopackageLayers.set(id, layer);
    return layer;
  }

  async updateGeopackageLayer(id: string, updateData: Partial<InsertGeopackageLayer>): Promise<GeopackageLayer | undefined> {
    const layer = this.geopackageLayers.get(id);
    if (!layer) return undefined;
    
    const updated = { ...layer, ...updateData };
    this.geopackageLayers.set(id, updated);
    return updated;
  }

  async deleteGeopackageLayer(id: string): Promise<boolean> {
    return this.geopackageLayers.delete(id);
  }

  // Atlas Projects
  async getAtlasProjects(): Promise<AtlasProject[]> {
    return Array.from(this.atlasProjects.values());
  }

  async getAtlasProject(id: string): Promise<AtlasProject | undefined> {
    return this.atlasProjects.get(id);
  }

  async createAtlasProject(insertProject: InsertAtlasProject): Promise<AtlasProject> {
    const id = randomUUID();
    const project: AtlasProject = {
      ...insertProject,
      id,
      createdAt: new Date(),
    };
    this.atlasProjects.set(id, project);
    return project;
  }

  async updateAtlasProject(id: string, updateData: Partial<InsertAtlasProject>): Promise<AtlasProject | undefined> {
    const project = this.atlasProjects.get(id);
    if (!project) return undefined;
    
    const updated = { ...project, ...updateData };
    this.atlasProjects.set(id, updated);
    return updated;
  }

  async deleteAtlasProject(id: string): Promise<boolean> {
    return this.atlasProjects.delete(id);
  }
}

export const storage = new MemStorage();
