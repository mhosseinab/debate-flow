
import { ParsedLine, PodcastConfig } from '../types';

interface DialogueSegment {
    speaker: string;
    text: string;
}

interface AtomicSentence {
    speaker: string;
    text: string;
}

// --- Text Cleaning & Parsing ---

export const cleanTranscript = (text: string): string => {
    return text
        .replace(/^### SHOW NOTES[\s\S]*?---/m, "")
        .replace(/^### VIRAL CLIP SCRIPT[\s\S]*/m, "") 
        .replace(/^[-*_]{3,}$/gm, "")
        .replace(/\[ACTION:.*?\]/gi, "") 
        .replace(/\[\*\*.*?\*\*\]/g, "") 
        .replace(/\[.*?music.*?\]/gi, "") 
        .replace(/\[.*?sfx.*?\]/gi, "")
        .replace(/\n{3,}/g, "\n\n") 
        .trim();
};

export const parseTranscriptToSegments = (text: string, defaultSpeaker: string): DialogueSegment[] => {
    const lines = text.split('\n');
    const segments: DialogueSegment[] = [];
    let currentSpeaker = defaultSpeaker.toUpperCase();
    let currentBuffer: string[] = [];

    const flush = () => {
        if (currentBuffer.length > 0) {
            segments.push({ speaker: currentSpeaker, text: currentBuffer.join(' ').trim() });
            currentBuffer = [];
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Strict Regex: Requires delimiters or specific ending to identify speaker
        const tagMatch = trimmed.match(/^(\*\*|\[)*([A-Za-z0-9\s\-_]+)(\*\*|\]|:)+\s*(.*)$/);
        
        if (tagMatch && tagMatch[2]) {
             const potentialName = tagMatch[2].trim().toUpperCase();
             const content = tagMatch[4] ? tagMatch[4].trim() : "";

             if (isValidSpeaker(potentialName)) {
                 flush();
                 currentSpeaker = potentialName;
                 if (content) currentBuffer.push(content);
                 continue;
             }
        }
        currentBuffer.push(trimmed);
    }
    flush();
    return segments;
};

const isValidSpeaker = (name: string) => {
    return !name.startsWith("ACTION") && 
           name !== "SCENE" && 
           !name.includes("MUSIC") &&
           !name.includes("SFX") &&
           name.length < 30;
};

// --- Display Parsing ---

export const parseLineForDisplay = (text: string, index: number, config: PodcastConfig): ParsedLine => {
  const trimmed = text.trim();
  const id = `line-${index}`;

  if (trimmed === '---' || trimmed === '***') return { id, type: 'separator', content: '' };
  
  if (trimmed.startsWith('### SHOW NOTES') || trimmed.startsWith('### VIRAL CLIP SCRIPT')) {
      return { id, type: 'note', content: trimmed.replace('###', '').trim() };
  }
  
  if (trimmed.startsWith('**Title:**') || trimmed.startsWith('**Summary:**')) {
      return { id, type: 'note', content: trimmed };
  }

  if (trimmed.startsWith('[ACTION:')) {
      return { id, type: 'action', content: trimmed.replace(/^\[ACTION:\s*/i, '').replace(/\]$/, '').trim() };
  }

  const speakerMatch = trimmed.match(/^(\*\*|\[)*([A-Za-z0-9\s\-_]+)(\*\*|\]|:)+\s*(.*)$/);
  
  if (speakerMatch && speakerMatch[2]) {
    const speakerName = speakerMatch[2].toUpperCase();
    if (isValidSpeaker(speakerName)) {
        return {
            id,
            type: 'dialogue',
            speaker: speakerName,
            content: speakerMatch[4] ? speakerMatch[4].trim() : "", 
            isHost: speakerName.includes(config.speaker1Name.toUpperCase()) || speakerName.includes('HOST')
        };
    }
  }

  // Fallback for clean lines that are just the name
  if (trimmed.length < 30) {
      const cleanLine = trimmed.replace(/[*\[\]:]/g, "").trim().toUpperCase();
      const s1 = config.speaker1Name.toUpperCase();
      const s2 = config.speaker2Name.toUpperCase();
      
      if (cleanLine === s1 || cleanLine === s2 || cleanLine === "HOST" || cleanLine === "GUEST") {
          return {
              id,
              type: 'dialogue',
              speaker: cleanLine,
              content: "",
              isHost: cleanLine === s1 || cleanLine === "HOST"
          };
      }
  }

  return { id, type: 'text', content: text };
};

// --- Chunking Logic ---

export const splitIntoSentences = (text: string): string[] => {
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
        const segmenter = new (Intl as any).Segmenter('en', { granularity: 'sentence' });
        const segments = segmenter.segment(text);
        return Array.from(segments).map((s: any) => s.segment.trim()).filter((s: string) => s.length > 0);
    }
    return text.match(/[^.?!]+[.?!]+(\s+|$)|[^.?!]+$/g)?.map(s => s.trim()) || [text];
};

const flattenToSentences = (segments: DialogueSegment[]): AtomicSentence[] => {
    const atoms: AtomicSentence[] = [];
    for (const seg of segments) {
        const sentences = splitIntoSentences(seg.text);
        for (const s of sentences) {
            atoms.push({ speaker: seg.speaker, text: s });
        }
    }
    return atoms;
};

export const buildSafeChunks = (segments: DialogueSegment[], maxLength: number): string[] => {
    const atoms = flattenToSentences(segments);
    const chunks: string[] = [];
    
    let currentChunk = "";
    let currentChunkLastSpeaker = "";

    for (const atom of atoms) {
        const isNewChunk = currentChunk.length === 0;
        const isSpeakerSwitch = atom.speaker !== currentChunkLastSpeaker;
        
        let prefix = isNewChunk ? `**[${atom.speaker}]** ` : 
                     isSpeakerSwitch ? `\n\n**[${atom.speaker}]** ` : " ";

        const payload = `${prefix}${atom.text}`;

        if (currentChunk.length + payload.length > maxLength && !isNewChunk) {
            chunks.push(currentChunk);
            currentChunk = `**[${atom.speaker}]** ${atom.text}`;
            currentChunkLastSpeaker = atom.speaker;
        } else {
            currentChunk += payload;
            currentChunkLastSpeaker = atom.speaker;
        }
    }

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
};
