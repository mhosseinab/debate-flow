
import React, { useState } from 'react';
import { Mic, Clock, Sliders, Users, Activity, Sparkles, MessageSquarePlus } from 'lucide-react';
import { PodcastConfig, Gender, Logger } from '../types';
import { generatePodcastName } from '../services/gemini';
import { DURATIONS, OPTIONS, VOICE_PROFILES } from '../constants';
import { Section, Select, Toggle, Input, Button } from './ui';

interface Props {
  config: PodcastConfig;
  onChange: (c: PodcastConfig) => void;
  disabled: boolean;
  inputScript: string;
  onLog: Logger;
}

const ConfigurationPanel: React.FC<Props> = ({ config, onChange, disabled, inputScript, onLog }) => {
  const [loadingName, setLoadingName] = useState(false);
  const update = (k: keyof PodcastConfig, v: any) => onChange({ ...config, [k]: v });

  const handleGender = (speaker: 1 | 2, gender: Gender) => {
      const defVoice = VOICE_PROFILES.find(v => v.gender === gender)?.name || (gender === 'Male' ? 'Puck' : 'Kore');
      update(speaker === 1 ? 'speaker1Gender' : 'speaker2Gender', gender);
      update(speaker === 1 ? 'speaker1Voice' : 'speaker2Voice', defVoice);
  };

  const genName = async () => {
      setLoadingName(true);
      try { update('podcastName', await generatePodcastName(inputScript, config, onLog)); } 
      finally { setLoadingName(false); }
  };

  return (
    <div className="flex flex-col bg-[#0a0a0a]">
        <Section label="Identity" icon={Mic}>
            <div className="flex gap-2">
                <Input value={config.podcastName} onChange={(e) => update('podcastName', e.target.value)} disabled={disabled} />
                <Button onClick={genName} disabled={disabled || inputScript.length < 10} variant="secondary" className="px-3">
                    {loadingName ? <div className="animate-spin w-3 h-3 border-2 border-[#D0F224] border-t-transparent rounded-full"/> : <Sparkles className="w-3.5 h-3.5"/>}
                </Button>
            </div>
        </Section>

        <Section label="Format" icon={Clock}>
            <div className="grid grid-cols-5 gap-1 mb-3">
                {DURATIONS.map(m => (
                    <button key={m} onClick={() => update('duration', m)} disabled={disabled}
                        className={`py-1.5 rounded text-[10px] font-bold border ${config.duration === m ? 'bg-[#D0F224] text-black border-[#D0F224]' : 'bg-[#111] text-[#666] border-[#333]'}`}>
                        {m}m
                    </button>
                ))}
            </div>
            <Select label="Tone" value={config.tone} options={OPTIONS.tones} onChange={(v) => update('tone', v)} disabled={disabled} />
            <Select label="Structure" value={config.format} options={OPTIONS.formats} onChange={(v) => update('format', v)} disabled={disabled} />
        </Section>

        <Section label="Speakers" icon={Users}>
            {[1, 2].map(num => {
                const sKey = num === 1 ? 'speaker1' : 'speaker2';
                const name = config[`${sKey}Name` as keyof PodcastConfig] as string;
                const gender = config[`${sKey}Gender` as keyof PodcastConfig] as Gender;
                const voice = config[`${sKey}Voice` as keyof PodcastConfig] as string;
                
                return (
                    <div key={num} className={`space-y-2 ${num === 2 ? 'mt-3 pt-3 border-t border-[#222]' : ''}`}>
                        <span className="text-[9px] text-[#555] font-bold uppercase">{num === 1 ? 'Host' : 'Guest'}</span>
                        <Input value={name} onChange={(e) => update(`${sKey}Name` as any, e.target.value)} disabled={disabled} />
                        <div className="flex gap-2">
                            <select value={gender} onChange={(e) => handleGender(num as 1|2, e.target.value as Gender)} disabled={disabled} className="bg-[#050505] border border-[#333] text-white text-xs rounded p-2 w-1/3 outline-none focus:border-[#D0F224]">
                                <option>Male</option><option>Female</option>
                            </select>
                            <select value={voice} onChange={(e) => update(`${sKey}Voice` as any, e.target.value)} disabled={disabled} className="bg-[#050505] border border-[#333] text-white text-xs rounded p-2 flex-1 outline-none focus:border-[#D0F224]">
                                {VOICE_PROFILES.filter(v => v.gender === gender).map(v => <option key={v.name} value={v.name}>{v.name} ({v.description})</option>)}
                            </select>
                        </div>
                    </div>
                );
            })}
        </Section>

        <Section label="Production" icon={Activity}>
             <div className="grid grid-cols-2 gap-2">
                 <Select label="Language" value={config.language} options={OPTIONS.languages} onChange={(v) => update('language', v)} disabled={disabled} />
                 <Select label="Pacing" value={config.pacing} options={OPTIONS.pacing} onChange={(v) => update('pacing', v)} disabled={disabled} />
                 <Select label="Balance" value={config.speakerBalance} options={OPTIONS.balances} onChange={(v) => update('speakerBalance', v)} disabled={disabled} />
                 <Select label="Intro" value={config.introStyle} options={OPTIONS.introStyles} onChange={(v) => update('introStyle', v)} disabled={disabled} />
             </div>
        </Section>

        <Section label="Advanced" icon={Sliders}>
             <Select value={config.soundDesign} options={OPTIONS.soundDesigns} onChange={(v) => update('soundDesign', v)} disabled={disabled} />
             <Select value={config.musicGenre} options={OPTIONS.musicGenres} onChange={(v) => update('musicGenre', v)} disabled={disabled} />
             <Select value={config.vocabularyLevel} options={OPTIONS.vocabLevels} onChange={(v) => update('vocabularyLevel', v)} disabled={disabled} />
             <Select value={config.conclusionStyle} options={OPTIONS.conclusions} onChange={(v) => update('conclusionStyle', v)} disabled={disabled} />
        </Section>

        <div className="p-4 space-y-2 pb-2">
             <Toggle label="Show Notes" checked={config.generateShowNotes} onChange={(v) => update('generateShowNotes', v)} disabled={disabled} />
             <Toggle label="Viral Clip" checked={config.generateViralClip} onChange={(v) => update('generateViralClip', v)} disabled={disabled} />
             <Toggle label="Critical Analysis" checked={config.criticalAnalysis} onChange={(v) => update('criticalAnalysis', v)} disabled={disabled} />
        </div>

        <Section label="Custom Directions" icon={MessageSquarePlus}>
            <textarea
                value={config.customPrompt}
                onChange={(e) => update('customPrompt', e.target.value)}
                disabled={disabled}
                placeholder="e.g., Make the host very skeptical about AI..."
                className="w-full bg-[#050505] border border-[#333] text-gray-200 text-xs rounded p-2 outline-none focus:border-[#D0F224] min-h-[80px] resize-y placeholder:text-zinc-700"
            />
        </Section>
        <div className="h-4"></div>
    </div>
  );
};
export default ConfigurationPanel;
