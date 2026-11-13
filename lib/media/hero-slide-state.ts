/** SEO04: pure state for approved CMS Hero media loading and pause semantics. */
export type HeroSlideState={
 active:number;pending:number|null;pendingSource:"auto"|"manual"|null;
 prepared:number[];ready:number[];failed:number[];
};
export type HeroSlideAction=
 | {type:"request";index:number;source?:"auto"|"manual"}
 | {type:"warm"|"loaded"|"failed";index:number;paused?:boolean}
 | {type:"resume"};
export const initialHeroSlideState:HeroSlideState={
 active:0,pending:null,pendingSource:null,prepared:[0],ready:[],failed:[]
};
const add=(items:number[],index:number)=>items.includes(index)?items:[...items,index];
export function heroSlideReducer(state:HeroSlideState,action:HeroSlideAction):HeroSlideState{
 if(action.type==="resume"){
  // Continue only a fully decoded automatic request after pointer/focus/page resumes.
  if(state.pending===null||state.pendingSource!=="auto"||
     !state.ready.includes(state.pending))return state;
  return {...state,active:state.pending,pending:null,pendingSource:null};
 }
 const i=action.index;
 if(!Number.isSafeInteger(i)||i<0)return state;
 if(action.type==="warm"){
  if(state.failed.includes(i))return state;
  const prepared=add(state.prepared,i);
  return prepared===state.prepared?state:{...state,prepared};
 }
 if(action.type==="request"){
  if(state.failed.includes(i))return state;
  if(state.ready.includes(i))
   return state.active===i&&state.pending===null?state:
    {...state,active:i,pending:null,pendingSource:null};
  const source=action.source??"manual";
  if(state.pending===i)
   return source==="manual"&&state.pendingSource==="auto"
    ?{...state,pendingSource:"manual"}:state;
  return {...state,prepared:add(state.prepared,i),pending:i,pendingSource:source};
 }
 if(action.type==="loaded"){
  if(state.failed.includes(i))return state;
  const ready=add(state.ready,i);
  const hold=state.pending===i&&state.pendingSource==="auto"&&action.paused===true;
  const pending=state.pending===i&&!hold?null:state.pending;
  const active=state.pending===i&&!hold?i:state.active;
  const pendingSource=pending===null?null:state.pendingSource;
  return ready===state.ready&&pending===state.pending&&active===state.active
   ?state:{...state,ready,active,pending,pendingSource};
 }
 const failed=add(state.failed,i);
 const pending=state.pending===i?null:state.pending;
 const pendingSource=pending===null?null:state.pendingSource;
 return failed===state.failed&&pending===state.pending?state:{...state,failed,pending,pendingSource};
}
