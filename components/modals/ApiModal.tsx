
import React, { useState } from 'react';
import { Key } from 'lucide-react';

export const ApiModal = ({ onSave }: { onSave: (k: string) => void }) => {
    const [val, setVal] = useState("");
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
                    placeholder="Enter Gemini API Key" 
                    className="w-full bg-black border border-[#333] rounded p-2 text-white text-sm focus:border-[#D0F224] outline-none"
                />
                <button 
                    onClick={() => onSave(val)} 
                    disabled={!val} 
                    className="w-full py-2 bg-[#D0F224] text-black font-bold rounded uppercase text-xs hover:bg-[#c0e020] disabled:opacity-50"
                >
                    Start Studio
                </button>
            </div>
        </div>
    );
};
