import jsPDF from 'jspdf';
import type { FamilyMember, Location, Story } from "@shared/schema";

interface PDFGenerationData {
  familyMembers: FamilyMember[];
  locations: Location[];
  stories: Story[];
}

export async function generatePDF(data: PDFGenerationData): Promise<Blob> {
  const { familyMembers, locations, stories } = data;
  
  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Set fonts
  pdf.setFont('times', 'normal');
  
  // Page 1: Cover Page
  generateCoverPage(pdf, familyMembers, pageWidth, pageHeight);
  
  // Page 2: Table of Contents
  pdf.addPage();
  generateTableOfContents(pdf, familyMembers, locations, stories, margin);
  
  // Page 3+: Family Overview
  pdf.addPage();
  generateFamilyOverview(pdf, familyMembers, margin, contentWidth);
  
  // Family Tree Pages
  if (familyMembers.length > 0) {
    pdf.addPage();
    generateFamilyTree(pdf, familyMembers, margin, contentWidth);
  }
  
  // Location Pages
  if (locations.length > 0) {
    pdf.addPage();
    generateLocationPages(pdf, locations, margin, contentWidth);
  }
  
  // Migration Map
  if (locations.length > 1) {
    pdf.addPage();
    generateMigrationMap(pdf, locations, margin, contentWidth);
  }
  
  // Story Pages
  if (stories.length > 0) {
    pdf.addPage();
    generateStoryPages(pdf, stories, margin, contentWidth);
  }
  
  // Timeline Page
  if (familyMembers.length > 0) {
    pdf.addPage();
    generateTimelinePage(pdf, familyMembers, margin, contentWidth);
  }
  
  // Add page numbers
  addPageNumbers(pdf);
  
  return pdf.output('blob');
}

function generateCoverPage(pdf: jsPDF, familyMembers: FamilyMember[], pageWidth: number, pageHeight: number) {
  const centerX = pageWidth / 2;
  
  // Title
  pdf.setFontSize(28);
  pdf.setFont('times', 'bold');
  pdf.text('Family Atlas', centerX, 80, { align: 'center' });
  
  // Subtitle
  pdf.setFontSize(16);
  pdf.setFont('times', 'italic');
  pdf.text('A Journey Through Time and Place', centerX, 100, { align: 'center' });
  
  // Family name (if available)
  if (familyMembers.length > 0) {
    const familyName = extractFamilyName(familyMembers);
    if (familyName) {
      pdf.setFontSize(20);
      pdf.setFont('times', 'normal');
      pdf.text(`The ${familyName} Family`, centerX, 130, { align: 'center' });
    }
  }
  
  // Time span
  if (familyMembers.length > 0) {
    const timeSpan = calculateTimeSpan(familyMembers);
    pdf.setFontSize(14);
    pdf.setFont('times', 'normal');
    pdf.text(timeSpan, centerX, 160, { align: 'center' });
  }
  
  // Decorative border
  pdf.setLineWidth(1);
  pdf.rect(30, 50, pageWidth - 60, pageHeight - 100);
  
  // Generation date
  pdf.setFontSize(10);
  pdf.setFont('times', 'italic');
  const today = new Date().toLocaleDateString();
  pdf.text(`Generated on ${today}`, centerX, pageHeight - 30, { align: 'center' });
}

function generateTableOfContents(pdf: jsPDF, familyMembers: FamilyMember[], locations: Location[], stories: Story[], margin: number) {
  let y = margin + 20;
  
  pdf.setFontSize(20);
  pdf.setFont('times', 'bold');
  pdf.text('Table of Contents', margin, y);
  y += 20;
  
  pdf.setFontSize(12);
  pdf.setFont('times', 'normal');
  
  const contents = [
    'Family Overview',
    'Family Tree',
    'Geographic Locations',
    'Migration Map',
    'Family Stories',
    'Timeline',
    'Appendix'
  ];
  
  contents.forEach((item, index) => {
    pdf.text(`${index + 1}. ${item}`, margin + 10, y);
    pdf.text(`${index + 3}`, 180, y);
    y += 8;
  });
}

