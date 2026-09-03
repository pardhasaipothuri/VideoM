import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const CORE_VERSION = '0.12.10';
const BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const safeName=(s)=>String(s||'media').replace(/[^a-z0-9._-]/gi,'_').slice(0,80);

function subtitleBlob(text,width,height,style={}){
  if(!text?.trim()) return null;
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d'); const size=Number(style.fontSize)||32; ctx.font=`700 ${size}px Arial, sans-serif`;
  const max=width*.86, lineH=size*1.28, words=text.trim().split(/\s+/); const lines=[]; let line='';
  for(const word of words){const test=line?`${line} ${word}`:word;if(line&&ctx.measureText(test).width>max){lines.push(line);line=word}else line=test} if(line)lines.push(line);
  const blockH=lines.length*lineH+30; const cy=style.position==='top'?height*.13:style.position==='middle'?height*.5:height*.84;
  if(style.background){ctx.fillStyle='rgba(0,0,0,.60)';const bw=Math.min(width*.92,max+48);ctx.beginPath();ctx.roundRect((width-bw)/2,cy-blockH/2,bw,blockH,14);ctx.fill()}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.9)';ctx.lineWidth=Math.max(2,size*.09);
  lines.forEach((ln,i)=>{const y=cy+(i-(lines.length-1)/2)*lineH;ctx.strokeText(ln,width/2,y);ctx.fillText(ln,width/2,y)});
  return new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
}

