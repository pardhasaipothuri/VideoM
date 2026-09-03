export const makeObjectUrl = (file) => file ? URL.createObjectURL(file) : '';
export const revokeObjectUrl = (url) => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); };
export const formatTime = (seconds) => { const s=Math.max(0,Math.round(seconds)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
export const fileExt = (name='') => name.split('.').pop()?.toLowerCase() || '';
export const isAudio = (file) => !!file && (file.type.startsWith('audio/') || ['mp3','wav','m4a','ogg','aac','flac'].includes(fileExt(file.name)));
export const isImage = (file) => !!file && (file.type.startsWith('image/') || ['png','jpg','jpeg','webp','gif'].includes(fileExt(file.name)));
export const getAudioDuration = (file) => new Promise((resolve,reject)=>{ if(!file){resolve(0);return;} const a=document.createElement('audio'); const u=URL.createObjectURL(file); a.preload='metadata'; a.onloadedmetadata=()=>{URL.revokeObjectURL(u);resolve(Number.isFinite(a.duration)?a.duration:0)}; a.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('Unable to read audio duration'))}; a.src=u; });
export const loadImage = (src) => new Promise((resolve,reject)=>{const img=new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=src;});
export const dataUrlFromCanvas = (canvas) => new Promise(r=>canvas.toBlob(b=>r(b),'image/png'));
