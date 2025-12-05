
import React, { useState, useEffect } from 'react';
import { Connection, ViewMode, SortOption, ContactType } from './types';
import { ConnectionCard } from './components/ConnectionCard';
import { ConnectionListRow } from './components/ConnectionListRow';
import { ConnectionDetailModal } from './components/ConnectionDetailModal';
import { CalendarView } from './components/CalendarView';
import { Button } from './components/Button';
import { LayoutGrid, List, Plus, Search, Filter, Calendar } from 'lucide-react';

const INITIAL_DATA: Connection[] = [
  {
    id: '1',
    name: 'Elena Rostova',
    company: 'Artemis Architecture',
    role: 'Principal Architect',
    emailWork: 'elena@artemis.arch',
    phoneWork: '+1 (555) 123-4567',
    address: '420 Design Blvd, Seattle, WA',
    linkedinUrl: 'https://linkedin.com/in/elenarostova',
    avatarUrl: 'https://picsum.photos/seed/elena/200',
    lastContactDate: '2023-10-15T10:00:00Z',
    lastContactType: ContactType.IN_PERSON,
    plannedContactDate: '2025-11-20T14:30:00Z',
    plannedContactType: ContactType.CALL,
    contextInput: "Met at the Sustainability Gala. Very passionate about brutalist aesthetics but warm personality. Loves dark chocolate and obscure jazz records. Mentioned she's looking for a new structural engineer for the waterfront project.",
    contextSummary: "• Passionate about brutalist aesthetics and sustainability\n• Loves dark chocolate and obscure jazz records\n• Needs a structural engineer for the waterfront project",
    overviewSummary: "• Follow-up regarding the structural engineering recommendation was the last action.\n• Passionate about brutalist aesthetics and sustainability.\n• Warm personality, enjoys dark chocolate and jazz.",
    interactions: [
      { id: '101', date: '2023-10-15T10:00:00Z', type: ContactType.IN_PERSON, notes: 'Met at Sustainability Gala. Exchanged cards.', summary: 'Initial meeting at Sustainability Gala.' },
      { id: '102', date: '2023-10-18T14:30:00Z', type: ContactType.EMAIL, notes: 'Sent follow up regarding the structural engineering recommendation.', summary: 'Follow-up on engineering recommendation.' }
    ]
  },
  {
    id: '2',
    name: 'Marcus Chen',
    company: 'Nebula Ventures',
    role: 'Managing Partner',
    emailWork: 'marcus@nebula.vc',
    phoneWork: '+1 (415) 987-6543',
    address: '101 Market St, San Francisco, CA',
    avatarUrl: 'https://picsum.photos/seed/marcus/200',
    lastContactDate: '2023-09-01T09:00:00Z',
    lastContactType: ContactType.TEAMS,
    plannedContactDate: new Date().toISOString(), // set to today for calendar demo
    plannedContactType: ContactType.TEAMS,
    contextInput: "Serious investor. Very focused on AI infrastructure. Kids play soccer. Wife is a surgeon. Hard to get on his calendar but responsive to precise emails.",
    contextSummary: "• Focused on AI Infrastructure investment\n• Family: Kids play soccer, wife is a surgeon\n• Responsive to concise emails",
    overviewSummary: "• Last catch-up pitch was too long; he values brevity.\n• Serious investor focused on AI infrastructure.\n• Hard to schedule, responds best to precise emails.",
    interactions: [
      { id: '201', date: '2023-09-01T09:00:00Z', type: ContactType.TEAMS, notes: 'Quarterly catch-up. Pitch was too long, need to shorten next time.', summary: 'Quarterly catch-up; pitch needs shortening.' }
    ]
  },
  {
    id: '3',
    name: 'Sarah Jenkins',
    company: 'Global Humanities',
    role: 'Director of Outreach',
    emailWork: 'sarah.j@gh.org',
    phoneWork: '+1 (212) 555-0199',
    address: '88 5th Ave, New York, NY',
    avatarUrl: 'https://picsum.photos/seed/sarah/200',
    lastContactDate: null,
    lastContactType: null,
    plannedContactDate: '2024-12-05T12:00:00Z',
    plannedContactType: ContactType.IN_PERSON,
    contextInput: "",
    contextSummary: "",
    overviewSummary: "",
    interactions: []
  },
  {
    id: '4',
    name: 'David Okafor',
    company: 'TechStream',
    role: 'CTO',
    emailPersonal: 'david.o@gmail.com',
    phoneWork: '+44 20 7123 4567',
    address: '12 Tech Lane, London, UK',
    avatarUrl: 'https://picsum.photos/seed/david/200',
    lastContactDate: '2023-10-25T16:00:00Z',
    lastContactType: ContactType.CALL,
    plannedContactDate: null,
    plannedContactType: null,
    contextInput: "Incredibly smart. Fast talker. Moving back to Nigeria next year to start a incubator. Needs intros to local gov officials.",
    contextSummary: "• Relocating to Nigeria next year to launch an incubator\n• Needs introductions to local government officials",
    overviewSummary: "• Discussed exit strategy from TechStream in last call.\n• Smart, fast talker moving to Nigeria for incubator project.\n• Seeking local government intros.",
    interactions: [
       { id: '401', date: '2023-10-25T16:00:00Z', type: ContactType.CALL, notes: 'Discussed his exit strategy from TechStream.', summary: 'Discussed exit strategy from TechStream.' }
    ]
  }
];

export default function App() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('lastContacted');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial data with strict validation
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kinship_connections_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
           // Basic migration to V5 fields with safeguards
           const migrated = parsed.map(c => ({
             ...c,
             plannedContactType: c.plannedContactType || ContactType.CALL,
             // Map old email/phone if they exist and new ones don't
             emailWork: c.emailWork || c.email || '',
             phoneWork: c.phoneWork || c.phone || '',
             // CRITICAL: Ensure interactions is always an array
             interactions: Array.isArray(c.interactions) ? c.interactions : [],
             // Ensure dates are valid strings or null
             lastContactDate: c.lastContactDate || null,
             plannedContactDate: c.plannedContactDate || null,
           }));
           setConnections(migrated);
        } else {
           setConnections(INITIAL_DATA);
        }
      } else {
        setConnections(INITIAL_DATA);
        localStorage.setItem('kinship_connections_v5', JSON.stringify(INITIAL_DATA));
      }
    } catch (e) {
      console.error("Failed to load connections from localStorage", e);
      // Auto-recover by resetting to default if data is corrupted
      setConnections(INITIAL_DATA);
      localStorage.removeItem('kinship_connections_v5');
    }
  }, []);

  // Save on change
  useEffect(() => {
    if (connections.length > 0) {
      localStorage.setItem('kinship_connections_v5', JSON.stringify(connections));
    }
  }, [connections]);

  const handleAddConnection = () => {
      // Select 'new' to trigger empty modal
      setSelectedConnectionId('new');
  };

  const handleSaveConnection = (updated: Connection) => {
    if (updated.id === 'new') {
        // Create actual new connection
        const newId = Date.now().toString();
        const finalConnection = { ...updated, id: newId };
        setConnections(prev => [finalConnection, ...prev]);
        setSelectedConnectionId(null); // Close modal
    } else {
        setConnections(prev => prev.map(c => c.id === updated.id ? updated : c));
    }
  };

  const filteredConnections = connections
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.company