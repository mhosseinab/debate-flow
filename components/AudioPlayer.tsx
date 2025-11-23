
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, Volume2, Loader2 } from 'lucide-react';
import { AudioProgress } from '../types';

interface AudioPlayerProps {
    blobUrl: string | null;
    isLoading: boolean;
    progress: AudioProgress | null;
    onGenerate: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ blobUrl, isLoading, progress, onGenerate }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [rate, setRate] = useState(1.0);

    useEffect(() => {
        const aud = audioRef.current;
        if (!aud) return;
        const update = () => setTime(aud.currentTime);
        const meta = () => setDuration(aud.duration);
        const end = () => setIsPlaying(false);
        aud.addEventListener('timeupdate', update);
        aud.addEventListener('loadedmetadata', meta);
        aud.addEventListener('ended', end);
        return () => {
            aud.removeEventListener('timeupdate', update);
            aud.removeEventListener('loadedmetadata', meta);
            aud.removeEventListener('ended', end);
        };
    }, [blobUrl]);

    useEffect(() => { if(audioRef.current) audioRef.current.playbackRate = rate; }, [rate]);

    const togglePlay = () => {
        if(audioRef.current) isPlaying ? audioRef.current.pause() : audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const seek = (e: React.MouseEvent) => {
        if(!audioRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = pos * duration;
    };

    const format = (s: number) => {
        const m = Math.floor(s/60);
        const sec = Math.floor(s%60);
        return `${m}:${sec.toString().padStart(2,'0')}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-end min-w-[240px]">
                <div className="flex justify-between items-center w-full mb-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-white">
                        <Loader2 className="w-3 h-3 animate-spin text-[#D0F224]"/> 
                        <span>Synthesizing</span>
                    </div>
                    {progress && (
                        <span className="text-[10px] font-mono text-zinc-400">
                            CHUNK {progress.current} / {progress.total}
                        </span>
                    )}
                </div>
                <div className="flex gap-1 w-full h-1.5">
                    {Array.from({length: progress?.total || 5}).map((_, i) => {
                        const currentIdx = (progress?.current || 1) - 1;
                        const isComplete = i < currentIdx;
                        const isCurrent = i === currentIdx;
                        
                        return (
                            <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${
                                isComplete ? 'bg-[#D0F224]' : 
                                isCurrent ? 'bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 
                                'bg-[#222]'
                            }`}/>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (!blobUrl) {
        return (
            <button onClick={onGenerate} className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-[#333] hover:border-[#D0F224] text-[#D0F224] rounded text-[10px] font-bold uppercase transition-all">
                <Volume2 className="w-3.5 h-3.5"/> Synthesize Audio
            </button>
        );
    }

    return (
        <div className="flex items-center bg-[#111] rounded-full p-1 pr-4 border border-[#333] gap-3">
            <audio ref={audioRef} src={blobUrl} />
            <button onClick={togglePlay} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-[#D0F224] text-black' : 'bg-[#222] text-white'}`}>
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current"/> : <Play className="w-3.5 h-3.5 fill-current ml-0.5"/>}
            </button>
            
            <div className="flex flex-col w-[140px]">
                <div className="flex justify-between text-[9px] font-mono text-[#666] mb-1">
                    <span>{format(time)}</span><span>{format(duration)}</span>
                </div>
                <div className="h-1 bg-[#222] rounded-full cursor-pointer relative" onClick={seek}>
                    <div className="absolute h-full bg-[#D0F224] rounded-full" style={{width: `${(time/duration)*100}%`}}/>
                </div>
            </div>

            <button onClick={() => setRate(r => r === 2 ? 1 : r + 0.5)} className="text-[9px] font-mono text-[#666] w-6 hover:text-white">{rate}x</button>
            <div className="h-4 w-px bg-[#333]"/>
            <a href={blobUrl} download="podcast.wav" className="text-[#666] hover:text-white"><Download className="w-3.5 h-3.5"/></a>
        </div>
    );
};

export default AudioPlayer;
