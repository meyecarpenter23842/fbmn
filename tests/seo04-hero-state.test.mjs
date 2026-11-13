import test from "node:test";
import assert from "node:assert/strict";
import {heroSlideReducer,initialHeroSlideState} from "../lib/media/hero-slide-state.ts";

const send=(state,type,index)=>heroSlideReducer(state,{type,index});

test("Delayed destination stays invisible until its real image is decoded",()=>{
 let state=send(initialHeroSlideState,"request",2);
 assert.equal(state.active,0);
 assert.equal(state.pending,2);
 assert.deepEqual(state.prepared,[0,2]);
 state=send(state,"warm",1);
 state=send(state,"loaded",1); // out-of-order image response
 assert.equal(state.active,0);
 assert.equal(state.pending,2);
 state=send(state,"loaded",2); // same action as Image.decode() success
 assert.equal(state.active,2);
 assert.equal(state.pending,null);
});
test("Failed image never blanks previous slide; disabled target cannot be activated",()=>{
 let state=send(initialHeroSlideState,"request",1);
 state=send(state,"failed",1);
 assert.equal(state.active,0);
 assert.equal(state.pending,null);
 assert.deepEqual(state.failed,[1]);
 assert.strictEqual(send(state,"request",1),state);
 state=send(state,"request",2);
 state=send(state,"loaded",2);
 assert.equal(state.active,2);
});
test("Warmed and decoded image transitions immediately, but no other slide is fetched initially",()=>{
 assert.deepEqual(initialHeroSlideState.prepared,[0]);
 let state=send(initialHeroSlideState,"warm",1);
 assert.equal(state.active,0);
 assert.deepEqual(state.prepared,[0,1]);
 state=send(state,"loaded",1);
 assert.equal(state.active,0);
 state=send(state,"request",1);
 assert.equal(state.active,1);
 assert.equal(state.pending,null);
});
