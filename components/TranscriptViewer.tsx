import React, { useRef, useEffect, useState } from 'react';
import { Copy, Check, FileText, Eye, Mic2 } from 'lucide-react';
import { PodcastConfig, AudioProgress, Logger } from '../types';
import { generatePodcastAudio } from '../services/gemini';
import { bufferToWavBlob } from '../lib/audioUtils';
import { parseLineForDisplay } from '../lib/utils';
import AudioPlayer from './AudioPlayer';

interface Props {
  content: string;
  isGenerating: boolean;
  config: PodcastConfig;
  onLog: Logger;
}

const TranscriptViewer: React.FC<Props> = ({ content, isGenerating, config, onLog }) => {
  const [copied, setCopied] = useState(false);
  const [readerMode, setReaderMode] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [progress, setProgress] = useState<AudioProgress | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isGenerating) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [content, isGenerating]);

  useEffect(() => { if (isGenerating) setBlobUrl(null); }, [isGenerating]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
      a.download = 'transcript.txt';
      a.click();
  };

  const generateAudio = async () => {
      // RESET STATE IMMEDIATELY
      setLoadingAudio(true);
      setBlobUrl(null);
      setProgress(null);
      
      try {
          const buffer = await generatePodcastAudio(content, config, (c, t) => setProgress({ current: c, total: t }), onLog);
          const blob = bufferToWavBlob(buffer);
          setBlobUrl(URL.createObjectURL(blob));
      } catch (e: any) { 
          console.error(e); 
          alert(`Audio generation failed: ${e.message}`);
          setProgress(null);
      } finally { 
          setLoadingAudio(false); 
      }
  };

  const lines = content.split('\n').filter(l => l.trim());

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="h-16 border-b border-[#222] bg-[#0a0a0a]/90 backdrop-blur flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-[#D0F224] animate-pulse' : 'bg-zinc-700'}`}/>
          <span className="text-xs font-bold text-white uppercase tracking-widest">Studio Output</span>
        </div>
        
        <div className="flex items-center gap-4">
            {!isGenerating && content && (
                <AudioPlayer 
                    blobUrl={blobUrl} 
                    isLoading={loadingAudio} 
                    progress={progress} 
                    onGenerate={generateAudio} 
                />
            )}
            <div className="h-6 w-px bg-[#222]"/>
            <div className="flex gap-1">
                <button onClick={() => setReaderMode(!readerMode)} className={`p-2 rounded ${readerMode ? 'text-[#D0F224]' : 'text-[#666]'}`}><Eye className="w-4 h-4"/></button>
                <button onClick={handleDownloadTxt} className="p-2 rounded text-[#666] hover:text-white"><FileText className="w-4 h-4"/></button>
                <button onClick={handleCopy} className="p-2 rounded text-[#666] hover:text-white">{copied ? <Check className="w-4 h-4 text-[#D0F224]"/> : <Copy className="w-4 h-4"/>}</button>
            </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 sm:p-12 pb-32 scrollbar-thin scrollbar-thumb-[#222]">
        {!lines.length ? (
           <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
             <div className="w-16 h-16 rounded-full bg-[#111] border border-[#222] flex items-center justify-center"><Mic2 className="w-6 h-6 text-[#333]"/></div>
             <p className="text-sm font-bold uppercase tracking-widest text-[#444]">Ready to Produce</p>
           </div>
        ) : (
           <div className="max-w-3xl mx-auto space-y-6">
             {lines.map((line, i) => {
                 const p = parseLineForDisplay(line, i, config);
                 if (readerMode && (p.type === 'action' || p.type === 'separator')) return null;
                 
                 if (p.type === 'separator') return <div key={p.id} className="h-px bg-[#222] w-full my-8"/>;
                 if (p.type === 'action') return <div key={p.id} className="text-[10px] text-center font-bold text-[#444] uppercase tracking-widest my-4 bg-[#111] py-1 rounded-full border border-[#222] inline-block mx-auto px-4">{p.content}</div>;
                 if (p.type === 'note') return <div key={p.id} className="border-l-2 border-[#D0F224] pl-4 text-xs font-mono text-zinc-500">{p.content}</div>;
                 
                 if (p.type === 'dialogue') return (
                     <div key={p.id} className="mb-6">
                         <div className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${p.isHost ? 'text-[#D0F224]' : 'text-zinc-500'}`}>{p.speaker}</div>
                         <p className="text-lg font-medium text-zinc-100 leading-relaxed">{p.content}</p>
                     </div>
                 );
                 return <div key={p.id} className="text-zinc-100">{p.content}</div>;
             })}
             {isGenerating && <div className="flex justify-center pt-8"><div className="w-2 h-2 bg-[#D0F224] rounded-full animate-bounce"/></div>}
           </div>
        )}
      </div>
    </div>
  );
};
export default TranscriptViewer;