function generateFamilyOverview(pdf: jsPDF, familyMembers: FamilyMember[], margin: number, contentWidth: number) {
  let y = margin + 20;
  
  pdf.setFontSize(18);
  pdf.setFont('times', 'bold');
  pdf.text('Family Overview', margin, y);
  y += 15;
  
  pdf.setFontSize(12);
  pdf.setFont('times', 'normal');
  
  // Statistics
  pdf.text(`Total Family Members: ${familyMembers.length}`, margin, y);
  y += 8;
  
  const birthPlaces = new Set(familyMembers.map(m => m.birthPlace).filter(Boolean));
  pdf.text(`Unique Birth Locations: ${birthPlaces.size}`, margin, y);
  y += 8;
  
  const timeSpan = calculateTimeSpan(familyMembers);
  pdf.text(`Time Period: ${timeSpan}`, margin, y);
  y += 15;
  
  // Family members list
  pdf.setFont('times', 'bold');
  pdf.text('Family Members:', margin, y);
  y += 10;
  
  pdf.setFont('times', 'normal');
  familyMembers.forEach((member) => {
    if (y > 250) {
      pdf.addPage();
      y = margin + 20;
    }
    
    let memberText = member.name;
    if (member.birthDate || member.deathDate) {
      memberText += ` (${member.birthDate || '?'} - ${member.deathDate || 'living'})`;
    }
    if (member.birthPlace) {
      memberText += ` - Born in ${member.birthPlace}`;
    }
    
    pdf.text(memberText, margin + 5, y);
    y += 6;
  });
}

function generateFamilyTree(pdf: jsPDF, familyMembers: FamilyMember[], margin: number, contentWidth: number) {
  let y = margin + 20;
  
  pdf.setFontSize(18);
  pdf.setFont('times', 'bold');
  pdf.text('Family Tree', margin, y);
  y += 15;
  
  pdf.setFontSize(10);
  pdf.setFont('times', 'normal');
  
  // Sort members by birth date
  const sortedMembers = [...familyMembers].sort((a, b) => {
    const dateA = new Date(a.birthDate || '1900-01-01');
    const dateB = new Date(b.birthDate || '1900-01-01');
    return dateA.getTime() - dateB.getTime();
  });
  
  // Group by generation (approximate)
  const generations = groupByGeneration(sortedMembers);
  
  generations.forEach((generation, genIndex) => {
    if (y > 240) {
      pdf.addPage();
      y = margin + 20;
    }
    
    pdf.setFont('times', 'bold');
    pdf.text(`Generation ${genIndex + 1}`, margin, y);
    y += 8;
    
    pdf.setFont('times', 'normal');
    generation.forEach((member) => {
      if (y > 250) {
        pdf.addPage();
        y = margin + 20;
      }
      
      // Draw connection line
      if (genIndex > 0) {
        pdf.line(margin, y - 2, margin + 10, y - 2);
      }
      
      let memberInfo = `${member.name}`;
      if (member.birthDate) {
        memberInfo += ` (b. ${member.birthDate})`;
      }
      if (member.deathDate) {
        memberInfo += ` (d. ${member.deathDate})`;
      }
      
      pdf.text(memberInfo, margin + 15, y);
      y += 6;
      
      if (member.birthPlace || member.deathPlace) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        if (member.birthPlace) {
          pdf.text(`Born: ${member.birthPlace}`, margin + 20, y);
          y += 5;
        }
        if (member.deathPlace) {
          pdf.text(`Died: ${member.deathPlace}`, margin + 20, y);
          y += 5;
        }
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
      }
      y += 3;
    });
    y += 5;
  });
}

