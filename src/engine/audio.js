export const stopAudio = audio => { try { audio?.pause(); audio.currentTime=0; } catch {} };
export const createAudio = (src, volume=1) => { const a=new Audio(src); a.preload='auto'; a.volume=Math.min(1,Math.max(0,volume)); return a; };
