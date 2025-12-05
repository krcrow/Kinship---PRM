
import React, { useState, useRef, useEffect } from 'react';
import { Connection, ContactType, Interaction } from '../types';
import { Button } from './Button';
import { X, Mail, Phone, MapPin, Calendar, Sparkles, Mic, Clock, ArrowRight, Linkedin, Save, User } from 'lucide-react';
import { generateContextSummary, generateInteractionSummary, generateOverviewSummary } from '../services/geminiService';

interface ConnectionDetailModalProps {
  connection: Connection;
  onClose: () => void;
  onUpdate: (updatedConnection: Connection) => void;
  isNew?: boolean;
}

// --- Helper Component: Editable Field ---
interface EditableFieldProps {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  label?: string; // For screen readers or tooltips
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  value, 
  onSave, 
  placeholder = 'Add...', 
  className = '', 
  inputClassName = '',
  label
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`bg-white/80 border-b-2 border-amber-400 outline-none text-stone-800 px-1 ${inputClassName}`}
        aria-label={label}
      />
    );
  }

  return (
    <span 
      onDoubleClick={() => setIsEditing(true)} 
      className={`cursor-text hover:bg-stone-100/50 rounded px-1 -mx-1 transition-colors border border-transparent hover:border-stone-200/50 whitespace-pre-wrap ${!value ? 'text-stone-300 italic' : ''} ${className}`}
      title={`Double-click to edit ${label || ''}`}
    >
      {value || placeholder}
    </span>
  );
};

