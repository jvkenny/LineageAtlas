interface GedcomIndividual {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  notes?: string;
  events: GedcomEvent[];
}

interface GedcomEvent {
  type: string;
  date?: string;
  place?: string;
  description?: string;
}

interface GedcomFamily {
  id: string;
  husband?: string;
  wife?: string;
  children: string[];
  marriageDate?: string;
  marriagePlace?: string;
}

export interface ParsedGedcomData {
  individuals: GedcomIndividual[];
  families: GedcomFamily[];
  events: GedcomEvent[];
}

export function parseGedcom(gedcomText: string): ParsedGedcomData {
  const lines = gedcomText.split('\n').map(line => line.trim()).filter(line => line);
  const individuals: GedcomIndividual[] = [];
  const families: GedcomFamily[] = [];
  const events: GedcomEvent[] = [];
  
  let currentContext: 'individual' | 'family' | null = null;
  let currentIndividual: Partial<GedcomIndividual> | null = null;
  let currentFamily: Partial<GedcomFamily> | null = null;
  let currentEvent: Partial<GedcomEvent> | null = null;
  
  for (const line of lines) {
    const parts = line.split(' ');
    const level = parseInt(parts[0]);
    const tag = parts[1];
    const value = parts.slice(2).join(' ');
    
    if (level === 0) {
      // Save previous context
      if (currentIndividual && currentIndividual.id) {
        individuals.push(currentIndividual as GedcomIndividual);
      }
      if (currentFamily && currentFamily.id) {
        families.push(currentFamily as GedcomFamily);
      }
      
      // Start new context
      if (tag.includes('INDI')) {
        currentContext = 'individual';
        currentIndividual = {
          id: tag,
          name: '',
          events: []
        };
      } else if (tag.includes('FAM')) {
        currentContext = 'family';
        currentFamily = {
          id: tag,
          children: []
        };
      } else {
        currentContext = null;
        currentIndividual = null;
        currentFamily = null;
      }
    } else if (level === 1) {
      if (currentContext === 'individual' && currentIndividual) {
        switch (tag) {
          case 'NAME':
            currentIndividual.name = value.replace(/\//g, '');
            break;
          case 'BIRT':
            currentEvent = { type: 'birth' };
            break;
          case 'DEAT':
            currentEvent = { type: 'death' };
            break;
          case 'RESI':
            currentEvent = { type: 'residence' };
            break;
          case 'NOTE':
            currentIndividual.notes = value;
            break;
        }
      } else if (currentContext === 'family' && currentFamily) {
        switch (tag) {
          case 'HUSB':
            currentFamily.husband = value;
            break;
          case 'WIFE':
            currentFamily.wife = value;
            break;
          case 'CHIL':
            currentFamily.children.push(value);
            break;
          case 'MARR':
            currentEvent = { type: 'marriage' };
            break;
        }
      }
    } else if (level === 2) {
      if (currentEvent) {
        switch (tag) {
          case 'DATE':
            currentEvent.date = value;
            break;
          case 'PLAC':
            currentEvent.place = value;
            break;
        }
      }
      
      // Close event and add to appropriate context
      if (currentEvent && (tag === 'DATE' || tag === 'PLAC')) {
        if (currentContext === 'individual' && currentIndividual) {
          if (currentEvent.type === 'birth') {
            currentIndividual.birthDate = currentEvent.date;
            currentIndividual.birthPlace = currentEvent.place;
          } else if (currentEvent.type === 'death') {
            currentIndividual.deathDate = currentEvent.date;
            currentIndividual.deathPlace = currentEvent.place;
          }
          currentIndividual.events.push(currentEvent as GedcomEvent);
        } else if (currentContext === 'family' && currentFamily) {
          if (currentEvent.type === 'marriage') {
            currentFamily.marriageDate = currentEvent.date;
            currentFamily.marriagePlace = currentEvent.place;
          }
        }
        events.push(currentEvent as GedcomEvent);
        currentEvent = null;
      }
    }
  }
  
  // Save final context
  if (currentIndividual && currentIndividual.id) {
    individuals.push(currentIndividual as GedcomIndividual);
  }
  if (currentFamily && currentFamily.id) {
    families.push(currentFamily as GedcomFamily);
  }
  
  return { individuals, families, events };
}

export function parseCsv(csvText: string): GedcomIndividual[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const individuals: GedcomIndividual[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    if (!row.name) continue;
    
    const individual: GedcomIndividual = {
      id: `I${i}`,
      name: row.name,
      birthDate: row.birth_date || row.birthdate || undefined,
      deathDate: row.death_date || row.deathdate || undefined,
      birthPlace: row.birth_place || row.birthplace || undefined,
      deathPlace: row.death_place || row.deathplace || undefined,
      notes: row.notes || undefined,
      events: []
    };
    
    // Create events for birth and death
    if (individual.birthDate || individual.birthPlace) {
      individual.events.push({
        type: 'birth',
        date: individual.birthDate,
        place: individual.birthPlace,
        description: `Born in ${individual.birthPlace || 'unknown location'}`
      });
    }
    
    if (individual.deathDate || individual.deathPlace) {
      individual.events.push({
        type: 'death',
        date: individual.deathDate,
        place: individual.deathPlace,
        description: `Died in ${individual.deathPlace || 'unknown location'}`
      });
    }
    
    individuals.push(individual);
  }
  
  return individuals;
}
