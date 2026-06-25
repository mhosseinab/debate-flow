
import React from 'react';
import { Wand2, AlignLeft } from 'lucide-react';

interface ScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  isGenerating: boolean;
}

const ScriptInput: React.FC<ScriptInputProps> = ({ value, onChange, isGenerating }) => {
  const wordCount = value.trim().split(/\s+/).filter(w => w.length > 0).length;

  const handleMagicFill = () => {
    const topics = [
      "The ethics of AI in creative arts.",
      "Remote work vs. Return to Office debate.",
      "Is space exploration worth the cost?",
      "Social media: Tool for democracy or polarization?",
      "Universal Basic Income pros and cons."
    ];
    onChange(topics[Math.floor(Math.random() * topics.length)]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
        <div className="flex items-center space-x-2 text-[#666]">
           <AlignLeft className="w-3.5 h-3.5" />
           <span className="text-[10px] font-bold uppercase tracking-wider">Source Text</span>
        </div>
        <div className="flex items-center space-x-3">
             <button 
                onClick={handleMagicFill} disabled={isGenerating}
                className="flex items-center space-x-1.5 px-2 py-1 rounded bg-[#151515] hover:bg-[#222] text-[#888] hover:text-[#D0F224] transition-colors border border-[#222]"
             >
                 <Wand2 className="w-3 h-3" />
                 <span className="text-[10px] font-bold">Magic Fill</span>
             </button>
            <span className="text-[10px] font-mono text-[#444]">{wordCount} words</span>
        </div>
      </div>
      <textarea
        className="flex-1 w-full p-5 bg-[#0a0a0a] text-zinc-300 placeholder-[#333] resize-none focus:outline-none font-mono text-xs leading-relaxed"
        placeholder="Paste articles, essays, or notes here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isGenerating}
        spellCheck={false}
      />
    </div>
  );
};
export default ScriptInput;