export const ConnectionDetailModal: React.FC<ConnectionDetailModalProps> = ({ connection, onClose, onUpdate, isNew = false }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'context' | 'timeline' | 'contact'>('overview');

  // Context State
  const [contextInput, setContextInput] = useState(connection.contextInput || '');
  const [contextSummary, setContextSummary] = useState(connection.contextSummary || '');
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [isListeningContext, setIsListeningContext] = useState(false);
  
  // Interaction Logging State
  const [newInteractionNote, setNewInteractionNote] = useState('');
  const [newInteractionType, setNewInteractionType] = useState<ContactType>(ContactType.EMAIL);
  const [newInteractionDate, setNewInteractionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isListeningInteraction, setIsListeningInteraction] = useState(false);
  const [isSavingInteraction, setIsSavingInteraction] = useState(false);

  // Planning State
  const [plannedDate, setPlannedDate] = useState(connection.plannedContactDate ? new Date(connection.plannedContactDate).toISOString().slice(0, 16) : '');
  const [plannedType, setPlannedType] = useState<ContactType>(connection.plannedContactType || ContactType.CALL);
  
  // Contact Info State (For Contact Tab)
  // We keep local state for the Contact tab inputs to handle normal form behavior, 
  // but the Header uses direct onUpdate via EditableField.
  const [emailWork, setEmailWork] = useState(connection.emailWork || '');
  const [emailPersonal, setEmailPersonal] = useState(connection.emailPersonal || '');
  const [phoneWork, setPhoneWork] = useState(connection.phoneWork || '');
  const [phonePersonal, setPhonePersonal] = useState(connection.phonePersonal || '');
  const [address, setAddress] = useState(connection.address || '');
  const [linkedinUrl, setLinkedinUrl] = useState(connection.linkedinUrl || '');

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Sync state if connection prop changes
  useEffect(() => {
    setEmailWork(connection.emailWork || '');
    setEmailPersonal(connection.emailPersonal || '');
    setPhoneWork(connection.phoneWork || '');
    setPhonePersonal(connection.phonePersonal || '');
    setAddress(connection.address || '');
    setLinkedinUrl(connection.linkedinUrl || '');
    setContextInput(connection.contextInput || '');
  }, [connection]);

  // --- Helpers & Logic ---

  const getDaysDormant = () => {
    if (!connection.lastContactDate) return 999;
    const last = new Date(connection.lastContactDate);
    const now = new Date();
    return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getHealthScore = () => {
    const days = getDaysDormant();
    if (days <= 14) return { score: 95, label: 'High', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
    if (days <= 30) return { score: 60, label: 'Medium', color: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' };
    return { score: 25, label: 'Low', color: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-50' };
  };

  const isPlannedDateInFuture = () => {
    if (!connection.plannedContactDate) return false;
    return new Date(connection.plannedContactDate).getTime() > new Date().getTime();
  };

  // --- Handlers ---

  const handleUpdateField = (field: keyof Connection, value: string) => {
    onUpdate({ ...connection, [field]: value });
  };

  const simulateVoiceInput = (setter: React.Dispatch<React.SetStateAction<string>>, listenerSetter: React.Dispatch<React.SetStateAction<boolean>>, context: 'context' | 'log') => {
    listenerSetter(true);
    setTimeout(() => {
      listenerSetter(false);
      const sampleText = context === 'context' 
        ? "Just found out they are huge fans of classic sci-fi novels. Also, they're planning a sabbatical in Italy next summer."
        : "Had a long lunch meeting. We went over the Q3 budget in detail. They were concerned about the marketing spend but happy with the engineering velocity. Agreed to regroup in two weeks.";
      setter(prev => prev ? prev + "\n" + sampleText : sampleText);
    }, 2000);
  };

  const handleGenerateContextSummary = async () => {
    if (!contextInput.trim()) return;
    setIsGeneratingContext(true);
    
    // 1. Generate Context Summary
    const summary = await generateContextSummary(contextInput, connection.name);
    setContextSummary(summary);
    
    // 2. Also update Overview Summary if we have a last interaction, otherwise just use context
    // V6 Fix: Use summary (Recap) if available for better overview
    const lastInteraction = connection.interactions.length > 0 ? connection.interactions[0] : null;
    const lastNote = lastInteraction ? lastInteraction.notes : '';
    const lastSummary = lastInteraction ? lastInteraction.summary : '';

    const masterSummary = await generateOverviewSummary(contextInput, lastNote, lastSummary, connection.name);

    onUpdate({
      ...connection,
      contextInput,
      contextSummary: summary,
      overviewSummary: masterSummary
    });
    setIsGeneratingContext(false);
  };

  const handleLogInteraction = async () => {
    if (!newInteractionNote.trim()) return;
    setIsSavingInteraction(true);

    // 1. Generate Summary of the interaction
    const interactionSummary = await generateInteractionSummary(newInteractionNote);

    // 2. Create Interaction Object
    const newInteraction: Interaction = {
      id: Date.now().toString(),
      date: new Date(newInteractionDate).toISOString(),
      type: newInteractionType,
      notes: newInteractionNote,
      summary: interactionSummary
    };

    const updatedInteractions = [newInteraction, ...connection.interactions];
    updatedInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 3. Auto-Update Overview Summary
    // V6 Fix: Pass the newly generated interactionSummary instead of just notes
    const newOverviewSummary = await generateOverviewSummary(contextInput, newInteractionNote, interactionSummary, connection.name);

    const updatedConnection = {
      ...connection,
      interactions: updatedInteractions,
      lastContactDate: newInteraction.date,
      lastContactType: newInteraction.type,
      overviewSummary: newOverviewSummary
    };

    onUpdate(updatedConnection);
    setNewInteractionNote(''); 
    setIsSavingInteraction(false);
  };

  const handleUpdatePlannedDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPlannedDate(val);
    const isoDate = val ? new Date(val).toISOString() : null;
    onUpdate({ 
      ...connection, 
      plannedContactDate: isoDate,
      plannedContactType: plannedType 
    });
  };
  
  const handleUpdatePlannedType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as ContactType;
    setPlannedType(val);
    onUpdate({
      ...connection,
      plannedContactType: val
    });
  };

  const handleSaveNewConnection = () => {
      // In "New" mode, fields are already updating the parent state via onUpdate.
      // This button just closes the modal essentially, as onUpdate has been saving changes in real-time
      // or we can treat it as a final confirmation.
      onClose();
  };

  const handleBlurContactField = () => {
      // Auto-save contact fields on blur
      onUpdate({
          ...connection,
          emailWork,
          emailPersonal,
          phoneWork,
          phonePersonal,
          address,
          linkedinUrl
      });
  };

  const health = getHealthScore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[800px] animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER - Inline Editing */}
        <div className="flex items-start justify-between p-6 border-b border-stone-100 bg-stone-50/50 shrink-0">
          <div className="flex items-center gap-6 w-full">
             {/* Avatar */}
             <div className="w-20 h-20 rounded-full bg-white shadow-sm p-1 border border-stone-200 shrink-0">
               {connection.avatarUrl ? (
                   <img src={connection.avatarUrl} alt={connection.name} className="w-full h-full rounded-full object-cover" />
               ) : (
                   <div className="w-full h-full rounded-full bg-stone-100 flex items-center justify-center">
                       <User className="w-8 h-8 text-stone-300" />
                   </div>
               )}
             </div>
             
             {/* Info Fields */}
             <div className="flex-1 min-w-0 space-y-1">
                {/* Name */}
                <div className="text-2xl font-bold text-stone-900 leading-tight">
                  <EditableField 
                    value={connection.name} 
                    onSave={(val) => handleUpdateField('name', val)} 
                    placeholder="Connection Name"
                    label="Name"
                    inputClassName="font-bold w-full max-w-md"
                  />
                </div>
                
                {/* Role & Company */}
                <div className="text-stone-500 font-medium text-lg flex items-center gap-2 flex-wrap">
                  <EditableField 
                    value={connection.role} 
                    onSave={(val) => handleUpdateField('role', val)} 
                    placeholder="Role" 
                    label="Role"
                  /> 
                  <span className="text-stone-400 font-normal">at</span> 
                  <EditableField 
                    value={connection.company} 
                    onSave={(val) => handleUpdateField('company', val)} 
                    placeholder="Company"
                    label="Company"
                  />
                </div>

                {/* Personal Contact Info (New Row) */}
                <div className="flex items-center gap-3 mt-2 text-sm text-stone-500 flex-wrap">
                    <div className="flex items-center gap-1.5 hover:text-stone-700 transition-colors">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <EditableField 
                          value={connection.emailWork || ''} 
                          onSave={(val) => handleUpdateField('emailWork', val)} 
                          placeholder="Work Email"
                          label="Work Email"
                        />
                    </div>
                    <span className="text-stone-300">•</span>
                    <div className="flex items-center gap-1.5 hover:text-stone-700 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <EditableField 
                          value={connection.phonePersonal || ''} 
                          onSave={(val) => handleUpdateField('phonePersonal', val)} 
                          placeholder="Personal Phone"
                          label="Personal Phone"
                        />
                    </div>
                    {connection.linkedinUrl && (
                        <>
                            <span className="text-stone-300">•</span>
                            <a 
                                href={connection.linkedinUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-stone-400 hover:text-[#0077b5] transition-colors flex items-center gap-1"
                                title="Open LinkedIn"
                            >
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </>
                    )}
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {isNew ? (
                 <Button onClick={handleSaveNewConnection} size="sm" icon={<Save className="w-4 h-4"/>}>Done</Button>
            ) : (
                <button onClick={onClose} className="text-stone-400 hover:text-stone-800 transition-colors p-2 hover:bg-stone-100 rounded-full">
                    <X className="w-6 h-6" />
                </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 px-6 bg-white shrink-0 overflow-x-auto">
          {(['overview', 'context', 'timeline', 'contact'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-amber-700 text-amber-900' 
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/30">
          
          {/* OVERVIEW TAB - Redesigned V6 */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[400px]">
              
              {/* Left Column: Logistics - Full Height */}
              <div className="md:col-span-1 h-full">
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm h-full flex flex-col">
                  <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2 mb-6">
                    <MapPin className="w-4 h-4" /> Logistics
                  </h3>
                  
                  <div className="flex-1 space-y-6">
                    {/* Planned Follow-up */}
                    <div className="flex items-start gap-3">
                        <div className="bg-amber-50 p-2 rounded-lg text-amber-600"><Calendar className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <p className="text-xs text-stone-400 mb-1 font-medium">Planned Follow-up</p>
                          
                          <input 
                            type="datetime-local" 
                            ref={dateInputRef}
                            value={plannedDate}
                            onChange={handleUpdatePlannedDate}
                            className="sr-only"
                          />

                          {!plannedDate ? (
                            <button 
                              onClick={() => dateInputRef.current?.showPicker()}
                              className="text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-3 py-1.5 rounded-md -ml-3 transition-colors flex items-center gap-2 mt-1"
                            >
                              Schedule
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2 mt-1">
                              <button 
                                onClick={() => dateInputRef.current?.showPicker()}
                                className="text-sm font-bold text-stone-800 hover:text-amber-700 transition-colors text-left flex items-center gap-2 group"
                              >
                                 {new Date(plannedDate).toLocaleString(undefined, {
                                   month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                                 })}
                              </button>
                              
                              <div className="flex items-center gap-2">
                                 <select 
                                   value={plannedType}
                                   onChange={handleUpdatePlannedType}
                                   className="text-xs bg-stone-50 border border-stone-200 rounded-md px-2 py-1 text-stone-600 focus:ring-1 focus:ring-amber-500 outline-none w-full"
                                 >
                                   {Object.values(ContactType).map(t => <option key={t} value={t}>{t}</option>)}
                                 </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-px bg-stone-100"></div>

                      {/* Last Contacted */}
                      <div className="flex items-start gap-3">
                          <div className="bg-stone-50 p-2 rounded-lg text-stone-500"><Clock className="w-4 h-4" /></div>
                          <div>
                               <p className="text-xs text-stone-400 font-medium">Last Contacted</p>
                               {connection.lastContactDate ? (
                                  <div className="flex items-center gap-2 mt-1">
                                      <span className="text-stone-800 text-sm font-medium">
                                          {new Date(connection.lastContactDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      {connection.lastContactType && (
                                          <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                                              {connection.lastContactType}
                                          </span>
                                      )}
                                  </div>
                               ) : (
                                   <p className="text-stone-500 text-sm italic mt-1">No history</p>
                               )}
                          </div>
                      </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Health + Summary - Stacked */}
              <div className="md:col-span-2 flex flex-col gap-6 h-full">
                
                {/* Health Bar - Compact */}
                <div className="bg-white px-5 py-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4 shrink-0">
                   <div className="flex-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">Connection Health</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${health.bg} ${health.text}`}>{health.label}</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${health.color}`} style={{ width: `${health.score}%` }}></div>
                      </div>
                   </div>
                </div>

                {/* Master Overview Summary - Fills Remaining Space */}
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col flex-1">
                  <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-amber-600" /> Connection Summary
                  </h3>
                  <div className="flex-1 text-stone-700 text-sm bg-amber-50/30 p-4 rounded-lg border border-amber-100/50">
                    {connection.overviewSummary ? (
                       <div className="prose prose-sm prose-stone max-w-none leading-relaxed whitespace-pre-line">
                         {connection.overviewSummary}
                       </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-stone-400 italic">
                        <p>No overview generated yet.</p>
                        <p className="text-xs mt-1">Add context or interactions to generate insights.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* CONTEXT TAB */}
          {activeTab === 'context' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[400px]">
              <div className="flex flex-col h-full space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-stone-700">Context</label>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => simulateVoiceInput(setContextInput, setIsListeningContext, 'context')}
                    className={isListeningContext ? "text-red-600 bg-red-50 border-red-100 animate-pulse" : ""}
                    icon={<Mic className="w-3 h-3" />}
                  >
                    {isListeningContext ? "Listening..." : "Dictate"}
                  </Button>
                </div>
                <div className="relative flex-1">
                  <textarea
                    className="w-full h-full min-h-[200px] p-4 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none text-stone-700 leading-relaxed shadow-sm text-sm"
                    placeholder="Enter long-term knowledge here (Family, Interests, Quirks, History)..."
                    value={contextInput}
                    onChange={(e) => setContextInput(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleGenerateContextSummary} 
                  disabled={isGeneratingContext || !contextInput}
                  icon={isGeneratingContext ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"/> : <Sparkles className="w-4 h-4" />}
                  className="w-full bg-stone-800 hover:bg-stone-900"
                >
                  {isGeneratingContext ? 'Synthesizing...' : 'Save Context'}
                </Button>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm overflow-y-auto h-full">
                 <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-amber-500" /> AI Context Summary
                 </h3>
                 <p className="text-xs text-stone-400 mb-4">Summarizes only your context input.</p>
                 {contextSummary ? (
                   <div className="prose prose-stone prose-sm max-w-none text-stone-800 whitespace-pre-line leading-7">
                      {contextSummary}
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center p-8">
                     <Sparkles className="w-10 h-10 mb-3 opacity-20" />
                     <p className="text-sm">Enter context thoughts to generate a summary.</p>
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div className="space-y-8">
              
              {/* UPCOMING SECTION */}
              {isPlannedDateInFuture() && (
                <div className="bg-stone-50 border border-stone-200 border-dashed rounded-xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                     <Clock className="w-4 h-4 text-amber-600" />
                     <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">Upcoming</h3>
                  </div>
                  <div className="bg-white rounded-lg border border-stone-100 p-4 shadow-sm flex items-center justify-between">
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-stone-900">
                            {new Date(connection.plannedContactDate!).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-stone-400 text-sm">
                            at {new Date(connection.plannedContactDate!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                       </div>
                       <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                         {connection.plannedContactType || 'Planned Interaction'}
                       </div>
                     </div>
                     <ArrowRight className="w-4 h-4 text-stone-300" />
                  </div>
                </div>
              )}

              {/* Log New Interaction */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-stone-800">Log New Interaction</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => simulateVoiceInput(setNewInteractionNote, setIsListeningInteraction, 'log')}
                    className={isListeningInteraction ? "text-red-600 bg-red-50 animate-pulse" : "text-stone-500"}
                    icon={<Mic className="w-3 h-3" />}
                  >
                    {isListeningInteraction ? "Listening..." : "Dictate Note"}
                  </Button>
                </div>
                
                <div className="flex flex-col gap-4 mb-4">
                  <div className="flex gap-4">
                    <input 
                      type="date" 
                      value={newInteractionDate}
                      onChange={(e) => setNewInteractionDate(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                    <select 
                      value={newInteractionType}
                      onChange={(e) => setNewInteractionType(e.target.value as ContactType)}
                      className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                    >
                      {Object.values(ContactType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <textarea 
                    placeholder="Dictate or type full interaction notes here..."
                    value={newInteractionNote}
                    onChange={(e) => setNewInteractionNote(e.target.value)}
                    className="w-full h-32 px-3 py-3 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none resize-none leading-relaxed"
                  />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleLogInteraction} disabled={!newInteractionNote || isSavingInteraction}>
                    {isSavingInteraction ? 'AI Processing & Updating Overview...' : 'Save & Update Overview'}
                  </Button>
                </div>
              </div>

              {/* History */}
              <div className="relative pl-6 border-l-2 border-stone-200 space-y-8 pb-4">
                {connection.interactions.length === 0 && (
                   <p className="text-stone-400 text-sm italic pl-2">No interaction history yet.</p>
                )}
                {connection.interactions.map((interaction) => (
                  <div key={interaction.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-stone-300 group-hover:border-amber-500 transition-colors"></div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                      <div className="flex items-center gap-2">
                         <span className="font-semibold text-stone-800 text-sm">{new Date(interaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                         <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full uppercase tracking-wide">{interaction.type}</span>
                      </div>
                    </div>
                    
                    {/* Auto-Summary Card */}
                    {interaction.summary && (
                      <div className="mb-3 text-stone-800 text-sm font-medium bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                        <span className="text-[10px] uppercase font-bold text-amber-800/60 block mb-1">Recap</span>
                        <div className="whitespace-normal leading-relaxed">
                            {interaction.summary}
                        </div>
                      </div>
                    )}
                    
                    {/* Notes (Secondary) */}
                    <div className="text-stone-500 text-xs leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">
                      <span className="font-semibold text-stone-400 uppercase text-[10px] tracking-wider block mb-1">Notes</span>
                      {interaction.notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-semibold text-stone-800 mb-4 border-b border-stone-100 pb-2">Contact Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1">Work Email</label>
                              <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                  <input 
                                      type="email"
                                      value={emailWork}
                                      onChange={(e) => setEmailWork(e.target.value)}
                                      onBlur={handleBlurContactField}
                                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                      placeholder="work@example.com"
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1">Personal Email</label>
                              <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                  <input 
                                      type="email"
                                      value={emailPersonal}
                                      onChange={(e) => setEmailPersonal(e.target.value)}
                                      onBlur={handleBlurContactField}
                                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                      placeholder="personal@gmail.com"
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1">Work Phone</label>
                              <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                  <input 
                                      type="text"
                                      value={phoneWork}
                                      onChange={(e) => setPhoneWork(e.target.value)}
                                      onBlur={handleBlurContactField}
                                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                      placeholder="+1 (555) ..."
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1">Mobile Phone</label>
                              <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                  <input 
                                      type="text"
                                      value={phonePersonal}
                                      onChange={(e) => setPhonePersonal(e.target.value)}
                                      onBlur={handleBlurContactField}
                                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                      placeholder="+1 (555) ..."
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="md:col-span-2 space-y-4">
                          <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1">Physical Address</label>
                              <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                  <input 
                                      type="text"
                                      value={address}
                                      onChange={(e) => setAddress(e.target.value)}
                                      onBlur={handleBlurContactField}
                                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                      placeholder="123 Main St..."
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1">LinkedIn Profile URL</label>
                              <div className="relative">
                                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                  <input 
                                      type="text"
                                      value={linkedinUrl}
                                      onChange={(e) => setLinkedinUrl(e.target.value)}
                                      onBlur={handleBlurContactField}
                                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                      placeholder="https://linkedin.com/in/..."
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};
