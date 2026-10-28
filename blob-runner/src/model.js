/* Exact integer state; independent of rendering. Browser and Node compatible. */
(function(root){
'use strict';
const signed = n => n > 0 ? '+'+n : String(n).replace('-', '−');
function operation(value, op){
  if(!Number.isSafeInteger(value)||!Number.isSafeInteger(op.n)) throw Error('Integer required');
  let out;
  switch(op.kind){
    case 'add': out=value+op.n;break;
    case 'sub': out=value-op.n;break;
    case 'mul': out=value*op.n;break;
    case 'div': if(op.n===0||value%op.n!==0)throw Error('Division must give a whole number');out=value/op.n;break;
    default:throw Error('Unknown operation');
  }
  if(!Number.isSafeInteger(out))throw Error('Quantity outside exact integer range');
  return out===0?0:out;
}
function encounter(a,b){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||!Number.isSafeInteger(a+b))throw Error('Integer required');return a+b;}
function cancellation(a,b,progress){
 if(a*b>=0)throw Error('Opposite signs required');
 const removed=Math.floor(Math.min(Math.abs(a),Math.abs(b))*Math.max(0,Math.min(1,progress)));
 return {a:Math.sign(a)*(Math.abs(a)-removed),b:Math.sign(b)*(Math.abs(b)-removed),removed};
}
const fits=(n,capacity)=>Number.isSafeInteger(n)&&n!==0&&Math.abs(n)<capacity;
const signAllowed=(n,sign)=>Number.isSafeInteger(n)&&n!==0&&Math.sign(n)===sign;
// Course plans use multiples of four so every final division is exact.
// The order and arithmetic are designed first; only lateral placement is shuffled.
const DIFFICULTIES={relaxed:{name:'Relaxed',speed:70},standard:{name:'Standard',speed:88},fast:{name:'Fast',speed:108}};
const LEVELS=[
 {name:'Riverstone Run',start:24,red:-20,blue:48,trim:[12,52],length:3100,theme:0},
 {name:'Amber Crossing',start:40,red:-28,blue:80,trim:[20,92],length:3700,theme:1},
 {name:'Twilight Rush',start:56,red:-36,blue:112,trim:[28,132],length:4300,theme:2}
];
function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function makeLevel(index=0,seed=1,difficulty='standard'){
 const spec=LEVELS[index];if(!spec)throw Error('Unknown level');
 const rng=random(seed),scale=spec.length/3100;
 const op=(label,kind,n)=>({label,op:{kind,n}});
 const pads=(id,z,title,items)=>({id,z:z*scale,type:'pads',title,items});
 let rows=[
  pads('start',210,'Choose your opening move',[op('×(−2)','mul',-2),op('+8','add',8)]),
  {id:'pair',z:620*scale,hold:870*scale,type:'incoming',title:'Choose which swarm reaches you first',items:[{id:'red',v:spec.red},{id:'blue',v:spec.blue}]},
  pads('positiveChoice',1070,'The blue gate needs a positive swarm',[op('×(−1)','mul',-1),op('×(+1)','mul',1)]),
  {id:'positiveGate',z:1270*scale,type:'signGate',sign:1,title:'POSITIVE +'},
  pads('trim',1500,'Choose how much to subtract',spec.trim.map(n=>op('−'+n,'sub',n))),
 ];
 if(index>0)rows.push(pads('reshape',1660,index===1?'Grow or stay?':'Plan for the red swarm',index===1?[op('×1','mul',1),op('×2','mul',2)]:[op('×2','mul',2),op('+4','add',4)]));
 rows.push(
  {id:'lastSwarm',z:1850*scale,hold:1980*scale,type:'swarm',title:'Meet −4',v:-4},
  pads('negativeChoice',2150,'The red gate needs a negative swarm',[op('×(−1)','mul',-1),op('−16','sub',16)]),
  {id:'negativeGate',z:2360*scale,type:'signGate',sign:-1,title:'NEGATIVE −'},
  pads('recover',2580,'Find a small nonzero value',[op('+8','add',8),op(index===1?'+24':'+16','add',index===1?24:16)]),
  pads('final',2870,'One last operation before the size gate',[op('÷4','div',4),op('×(−2)','mul',-2)]),
  {id:'gate',z:spec.length,type:'gate',title:'Finish with 0 < |value| < 5',capacity:5}
 );
 for(const row of rows){if(!row.items)continue;if(rng()<.5)row.items.reverse();row.items.forEach((it,i)=>it.x=i? .52:-.52);}
 return {...spec,index,seed,difficulty,speed:DIFFICULTIES[difficulty].speed,view:1100,capacity:5,rows};
}
// Enumerate operation choices and both encounter orders; exhausted players never
// inherit an enemy's survivors. Returned traces also support browser route tests.
function solve(level){
 let states=[{value:level.start,actions:[],trace:[level.start]}],failures={zero:0,sign:0,size:0,integer:0};
 const hit=(a,b)=>a*b<0&&Math.abs(a)<=Math.abs(b)?0:encounter(a,b);
 for(const row of level.rows){const next=[];
  for(const state of states){
   const emit=(value,action)=>{if(value===0){failures.zero++;return;}next.push({value,actions:action?[...state.actions,{row:row.id,...action}]:state.actions,trace:[...state.trace,value]});};
   if(row.type==='pads'){for(const it of row.items){try{emit(operation(state.value,it.op),{label:it.label,x:it.x});}catch(e){failures.integer++;}}}
   else if(row.type==='incoming'){
    for(const order of [row.items,[...row.items].reverse()]){let v=state.value;for(const it of order){v=hit(v,it.v);if(v===0)break;}emit(v,{order:order.map(it=>it.id),x:order[0].x});}
   }else if(row.type==='swarm')emit(hit(state.value,row.v));
   else if(row.type==='signGate'){if(signAllowed(state.value,row.sign))emit(state.value);else failures.sign++;}
   else if(row.type==='gate'){if(fits(state.value,row.capacity))emit(state.value);else failures.size++;}
  }states=next;
 }
 return {wins:states,failures};
}
const LEVEL=makeLevel();
const api={signed,operation,encounter,cancellation,fits,signAllowed,LEVEL,LEVELS,DIFFICULTIES,makeLevel,solve};
if(typeof module!=='undefined')module.exports=api;else root.BlobMath=api;
})(typeof window!=='undefined'?window:globalThis);
