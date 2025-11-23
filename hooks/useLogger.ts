
import { useState } from 'react';
import { DebugLog, Logger } from '../types';

export const useLogger = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);

  const log: Logger = (action, type, prompt, content, id) => {
    if (action === 'REQUEST') {
        const newId = Math.random().toString(36).substr(2, 9);
        setLogs(prev => [...prev, {
            id: newId,
            timestamp: new Date().toLocaleTimeString(),
            type,
            prompt,
            status: 'PENDING'
        }]);
        return newId;
    }
    
    if (action === 'RESPONSE' || action === 'ERROR') {
        setLogs(prev => prev.map(l => l.id === id ? {
            ...l,
            response: content,
            status: action === 'ERROR' ? 'ERROR' : 'SUCCESS'
        } : l));
        return undefined;
    }
    return undefined;
  };

  return { logs, log };
};
