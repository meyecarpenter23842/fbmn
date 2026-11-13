/** SEO04: pure state for approved CMS Hero image loading. */
export type HeroSlideState={
 active:number;pending:number|null;
 prepared:number[];ready:number[];failed:number[];
};
export type HeroSlideAction={type:"request"|"warm"|"loaded"|"failed";index:number};
export const initialHeroSlideState:HeroSlideState={
 active:0,pending:null,prepared:[0],ready:[],failed:[]
};
const add=(items:number[],index:number)=>items.includes(index)?items:[...items,index];
export function heroSlideReducer(state:HeroSlideState,action:HeroSlideAction):HeroSlideState{
 const i=action.index;
 if(!Number.isSafeInteger(i)||i<0)return state;
 if(action.type==="warm"){
  if(state.failed.includes(i))return state;
  const prepared=add(state.prepared,i);
  return prepared===state.prepared?state:{...state,prepared};
 }
 if(action.type==="request"){
  if(state.failed.includes(i)||state.pending===i)return state;
  if(state.ready.includes(i))
   return state.active===i&&state.pending===null?state:{...state,active:i,pending:null};
  return {...state,prepared:add(state.prepared,i),pending:i};
 }
 if(action.type==="loaded"){
  if(state.failed.includes(i))return state;
  const ready=add(state.ready,i);
  const pending=state.pending===i?null:state.pending;
  const active=state.pending===i?i:state.active;
  return ready===state.ready&&pending===state.pending&&active===state.active
   ?state:{...state,ready,active,pending};
 }
 const failed=add(state.failed,i);
 const pending=state.pending===i?null:state.pending;
 return failed===state.failed&&pending===state.pending?state:{...state,failed,pending};
}
