/** Recorded paper turn: planish, Turning a page (2007), public domain.
 * https://commons.wikimedia.org/wiki/File:Turning_a_page.ogg
 */
const PAPER_URL="https://upload.wikimedia.org/wikipedia/commons/6/6b/Turning_a_page.ogg";
export class PaperSound {
 private ctx:AudioContext|null=null;
 private buffer:AudioBuffer|null=null;
 private pending:Promise<void>|null=null;
 private source:AudioBufferSourceNode|null=null;
 private disposed=false;
 private generation=0;
 async prepare():Promise<void>{
  if(this.disposed)throw Error("Sound player closed");
  const ctx=this.ctx??(this.ctx=new AudioContext());
  if(ctx.state==="suspended")await ctx.resume();
  if(this.buffer)return;
  if(!this.pending)this.pending=(async()=>{
   const res=await fetch(PAPER_URL,{credentials:"omit",referrerPolicy:"no-referrer"});
   if(!res.ok)throw Error("Paper recording unavailable");
   const buffer=await ctx.decodeAudioData(await res.arrayBuffer());
   if(this.disposed)throw Error("Sound player closed");
   this.buffer=buffer;
  })().finally(()=>{this.pending=null;});
  await this.pending;
 }
 async play(volume:number):Promise<void>{
  const generation=++this.generation;
  if(volume<=0||this.disposed)return;
  await this.prepare();
  const ctx=this.ctx,buffer=this.buffer;
  if(this.disposed||generation!==this.generation||!ctx||!buffer||ctx.state!=="running")return;
  this.stop();
  const source=ctx.createBufferSource(),gain=ctx.createGain();
  source.buffer=buffer;
  const samples=buffer.getChannelData(0);
  let peak=0;for(let i=0;i<samples.length;i++)peak=Math.max(peak,Math.abs(samples[i]));
  const threshold=peak*0.035;
  let start=0,end=samples.length-1;
  while(start<end&&Math.abs(samples[start])<threshold)start++;
  while(end>start&&Math.abs(samples[end])<threshold)end--;
  const offset=Math.max(0,start/buffer.sampleRate-0.025);
  const duration=Math.min(1.35,Math.max(0.05,(end-start)/buffer.sampleRate+0.08),buffer.duration-offset);
  if(duration<=0)return;
  const now=ctx.currentTime;
  gain.gain.setValueAtTime(0,now);
  gain.gain.linearRampToValueAtTime(Math.min(1,volume/100)*0.65,now+0.025);
  gain.gain.setTargetAtTime(0,now+Math.max(0.025,duration-0.09),0.02);
  source.connect(gain);gain.connect(ctx.destination);this.source=source;
  source.onended=()=>{source.disconnect();gain.disconnect();if(this.source===source)this.source=null;};
  source.start(now,offset,duration);
 }
 private stop(){if(this.source){try{this.source.stop();}catch{/* already ended */}this.source=null;}}
 dispose(){this.disposed=true;this.generation++;this.stop();void this.ctx?.close().catch(()=>{});this.ctx=null;this.buffer=null;}
}
