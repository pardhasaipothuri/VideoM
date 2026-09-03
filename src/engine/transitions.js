export const transitionLabel = t => ({cut:'Cut',fade:'Fade',fadeblack:'Fade to black',crossfade:'Crossfade'}[t]||'Cut');
export const transitionDurationFor = scene => Math.min(scene.transitionDuration||0.5, Math.max(0,scene.duration/2));
