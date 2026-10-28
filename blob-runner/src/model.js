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
const LEVEL={name:'The Narrow Escape',start:24,speed:52,view:820,capacity:6,
 rows:[
 {id:'start',z:180,type:'pads',title:'Choose your starting operation',items:[{x:-.52,label:'×(−2)',op:{kind:'mul',n:-2}},{x:.52,label:'+16',op:{kind:'add',n:16}}]},
 {id:'approach',z:450,type:'incoming',title:'Both swarms approach',items:[{id:'red',x:-.52,v:-20},{id:'blue',x:.52,v:48}]},
 {id:'arrivals',z:640,type:'incomingProgress',title:'Interactions follow front contact'},
 {id:'field',z:850,type:'pads',title:'Choose your sign before the forcefield',field:{z:950,sign:1},items:[{x:-.52,label:'×(−1)',op:{kind:'mul',n:-1}},{x:.52,label:'×(+1)',op:{kind:'mul',n:1}}]},
 {id:'trim',z:1060,type:'pads',title:'Prepare for −4',items:[{x:-.52,label:'−12',op:{kind:'sub',n:12}},{x:.52,label:'+12',op:{kind:'add',n:12}}]},
 {id:'lastSwarm',z:1250,type:'swarm',title:'Encounter −4',v:-4},
 {id:'final',z:1470,type:'pads',title:'One circle fits the gate',items:[{x:-.52,label:'÷2',op:{kind:'div',n:2}},{x:.52,label:'×(−2)',op:{kind:'mul',n:-2}}]},
 {id:'gate',z:1580,type:'gate',title:'Only |value| < 6 fits',capacity:6}
 ]};
const api={signed,operation,encounter,cancellation,fits,signAllowed,LEVEL};
if(typeof module!=='undefined')module.exports=api;else root.BlobMath=api;
})(typeof window!=='undefined'?window:globalThis);