export class BrowserRenderer{
  constructor(){this.ffmpeg=new FFmpeg();this.loaded=false;}
  async load(onLog=()=>{}){
    if(this.loaded)return;
    this.ffmpeg.on('log',({message})=>onLog(message));
    await this.ffmpeg.load({coreURL:await toBlobURL(`${BASE}/ffmpeg-core.js`,'text/javascript'),wasmURL:await toBlobURL(`${BASE}/ffmpeg-core.wasm`,'application/wasm')});
    this.loaded=true;
  }
  async render(project,onProgress=()=>{}){
    await this.load(msg=>onProgress({stage:'ffmpeg',message:msg}));
    const {settings,scenes,music}=project;
    if(!scenes.length)throw new Error('Add at least one scene before rendering.');
    const W=settings.aspect==='9:16'?settings.height:settings.width, H=settings.aspect==='9:16'?settings.width:settings.height, fps=settings.fps;
    const sceneFiles=[]; const voiceFiles=[];
    for(let i=0;i<scenes.length;i++){
      const s=scenes[i]; if(!s.image)throw new Error(`${s.name} has no image.`);
      onProgress({stage:'scenes',current:i+1,total:scenes.length,message:`Rendering scene ${i+1}/${scenes.length}...`});
      const img=`img_${i}_${safeName(s.imageName)}`; await this.ffmpeg.writeFile(img,await fetchFile(s.image));
      const frames=Math.max(1,Math.round(s.duration*fps));
      let zoom='1'; if(s.zoom==='in')zoom=`1+0.10*on/${Math.max(1,frames-1)}`; if(s.zoom==='out')zoom=`1.10-0.10*on/${Math.max(1,frames-1)}`;
      const px=Number(s.panX)||0, py=Number(s.panY)||0;
      const x=px<0?`(iw-iw/zoom)*${Math.min(1,Math.abs(px)/120)}`:px>0?`(iw-iw/zoom)*(1-${Math.min(1,px/120)})`:'(iw-iw/zoom)/2';
      const y=py<0?`(ih-ih/zoom)*${Math.min(1,Math.abs(py)/120)}`:py>0?`(ih-ih/zoom)*(1-${Math.min(1,py/120)})`:'(ih-ih/zoom)/2';
      const sw=Math.ceil(W*1.18), sh=Math.ceil(H*1.18);
      let video=`scale=${sw}:${sh}:force_original_aspect_ratio=increase,crop=${sw}:${sh},zoompan=z='${zoom}':x='${x}':y='${y}':d=1:fps=${fps}:s=${W}x${H}`;
      if(s.rotation)video+=`,rotate=${Number(s.rotation)*Math.PI/180}:fillcolor=black`;
      let out=`scene_${i}.mp4`;
      const sub=s.dialogue?await subtitleBlob(s.dialogue,W,H,s.subtitle):null;
      if(sub){await this.ffmpeg.writeFile(`sub_${i}.png`,await fetchFile(sub));const td=s.subtitle.fade?.35:0;let subFilter=`[1:v]format=rgba`;if(td)subFilter+=`,fade=t=in:st=0:d=${td}:alpha=1,fade=t=out:st=${Math.max(0,s.duration-td)}:d=${td}:alpha=1`;subFilter+=`[sub];[0:v]${video}[base];[base][sub]overlay=0:0:shortest=1[v]`;await this.ffmpeg.exec(['-loop','1','-i',img,'-loop','1','-i',`sub_${i}.png`,'-filter_complex',subFilter,'-map','[v]','-t',String(s.duration),'-r',String(fps),'-an','-c:v','libx264','-pix_fmt','yuv420p','-preset','ultrafast','-crf','24',out]);try{await this.ffmpeg.deleteFile(`sub_${i}.png`)}catch{}}
      else await this.ffmpeg.exec(['-loop','1','-i',img,'-vf',video,'-t',String(s.duration),'-r',String(fps),'-an','-c:v','libx264','-pix_fmt','yuv420p','-preset','ultrafast','-crf','24',out]);
      sceneFiles.push(out); try{await this.ffmpeg.deleteFile(img)}catch{}
      if(s.voice){const vf=`voice_${i}_${safeName(s.voiceName)}`;await this.ffmpeg.writeFile(vf,await fetchFile(s.voice));voiceFiles.push({file:vf,scene:i})}
    }
    onProgress({stage:'concat',message:'Joining scenes...'});
    const hasTransitions=scenes.slice(0,-1).some(s=>s.transition&&s.transition!=='cut');
    if(!hasTransitions){const concat=sceneFiles.map(f=>`file '${f}'`).join('\n');await this.ffmpeg.writeFile('concat.txt',new TextEncoder().encode(concat));await this.ffmpeg.exec(['-f','concat','-safe','0','-i','concat.txt','-c','copy','video_only.mp4']);}
    else {
      const inputs=sceneFiles.flatMap(f=>['-i',f]); let filter=''; let current='[0:v]'; let elapsed=Number(scenes[0].duration||0);
      for(let i=1;i<scenes.length;i++){const prev=scenes[i-1];const td=Math.max(0.01,clamp(Number(prev.transitionDuration)||.5,0,Math.min(Number(prev.duration||0),Number(scenes[i].duration||0))/2));const tr=prev.transition==='fadeblack'?'fadeblack':'fade';const out=`[vx${i}]`;const offset=Math.max(0,elapsed-td);filter+=`${current}[${i}:v]xfade=transition=${tr}:duration=${td}:offset=${offset}${out};`;current=out;elapsed=elapsed+Number(scenes[i].duration||0)-td;}
      await this.ffmpeg.exec([...inputs,'-filter_complex',filter.slice(0,-1),'-map',current,'-c:v','libx264','-pix_fmt','yuv420p','-preset','ultrafast','-crf','24','video_only.mp4']);
    }
    const total=scenes.reduce((a,s)=>a+Number(s.duration||0),0); const audioInputs=[]; const filters=[]; let start=0;
    voiceFiles.forEach((v,idx)=>{audioInputs.push(v.file);const delay=Math.round(start*1000);filters.push(`[${idx}:a]adelay=${delay}|${delay},volume=${clamp(Number(scenes[v.scene].volume??1),0,1)}[v${v.scene}]`);});
    let mixLabels=voiceFiles.map(v=>`[v${v.scene}]`).join('');
    let musicInputIndex=-1;
    if(music?.file){musicInputIndex=audioInputs.length;audioInputs.push(`music_${safeName(music.name)}`);await this.ffmpeg.writeFile(audioInputs[musicInputIndex],await fetchFile(music.file));filters.push(`[${musicInputIndex}:a]volume=${clamp(Number(music.volume??.15),0,1)}[bg]`);mixLabels+='[bg]';}
    scenes.forEach(s=>{start+=Number(s.duration||0)});
    let audioOut=null;
    if(mixLabels){filters.push(`${mixLabels}amix=inputs=${voiceFiles.length+(music?.file?1:0)}:duration=longest:dropout_transition=0[aout]`);const args=[];audioInputs.forEach((f,i)=>{if(i===musicInputIndex&&music?.loop)args.push('-stream_loop','-1');args.push('-i',f)});args.push('-filter_complex',filters.join(';'),'-map','[aout]','-t',String(total),'-c:a','aac','-b:a','192k','audio_only.m4a');await this.ffmpeg.exec(args);audioOut='audio_only.m4a';}
    onProgress({stage:'final',message:'Finalizing MP4...'});
    const output='anime_video.mp4'; if(audioOut)await this.ffmpeg.exec(['-i','video_only.mp4','-i',audioOut,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-shortest',output]);else await this.ffmpeg.exec(['-i','video_only.mp4','-c','copy',output]);
    const data=await this.ffmpeg.readFile(output); const blob=new Blob([data.buffer],{type:'video/mp4'}); return blob;
  }
}
