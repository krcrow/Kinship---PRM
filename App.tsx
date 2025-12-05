
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

  // Load initial data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kinship_connections_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
           // Basic migration to V5 fields
           const migrated = parsed.map(c => ({
             ...c,
             plannedContactType: c.plannedContactType || ContactType.CALL,
             // Map old email/phone if they exist and new ones don't
             emailWork: c.emailWork || c.email || '',
             phoneWork: c.phoneWork || c.phone || ''
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
      // Create a temporary "new" connection object
      const newConnection: Connection = {
          id: 'new',
          name: '',
          company: '',
          role: '',
          address: '',
          emailWork: '',
          contextInput: '',
          contextSummary: '',
          overviewSummary: '',
          interactions: [],
          lastContactDate: null,
          lastContactType: null,
          plannedContactDate: null,
          plannedContactType: ContactType.CALL
      };
      // We don't add it to the list yet, just open the modal with it
      // Since our modal relies on finding the ID in the list, we need a separate state or 
      // temporarily add it to list?
      // Better: pass the object directly to modal if we change how modal works, 
      // BUT current implementation finds by ID.
      // Let's modify the selection logic slightly:
      // If selectedConnectionId is 'new', we pass the blank object.
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
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.company.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'lastContacted') {
        const dateA = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0;
        const dateB = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0;
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
      }
      if (sortBy === 'upcoming') {
        const dateA = a.plannedContactDate ? new Date(a.plannedContactDate).getTime() : 9999999999999;
        const dateB = b.plannedContactDate ? new Date(b.plannedContactDate).getTime() : 9999999999999;
        return (isNaN(dateA) ? 9999999999999 : dateA) - (isNaN(dateB) ? 9999999999999 : dateB);
      }
      return 0;
    });

  // Helper to determine what to pass to modal
  const getSelectedConnection = () => {
      if (selectedConnectionId === 'new') {
           return {
              id: 'new',
              name: '',
              company: '',
              role: '',
              address: '',
              emailWork: '',
              contextInput: '',
              contextSummary: '',
              overviewSummary: '',
              interactions: [],
              lastContactDate: null,
              lastContactType: null,
              plannedContactDate: null,
              plannedContactType: ContactType.CALL
          } as Connection;
      }
      return connections.find(c => c.id === selectedConnectionId);
  }

  const selectedConnection = getSelectedConnection();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-20">
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">K</div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Kinship</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4"/>} onClick={handleAddConnection}>Add Connection</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search connections..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
             <div className="flex items-center gap-2 bg-white rounded-lg border border-stone-200 p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  <Calendar className="w-4 h-4" />
                </button>
             </div>

             <div className="relative">
               <select 
                 className="appearance-none bg-white pl-9 pr-8 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 focus:outline-none focus:border-stone-400 cursor-pointer"
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value as SortOption)}
               >
                 <option value="lastContacted">Recently Contacted</option>
                 <option value="name">Name (A-Z)</option>
                 <option value="upcoming">Upcoming Plans</option>
               </select>
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
             </div>
          </div>
        </div>

        {/* Content View */}
        {filteredConnections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-500">No connections found matching your search.</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConnections.map(c => (
                  <ConnectionCard key={c.id} connection={c} onClick={() => setSelectedConnectionId(c.id)} />
                ))}
              </div>
            )}
            {viewMode === 'list' && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                {filteredConnections.map(c => (
                  <ConnectionListRow key={c.id} connection={c} onClick={() => setSelectedConnectionId(c.id)} />
                ))}
              </div>
            )}
            {viewMode === 'calendar' && (
              <CalendarView connections={filteredConnections} onSelectConnection={setSelectedConnectionId} />
            )}
          </>
        )}
      </main>

      {/* Detail Modal */}
      {selectedConnection && (
        <ConnectionDetailModal 
          connection={selectedConnection} 
          onClose={() => setSelectedConnectionId(null)}
          onUpdate={handleSaveConnection}
          isNew={selectedConnectionId === 'new'}
        />
      )}
    </div>
  );
}
