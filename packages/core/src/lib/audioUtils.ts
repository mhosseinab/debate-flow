
export const generateSilence = (duration: number, ctx: AudioContext): AudioBuffer => {
    return ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
};

export const decodeBase64Audio = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    const tempBuffer = bytes.buffer.slice(0);
    const int16View = new Int16Array(tempBuffer);
    const buffer = ctx.createBuffer(1, int16View.length, 24000);
    const channel = buffer.getChannelData(0);
    for(let i=0; i<int16View.length; i++) {
        channel[i] = int16View[i] / 32768.0;
    }
    return buffer;
};

export const concatenateBuffers = (buffers: AudioBuffer[], ctx: AudioContext): AudioBuffer => {
    if (!buffers.length) return ctx.createBuffer(1, 1, 24000);
    const totalLen = buffers.reduce((a, b) => a + b.length, 0);
    const result = ctx.createBuffer(1, totalLen, 24000);
    let offset = 0;
    for (const buff of buffers) {
        result.copyToChannel(buff.getChannelData(0), 0, offset);
        offset += buff.length;
    }
    return result;
};

export const bufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length * numChannels * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    
    const writeString = (o: number, s: string) => { for(let i=0; i<s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
    
    writeString(0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); 
    view.setUint16(22, numChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * numChannels, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length - 44, true);

    const channels = [];
    for(let i=0; i<numChannels; i++) channels.push(buffer.getChannelData(i));
    
    let offset = 44;
    for(let i=0; i<buffer.length; i++) {
        for(let c=0; c<numChannels; c++) {
            let s = Math.max(-1, Math.min(1, channels[c][i]));
            s = s < 0 ? s * 0x8000 : s * 0x7FFF;
            view.setInt16(offset, s, true);
            offset += 2;
        }
    }
    return new Blob([bufferArr], { type: 'audio/wav' });
};
