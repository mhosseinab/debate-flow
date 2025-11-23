
import React, { useState } from 'react';
import { Bug, X, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { DebugLog } from '../../types';

export const DebugModal = ({ logs, onClose }: { logs: DebugLog[], onClose: () => void }) => {
    const [openId, setOpenId] = useState<string | null>(null);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl h-[80vh] bg-[#0a0a0a] border border-[#222] rounded-xl flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-[#222]">
                    <div className="flex items-center gap-2">
                        <Bug className="w-4 h-4 text-[#D0F224]" />
                        <span className="font-bold text-sm uppercase tracking-wider">Prompt Debugger</span>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {logs.length === 0 && <div className="text-center text-zinc-600 font-mono text-xs py-10">No logs captured yet.</div>}
                    {[...logs].reverse().map(log => (
                        <div key={log.id} className={`border rounded overflow-hidden ${log.status === 'ERROR' ? 'border-red-900/50 bg-red-900/10' : 'border-[#222] bg-[#111]'}`}>
                            <div 
                                onClick={() => setOpenId(openId === log.id ? null : log.id)}
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#151515]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        {log.status === 'PENDING' && <Loader2 className="w-3 h-3 text-[#D0F224] animate-spin"/>}
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.type === 'AUDIO' ? 'bg-purple-900/30 text-purple-400' : log.type === 'NAME' ? 'bg-blue-900/30 text-blue-400' : 'bg-[#D0F224]/20 text-[#D0F224]'}`}>{log.type}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-500">{log.timestamp}</span>
                                    <span className="text-xs font-mono text-zinc-300 truncate w-64">{log.prompt.substring(0, 50)}...</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {log.status === 'ERROR' && <span className="text-[10px] font-bold text-red-500">ERROR</span>}
                                    {openId === log.id ? <ChevronDown className="w-4 h-4 text-zinc-500"/> : <ChevronRight className="w-4 h-4 text-zinc-500"/>}
                                </div>
                            </div>
                            {openId === log.id && (
                                <div className="p-4 border-t border-[#222] bg-[#050505] grid grid-cols-2 gap-4">
                                    <div className="overflow-hidden">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Prompt Sent</div>
                                        <pre className="text-[10px] font-mono text-zinc-300 whitespace-pre-wrap bg-[#0a0a0a] p-3 rounded border border-[#222] h-64 overflow-y-auto custom-scrollbar">{log.prompt}</pre>
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Response Received</div>
                                        <div className="bg-[#0a0a0a] p-3 rounded border border-[#222] h-64 overflow-y-auto custom-scrollbar">
                                            {log.status === 'PENDING' ? (
                                                <div className="flex items-center gap-2 text-[#D0F224] text-xs font-mono animate-pulse">
                                                    <Loader2 className="w-3 h-3 animate-spin"/> Waiting for API response...
                                                </div>
                                            ) : (
                                                <pre className={`text-[10px] font-mono whitespace-pre-wrap ${log.status === 'ERROR' ? 'text-red-400' : 'text-[#D0F224]'}`}>{log.response}</pre>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
