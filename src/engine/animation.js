export const animationStyle = (scene, progress=0) => {
  const p=Math.min(1,Math.max(0,progress)); let scale=1;
  if(scene.zoom==='in') scale=1+0.1*p;
  if(scene.zoom==='out') scale=1.1-0.1*p;
  const x=(scene.panX||0)*p, y=(scene.panY||0)*p, rot=(scene.rotation||0)*p;
  const shake=scene.shake ? ` translate(${Math.sin(p*55)*1.8}px,${Math.cos(p*47)*1.8}px)` : '';
  return { transform:`translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})${shake}` };
};
