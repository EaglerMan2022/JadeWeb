import React, {useEffect, useRef, useState} from 'react';
import {Circle, Download, Settings, Monitor, Webcam, Mic, Volume2, Plus, Minus, Copy, Trash2, Lock, Eye, EyeOff, Square, Play, Pause, Square as StopIcon, Maximize2, Layers, GripVertical, ChevronRight, SlidersHorizontal, Radio, RotateCcw} from 'lucide-react';

type Scene={id:string,name:string};
type Source={id:string,name:string,type:'screen'|'webcam'|'mic'|'color'|'text'|'image'|'video'|'browser';visible:boolean;locked:boolean;x:number;y:number;width:number;height:number;color?:string;text?:string;url?:string;stream?:MediaStream};

export default function App(){
 const [scenes,setScenes]=useState<Scene[]>(()=>JSON.parse(localStorage.getItem('jade-scenes')||'null')||[{id:'scene-1',name:'Scene 1'}]);
 const [active,setActive]=useState(()=>localStorage.getItem('jade-active')||'scene-1');
 const [sources,setSources]=useState<Record<string,Source[]>>(()=>JSON.parse(localStorage.getItem('jade-sources')||'null')||{'scene-1':[ {id:'source-welcome',name:'JadeCanvas',type:'color',visible:true,locked:false,x:0,y:0,width:100,height:100,color:'#0a1f1b'} ]});
 const [selected,setSelected]=useState<string|null>(null);
 const [stream,setStream]=useState<MediaStream|null>(null);
 const [recording,setRecording]=useState(false); const [paused,setPaused]=useState(false); const [duration,setDuration]=useState(0);
 const [studio,setStudio]=useState(false); const [previewFull,setPreviewFull]=useState(false);
 const [micEnabled,setMicEnabled]=useState(true); const [micLevel,setMicLevel]=useState(38);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [resolution,setResolution]=useState('1920 × 1080');
 const canvasRef=useRef<HTMLDivElement>(null); const previewRef=useRef<HTMLDivElement>(null); const recorderRef=useRef<MediaRecorder|null>(null); const chunksRef=useRef<Blob[]>([]);
 const current=sources[active]||[];

 useEffect(()=>{localStorage.setItem('jade-scenes',JSON.stringify(scenes));localStorage.setItem('jade-active',active);localStorage.setItem('jade-sources',JSON.stringify(sources));},[scenes,active,sources]);
 useEffect(()=>{if(!recording||paused)return;const t=window.setInterval(()=>setDuration(d=>d+1),1000);return()=>clearInterval(t)},[recording,paused]);

 function addScene(){const n=scenes.length+1,id=`scene-${Date.now()}`;setScenes(s=>[...s,{id,name:`Scene ${n}`}]);setSources(s=>({...s,[id]:[]}));setActive(id)}
 function renameScene(id:string){const s=scenes.find(x=>x.id===id);const name=prompt('Rename scene',s?.name||'');if(name?.trim())setScenes(v=>v.map(x=>x.id===id?{...x,name:name.trim()}:x)}
 function duplicateScene(){const src=sources[active]||[];const id=`scene-${Date.now()}`;const original=scenes.find(s=>s.id===active);setScenes(v=>[...v,{id,name:`${original?.name||'Scene'} copy`}]);setSources(v=>({...v,[id]:src.map(s=>({...s,id:`${s.id}-${Date.now()}`}))}));setActive(id)}
 function deleteScene(){if(scenes.length===1)return alert('Keep at least one scene.');setScenes(v=>v.filter(s=>s.id!==active));setSources(v=>{const n={...v};delete n[active];return n});setActive(scenes.find(s=>s.id!==active)?.id||'')}

 async function captureScreen(){try{const s=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:true});setStream(s);const src:Source={id:`screen-${Date.now()}`,name:'Display Capture',type:'screen',visible:true,locked:false,x:5,y:5,width:90,height:90,stream:s};setSources(v=>({...v,[active]:[...(v[active]||[]),src]}));setSelected(src.id)}catch(e:any){alert(e?.name==='NotAllowedError'?'Screen capture was cancelled or denied.':`Could not capture screen: ${e?.message||e}`)}}
 async function captureCamera(){try{const s=await navigator.mediaDevices.getUserMedia({video:true,audio:false});const src:Source={id:`cam-${Date.now()}`,name:'Webcam',type:'webcam',visible:true,locked:false,x:70,y:60,width:26,height:30,stream:s};setSources(v=>({...v,[active]:[...(v[active]||[]),src]}));setSelected(src.id)}catch(e:any){alert(`Could not open webcam: ${e?.message||e}`)}}
 async function captureMic(){try{const s=await navigator.mediaDevices.getUserMedia({audio:true,video:false});const src:Source={id:`mic-${Date.now()}`,name:'Microphone',type:'mic',visible:true,locked:false,x:0,y:0,width:0,height:0,stream:s};setSources(v=>({...v,[active]:[...(v[active]||[]),src]}));setMicEnabled(true)}catch(e:any){alert(`Could not open microphone: ${e?.message||e}`)}}

 function addSource(type:'color'|'text'|'image'|'video'|'browser'){let src:Source={id:`${type}-${Date.now()}`,name:type==='color'? 'Colour Background':type==='text'? 'Text Overlay':`${type[0].toUpperCase()}${type.slice(1)}`,type,visible:true,locked:false,x:10,y:10,width:type==='text'?30:50,height:type==='text'?15:40,color:'#7057d6',text:'JadeWeb'};
  if(type==='text'){const text=prompt('Overlay text','JadeWeb');if(text!==null)src.text=text}
  if(type==='browser'){const url=prompt('Webpage URL','https://example.com');if(!url)return;src.url=url}
  if(type==='image'||type==='video'){const input=document.createElement('input');input.type='file';input.accept=type==='image'?'image/*':'video/*';input.onchange=()=>{const f=input.files?.[0];if(!f)return;src.url=URL.createObjectURL(f);src.name=f.name;setSources(v=>({...v,[active]:[...(v[active]||[]),src]}));setSelected(src.id)};input.click();return}
  setSources(v=>({...v,[active]:[...(v[active]||[]),src]}));setSelected(src.id)
 }

 function updateSelected(patch:Partial<Source>){if(!selected)return;setSources(v=>({...v,[active]:v[active].map(s=>s.id===selected?{...s,...patch}:s)}))}
 function removeSelected(){if(selected)setSources(v=>({...v,[active]:v[active].filter(s=>s.id!==selected)}));setSelected(null)}
 function dragSource(e:React.PointerEvent,src:Source){if(src.locked)return;const box=canvasRef.current?.getBoundingClientRect();if(!box)return;const startX=e.clientX,startY=e.clientY,ox=src.x,oy=src.y;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);const move=(ev:PointerEvent)=>updateAt(src.id,{x:Math.max(0,Math.min(100-src.width,ox+(ev.clientX-startX)/box.width*100)),y:Math.max(0,Math.min(100-src.height,oy+(ev.clientY-startY)/box.height*100))});const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up)}
 function updateAt(id:string,p:Partial<Source>){setSources(v=>({...v,[active]:v[active].map(s=>s.id===id?{...s,...p}:s)}))}

 async function startRecording(){try{if(!canvasRef.current)return;const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext('2d')!;const draw=()=>{ctx.fillStyle='#0b0d10';ctx.fillRect(0,0,canvas.width,canvas.height);const el=canvasRef.current?.querySelectorAll<HTMLElement>('[data-source]')||[];el.forEach(e=>{ctx.save();ctx.fillStyle=e.dataset.type==='color'?e.dataset.color||'#111':'#1a2024';ctx.fillRect(parseFloat(e.style.left)*19.2,parseFloat(e.style.top)*10.8,parseFloat(e.style.width)*19.2,parseFloat(e.style.height)*10.8);ctx.restore()});if(recording||recorderRef.current?.state==='recording')requestAnimationFrame(draw)};draw();const mixed=(canvas as HTMLCanvasElement).captureStream(30);if(stream)mixed.addTrack(stream.getVideoTracks()[0]);const rec=new MediaRecorder(mixed,{mimeType:MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm'});rec.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data)};rec.onstop=()=>{const blob=new Blob(chunksRef.current,{type:'video/webm'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`jadeweb-${Date.now()}.webm`;a.click();chunksRef.current=[]};rec.start(500);recorderRef.current=rec;setRecording(true);setPaused(false);setDuration(0)}catch(e:any){alert(`Recording could not start: ${e?.message||e}`)}}
 function pauseRecording(){if(recorderRef.current?.state==='recording'){recorderRef.current.pause();setPaused(true)}}
 function resumeRecording(){if(recorderRef.current?.state==='paused'){recorderRef.current.resume();setPaused(false)}}
 function stopRecording(){recorderRef.current?.stop();recorderRef.current=null;setRecording(false);setPaused(false)}

 const sel=current.find(s=>s.id===selected);
 const fmt=(n:number)=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;

 return <div className="app">
  <header className="topbar"><div className="brand"><div className="jade-mark">J</div><span>JadeWeb</span></div><nav><button>File</button><button>Edit</button><button>View</button><button>Profile</button></nav><div className="top-status"><span className={recording?'live red':'live'}>{recording?'● REC':'● Offline'}</span><span>{recording?fmt(duration):'00:00:00'}</span></div></header>
  <main className="workspace">
   <section className="preview-column">
    <div className="panel preview-panel">
     <div className="panel-tabs"><span className="tab active">Preview</span>{studio&&<span className="tab">Program</span>}<div className="preview-tools"><button title="Reset preview"><RotateCcw size={14}/></button><button title="Fullscreen preview" onClick={()=>{if(!document.fullscreenElement)previewRef.current?.requestFullscreen();else document.exitFullscreen()}}><Maximize2 size={14}/></button></div></div>
     <div className="preview-area" ref={previewRef}><div className="canvas" ref={canvasRef} style={{aspectRatio:resolution.includes('4')?'4 / 3':'16 / 9'}}>
      {current.filter(s=>s.visible).map(s=><div key={s.id} data-source data-type={s.type} data-color={s.color||''} className={`source-item ${selected===s.id?'selected':''}`} style={{left:`${s.x}%`,top:`${s.y}%`,width:`${s.width}%`,height:`${s.height}%`,background:s.type==='color'?s.color:undefined}} onPointerDown={e=>{setSelected(s.id);dragSource(e,s)}}>
       {s.type==='screen'||s.type==='webcam'?<video autoPlay muted playsInline ref={el=>{if(el&&s.stream&&el.srcObject!==s.stream)el.srcObject=s.stream}}/>:null}
       {s.type==='text'?<span className="text-overlay">{s.text}</span>:null}
       {s.type==='image'&&s.url?<img src={s.url} alt={s.name}/>:null}
       {s.type==='video'&&s.url?<video src={s.url} autoPlay loop muted/>:null}
       {s.type==='browser'&&s.url?<iframe src={s.url} title={s.name}/>:null}
       {selected===s.id&&<><i className="handle nw"/><i className="handle ne"/><i className="handle sw"/><i className="handle se"/></>}
      </div>)}
     </div></div>
    </div>
   </section>
   <aside className="right-panel">
    <div className="panel mixer-panel"><div className="panel-title"><span>Audio Mixer</span><button title="Mixer settings"><SlidersHorizontal size={14}/></button></div>
     <div className="mixer-channel"><div className="channel-head"><Mic size={14}/><span>Mic/Aux</span><span className="device-status">Live</span></div><div className="meter-row"><div className="fader"><button onClick={()=>setMicLevel(l=>Math.min(100,l+5))}><Plus size={11}/></button><input aria-label="Microphone volume" type="range" min="0" max="100" value={micLevel} onChange={e=>setMicLevel(+e.target.value)} orient="vertical"/><button onClick={()=>setMicLevel(l=>Math.max(0,l-5))}><Minus size={11}/></button></div><div className="meter"><div style={{height:`${micEnabled?micLevel*.7:0}%`}}/></div></div><button className="mute" onClick={()=>setMicEnabled(v=>!v)}>{micEnabled?<Volume2 size={13}/>:<Volume2 size={13}/>} {micEnabled?'Muted':'Mute'}</button></div>
    </div>
    <div className="panel scene-panel"><div className="panel-title"><span>Scenes</span><div><button title="Add scene" onClick={addScene}><Plus size={14}/></button><button title="Duplicate scene" onClick={duplicateScene}><Copy size={14}/></button><button title="Delete scene" onClick={deleteScene}><Trash2 size={14}/></button></div></div><div className="list">{scenes.map(s=><button key={s.id} className={active===s.id?'selected':''} onClick={()=>setActive(s.id)} onDoubleClick={()=>renameScene(s.id)}><Layers size={13}/><span>{s.name}</span></button>)}</div></div>
    <div className="panel sources-panel"><div className="panel-title"><span>Sources</span><div><button title="Add source" onClick={()=>addSource('color')}><Plus size={14}/></button><button title="Remove selected source" onClick={removeSelected}><Trash2 size={14}/></button></div></div><div className="list source-list">{current.map(s=><div key={s.id} className={selected===s.id?'selected':''} onClick={()=>setSelected(s.id)}><button title={s.visible?'Hide':'Show'} onClick={()=>updateAt(s.id,{visible:!s.visible})}>{s.visible?<Eye size={13}/>:<EyeOff size={13}/>}</button><GripVertical size={12}/><span>{s.name}</span><button title={s.locked?'Unlock':'Lock'} onClick={()=>updateAt(s.id,{locked:!s.locked})}><Lock size={12} className={s.locked?'locked':''}/></button></div>)}</div></div>
   </aside>
  </main>
  <footer className="controls"><div className="source-buttons"><button onClick={captureScreen}><Monitor size={16}/><span>Display</span></button><button onClick={captureCamera}><Webcam size={16}/><span>Camera</span></button><button onClick={captureMic}><Mic size={16}/><span>Mic</span></button><button onClick={()=>addSource('image')}><Square size={16}/><span>Image</span></button><button onClick={()=>addSource('video')}><Play size={16}/><span>Media</span></button><button onClick={()=>addSource('text')}><span className="text-icon">T</span><span>Text</span></button><button onClick={()=>addSource('browser')}><Circle size={16}/><span>Browser</span></button><button onClick={()=>addSource('color')}><PaletteIcon/><span>Colour</span></button></div><div className="transport"><button className="record" onClick={recording?stopRecording:startRecording}>{recording?<StopIcon size={15}/>:<Circle size={15}/>}<span>{recording?'Stop Recording':'Start Recording'}</span></button><button className="pause" disabled={!recording} onClick={paused?resumeRecording:pauseRecording}>{paused?<Play size={15}/>:<Pause size={15}/>}<span>{paused?'Resume':'Pause'}</span></button><button onClick={()=>setStudio(v=>!v)} className={studio?'active':''}><Layers size={15}/><span>Studio Mode</span></button><button onClick={()=>setSettingsOpen(true)}><Settings size={15}/><span>Settings</span></button></div></footer>
  {settingsOpen&&<div className="modal-backdrop" onClick={()=>setSettingsOpen(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>Settings</h2><button onClick={()=>setSettingsOpen(false)}>×</button></div><div className="settings-grid"><label>Base Resolution<select value={resolution} onChange={e=>setResolution(e.target.value)}><option>1920 × 1080</option><option>1280 × 720</option><option>1024 × 768</option></select></label><label>Frame Rate<select><option>60 FPS</option><option>30 FPS</option><option>24 FPS</option></select></label><label>Recording Format<select><option>WebM (VP9)</option><option>WebM (VP8)</option></select></label><label>Theme<select><option>Dark</option><option>Midnight</option></select></label></div><div className="limitations"><strong>Streaming</strong><p>Browser capture and WebM recording work locally. RTMP streaming requires a secure backend; never place a stream key directly in browser code.</p></div><button className="primary" onClick={()=>setSettingsOpen(false)}>Done</button></div></div>}
 </div>
}
function PaletteIcon(){return <span className="palette-icon"/>}