function generateLocationPages(pdf: jsPDF, locations: Location[], margin: number, contentWidth: number) {
  let y = margin + 20;
  
  pdf.setFontSize(18);
  pdf.setFont('times', 'bold');
  pdf.text('Geographic Locations', margin, y);
  y += 15;
  
  pdf.setFontSize(12);
  pdf.setFont('times', 'normal');
  
  locations.forEach((location) => {
    if (y > 240) {
      pdf.addPage();
      y = margin + 20;
    }
    
    // Location name
    pdf.setFont('times', 'bold');
    pdf.text(location.name, margin, y);
    y += 8;
    
    pdf.setFont('times', 'normal');
    
    // Location details
    if (location.address) {
      pdf.text(`Address: ${location.address}`, margin + 5, y);
      y += 6;
    }
    
    if (location.locationType) {
      pdf.text(`Type: ${location.locationType}`, margin + 5, y);
      y += 6;
    }
    
    if (location.timeSpan) {
      pdf.text(`Period: ${location.timeSpan}`, margin + 5, y);
      y += 6;
    }
    
    if (location.memberCount && location.memberCount > 0) {
      pdf.text(`Family Members: ${location.memberCount}`, margin + 5, y);
      y += 6;
    }
    
    // Coordinates
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`, margin + 5, y);
    y += 8;
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    y += 5;
  });
}

function generateMigrationMap(pdf: jsPDF, locations: Location[], margin: number, contentWidth: number) {
  let y = margin + 20;
  
  pdf.setFontSize(18);
  pdf.setFont('times', 'bold');
  pdf.text('Migration Patterns', margin, y);
  y += 15;
  
  pdf.setFontSize(12);
  pdf.setFont('times', 'normal');
  pdf.text('Family migration paths based on recorded locations:', margin, y);
  y += 20;
  
  // Sort locations by time span
  const sortedLocations = [...locations].sort((a, b) => {
    const yearA = extractYear(a.timeSpan);
    const yearB = extractYear(b.timeSpan);
    return yearA - yearB;
  });
  
  // Draw simple map representation
  const mapHeight = 100;
  const mapY = y;
  
  // Draw border for map area
  pdf.rect(margin, mapY, contentWidth, mapHeight);
  
  // Plot locations as points
  sortedLocations.forEach((location, index) => {
    const x = margin + 20 + (index * (contentWidth - 40) / Math.max(1, sortedLocations.length - 1));
    const locationY = mapY + 50;
    
    // Draw point
    pdf.circle(x, locationY, 2, 'F');
    
    // Label
    pdf.setFontSize(8);
    pdf.text(location.name, x - 10, locationY + 10);
    
    // Draw connection line to next location
    if (index < sortedLocations.length - 1) {
      const nextX = margin + 20 + ((index + 1) * (contentWidth - 40) / Math.max(1, sortedLocations.length - 1));
      pdf.setLineWidth(0.5);
      pdf.line(x, locationY, nextX, locationY);
    }
  });
  
  y = mapY + mapHeight + 20;
  
  // Migration timeline
  pdf.setFontSize(12);
  pdf.setFont('times', 'bold');
  pdf.text('Migration Timeline:', margin, y);
  y += 10;
  
  pdf.setFont('times', 'normal');
  sortedLocations.forEach((location, index) => {
    if (y > 250) {
      pdf.addPage();
      y = margin + 20;
    }
    
    const year = extractYear(location.timeSpan);
    pdf.text(`${year || 'Unknown'}: ${location.name}`, margin + 5, y);
    if (location.locationType) {
      pdf.text(` (${location.locationType})`, margin + 100, y);
    }
    y += 8;
  });
}

function generateStoryPages(pdf: jsPDF, stories: Story[], margin: number, contentWidth: number) {
  let y = margin + 20;
  
  pdf.setFontSize(18);
  pdf.setFont('times', 'bold');
  pdf.text('Family Stories', margin, y);
  y += 15;
  
  stories.forEach((story) => {
    if (y > 220) {
      pdf.addPage();
      y = margin + 20;
    }
    
    // Story title
    pdf.setFontSize(14);
    pdf.setFont('times', 'bold');
    pdf.text(story.title, margin, y);
    y += 10;
    
    // Story content
    pdf.setFontSize(11);
    pdf.setFont('times', 'normal');
    
    const lines = pdf.splitTextToSize(story.content, contentWidth);
    lines.forEach((line: string) => {
      if (y > 250) {
        pdf.addPage();
        y = margin + 20;
      }
      pdf.text(line, margin, y);
      y += 6;
    });
    
    y += 10;
  });
}

function generateTimelinePage(pdf: jsPDF, familyMembers: FamilyMember[], margin: number, contentWidth: number) {
  let y = margin + 20;
  
  pdf.setFontSize(18);
  pdf.setFont('times', 'bold');
  pdf.text('Family Timeline', margin, y);
  y += 15;
  
  // Collect all events with dates
  const events: Array<{ date: string; event: string; year: number }> = [];
  
  familyMembers.forEach((member) => {
    if (member.birthDate) {
      const year = extractYear(member.birthDate);
      events.push({
        date: member.birthDate,
        event: `${member.name} born${member.birthPlace ? ` in ${member.birthPlace}` : ''}`,
        year
      });
    }
    
    if (member.deathDate) {
      const year = extractYear(member.deathDate);
      events.push({
        date: member.deathDate,
        event: `${member.name} died${member.deathPlace ? ` in ${member.deathPlace}` : ''}`,
        year
      });
    }
  });
  
  // Sort events chronologically
  events.sort((a, b) => a.year - b.year);
  
  pdf.setFontSize(11);
  pdf.setFont('times', 'normal');
  
  events.forEach((event) => {
    if (y > 250) {
      pdf.addPage();
      y = margin + 20;
    }
    
    pdf.setFont('times', 'bold');
    pdf.text(event.date, margin, y);
    pdf.setFont('times', 'normal');
    pdf.text(event.event, margin + 30, y);
    y += 8;
  });
}

function addPageNumbers(pdf: jsPDF) {
  const totalPages = pdf.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setFont('times', 'normal');
    pdf.text(`${i}`, pdf.internal.pageSize.getWidth() - 20, pdf.internal.pageSize.getHeight() - 10);
  }
}

// Helper functions
function extractFamilyName(familyMembers: FamilyMember[]): string {
  if (familyMembers.length === 0) return '';
  
  // Try to extract common surname
  const surnames = familyMembers
    .map(member => member.name.split(' ').pop())
    .filter(Boolean);
  
  const surnameCount: Record<string, number> = {};
  surnames.forEach(surname => {
    surnameCount[surname!] = (surnameCount[surname!] || 0) + 1;
  });
  
  const mostCommonSurname = Object.entries(surnameCount)
    .sort(([,a], [,b]) => b - a)[0];
  
  return mostCommonSurname ? mostCommonSurname[0] : '';
}

function calculateTimeSpan(familyMembers: FamilyMember[]): string {
  if (familyMembers.length === 0) return '';
  
  const years = familyMembers
    .flatMap(member => [member.birthDate, member.deathDate])
    .filter(Boolean)
    .map(date => extractYear(date!))
    .filter(year => year > 0);
  
  if (years.length === 0) return '';
  
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  
  return `${minYear} - ${maxYear}`;
}

function extractYear(dateStr?: string): number {
  if (!dateStr) return 0;
  const match = dateStr.match(/\d{4}/);
  return match ? parseInt(match[0]) : 0;
}

function groupByGeneration(members: FamilyMember[]): FamilyMember[][] {
  // Simple generation grouping based on birth year ranges
  const generations: FamilyMember[][] = [];
  const generationSize = 30; // Approximate years per generation
  
  if (members.length === 0) return generations;
  
  const earliestYear = Math.min(...members.map(m => extractYear(m.birthDate)).filter(y => y > 0));
  
  members.forEach(member => {
    const birthYear = extractYear(member.birthDate);
    const generationIndex = birthYear > 0 ? Math.floor((birthYear - earliestYear) / generationSize) : 0;
    
    if (!generations[generationIndex]) {
      generations[generationIndex] = [];
    }
    generations[generationIndex].push(member);
  });
  
  return generations.filter(gen => gen.length > 0);
}
