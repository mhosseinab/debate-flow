
import React, { useState } from 'react';
import { Key } from 'lucide-react';

export interface ApiCredentials {
    apiKey: string;
    langsmithKey?: string;
    langsmithProject?: string;
}

export const ApiModal = ({ onSave }: { onSave: (creds: ApiCredentials) => void }) => {
    const [val, setVal] = useState("");
    const [showTracing, setShowTracing] = useState(false);
    const [lsKey, setLsKey] = useState("");
    const [lsProject, setLsProject] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-[#0a0a0a] border border-[#222] rounded-xl p-6 text-center space-y-4">
                <div className="w-10 h-10 bg-[#111] rounded-full flex items-center justify-center mx-auto">
                    <Key className="w-4 h-4 text-[#D0F224]"/>
                </div>
                <h2 className="font-bold text-white">API Key Required</h2>
                <input
                    type="password"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    placeholder="Enter LLM Provider API Key"
                    className="w-full bg-black border border-[#333] rounded p-2 text-white text-sm focus:border-[#D0F224] outline-none"
                />

                <button
                    type="button"
                    onClick={() => setShowTracing(s => !s)}
                    className="text-[10px] text-[#666] hover:text-[#D0F224] uppercase tracking-wider"
                >
                    {showTracing ? '− ' : '+ '}Production tracing (LangSmith, optional)
                </button>

                {showTracing && (
                    <div className="space-y-2 text-left">
                        <input
                            type="password"
                            value={lsKey}
                            onChange={e => setLsKey(e.target.value)}
                            placeholder="LangSmith API Key"
                            className="w-full bg-black border border-[#333] rounded p-2 text-white text-sm focus:border-[#D0F224] outline-none"
                        />
                        <input
                            type="text"
                            value={lsProject}
                            onChange={e => setLsProject(e.target.value)}
                            placeholder="LangSmith Project (optional)"
                            className="w-full bg-black border border-[#333] rounded p-2 text-white text-sm focus:border-[#D0F224] outline-none"
                        />
                        <p className="text-[10px] text-[#555] leading-relaxed">
                            Traces post directly to your own LangSmith project. Add online evaluators
                            (Run Rules) there to score live traffic.
                        </p>
                    </div>
                )}

                <button
                    onClick={() => onSave({ apiKey: val, langsmithKey: lsKey || undefined, langsmithProject: lsProject || undefined })}
                    disabled={!val}
                    className="w-full py-2 bg-[#D0F224] text-black font-bold rounded uppercase text-xs hover:bg-[#c0e020] disabled:opacity-50"
                >
                    Start Studio
                </button>
            </div>
        </div>
    );
};
