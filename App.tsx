
import React, { useState } from 'react';
import { Radio, FileText, Settings2, Sparkles, Bug } from 'lucide-react';
import { DEFAULT_CONFIG } from './constants';
import { generateDebateStream } from './services/gemini';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLogger } from './hooks/useLogger';
import { PodcastConfig } from './types';
import ScriptInput from './components/ScriptInput';
import ConfigurationPanel from './components/ConfigurationPanel';
import TranscriptViewer from './components/TranscriptViewer';
import { ApiModal } from './components/modals/ApiModal';
import { DebugModal } from './components/modals/DebugModal';
import { Button } from './components/ui';

const App: React.FC = () => {
  const [script, setScript] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'source' | 'config'>('source');
  const [showKeyModal, setShowKeyModal] = useState(!process.env.API_KEY);
  const [showDebug, setShowDebug] = useState(false);
  
  const [config, setConfig] = useLocalStorage<PodcastConfig>('df_config', DEFAULT_CONFIG);
  const { logs, log } = useLogger();

  const generate = async () => {
      setLoading(true); setTranscript(""); setError(null);
      try {
          await generateDebateStream(script, config, (chunk) => setTranscript(p => p + chunk), log);
      } catch (e: any) { setError(e.message); } 
      finally { setLoading(false); }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white font-sans selection:bg-[#D0F224] selection:text-black overflow-hidden">
      {showKeyModal && <ApiModal onSave={(k) => { process.env.API_KEY = k; setShowKeyModal(false); }} />}
      {showDebug && <DebugModal logs={logs} onClose={() => setShowDebug(false)} />}

      <header className="h-12 border-b border-[#222] flex items-center justify-between px-4 bg-[#050505] shrink-0">
        <div className="flex items-center gap-2">
            <div className="p-1 bg-[#D0F224] rounded"><Radio className="w-3 h-3 text-black"/></div>
            <span className="font-bold text-sm tracking-tight">DebateFlow</span>
        </div>
        <div className="flex items-center gap-3">
             <Button variant="ghost" onClick={() => setShowDebug(true)} className="p-1.5" title="Debug Prompts">
                 <Bug className="w-4 h-4" />
             </Button>
             <div className={`w-1.5 h-1.5 rounded-full ${showKeyModal ? 'bg-red-500' : 'bg-[#D0F224]'}`}/>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-[360px] flex flex-col border-r border-[#222] bg-[#0a0a0a]">
            <div className="flex border-b border-[#222]">
                {[ {id:'source', icon:FileText, label:'Source'}, {id:'config', icon:Settings2, label:'Config'} ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${tab === t.id ? 'text-[#D0F224] bg-[#111]' : 'text-[#555] hover:text-white'}`}>
                        <t.icon className="w-3 h-3"/> {t.label}
                    </button>
                ))}
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#222]">
                {tab === 'source' ? <ScriptInput value={script} onChange={setScript} isGenerating={loading} /> : 
                <ConfigurationPanel config={config} onChange={setConfig} disabled={loading} inputScript={script} onLog={log} />}
            </div>

            <div className="p-4 border-t border-[#222] bg-[#050505]">
                {error && <div className="mb-2 text-[10px] text-red-400 bg-red-900/10 p-2 rounded border border-red-900/20">{error}</div>}
                <Button onClick={generate} disabled={loading || script.length < 10} className="w-full py-3">
                    {loading ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-black border-t-transparent"/> : <Sparkles className="w-3.5 h-3.5"/>}
                    {loading ? 'Producing...' : 'Generate Episode'}
                </Button>
            </div>
        </div>

        {/* Main View */}
        <div className="flex-1 relative min-w-0">
            <TranscriptViewer content={transcript} isGenerating={loading} config={config} onLog={log} />
        </div>
      </div>
    </div>
  );
};

export default App;
