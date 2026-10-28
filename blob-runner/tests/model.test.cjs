const assert=require('node:assert/strict');
const M=require('../src/model.js'),{LEVEL,operation,encounter,cancellation,fits,signAllowed}=M;
let checks=0;function eq(a,b){assert.deepEqual(a,b);checks++;}
for(let a=-120;a<=120;a++)for(let b=-30;b<=30;b++){
 eq(operation(a,{kind:'add',n:b}),a+b);eq(operation(a,{kind:'sub',n:b}),a-b);eq(operation(a,{kind:'mul',n:b}),a*b===0?0:a*b);eq(encounter(a,b),a+b);
 if(b&&a%b===0)eq(operation(a,{kind:'div',n:b}),a/b===0?0:a/b);
 if(a*b<0)for(const p of [0,.1,.5,.99,1]){const q=cancellation(a,b,p);eq(q.a+q.b,a+b);eq(Math.abs(a)-Math.abs(q.a),Math.abs(b)-Math.abs(q.b));if(p===1)eq(q.a+q.b,encounter(a,b));}
}
assert.throws(()=>operation(3,{kind:'div',n:2}));assert.throws(()=>operation(3,{kind:'div',n:0}));assert.throws(()=>operation(Number.MAX_SAFE_INTEGER,{kind:'add',n:1}));
for(const n of [-7,-6,-5,-1,0,1,5,6,7])eq(fits(n,6),n!==0&&Math.abs(n)<6);
const outcomes=[];
for(let initial=0;initial<2;initial++)for(let first=0;first<2;first++)for(let fieldChoice=0;fieldChoice<2;fieldChoice++)for(let trim=0;trim<2;trim++)for(let final=0;final<2;final++){
 let v=operation(24,LEVEL.rows[0].items[initial].op),trace=[v],ended=false;
 for(const item of [LEVEL.rows[1].items[first],LEVEL.rows[1].items[1-first]]){v=(v*item.v<0&&Math.abs(v)<=Math.abs(item.v))?0:encounter(v,item.v);trace.push(v);if(v===0){ended=true;break;}}
 let fieldBlocked=false;
 if(!ended){v=operation(v,LEVEL.rows[3].items[fieldChoice].op);trace.push(v);fieldBlocked=!signAllowed(v,LEVEL.rows[3].field.sign);
  if(!fieldBlocked){v=operation(v,LEVEL.rows[4].items[trim].op);trace.push(v);v=(v*LEVEL.rows[5].v<0&&Math.abs(v)<=Math.abs(LEVEL.rows[5].v))?0:encounter(v,LEVEL.rows[5].v);trace.push(v);v=operation(v,LEVEL.rows[6].items[final].op);trace.push(v);}}

 outcomes.push({initial,first,fieldChoice,trim,final,trace,result:fieldBlocked?'wrongSign':ended?'zero':fits(v,6)?'win':'blocked'});
}
eq(outcomes.length,32);eq(outcomes.filter(o=>o.result==='win').length,1);eq(outcomes.filter(o=>o.result==='wrongSign').length,12);for(const n of [-68,-20,-1,0,1,20,68]){eq(signAllowed(n,1),n>0);eq(signAllowed(n,-1),n<0);}
eq(outcomes.find(o=>o.result==='win').trace,[-48,-68,-20,20,8,4,2]);
for(const n of [4,28,52,76]){const choices=LEVEL.rows[6].items.map(i=>fits(operation(n,i.op),6));eq(choices.filter(Boolean).length,n===4?1:0);}
console.log(JSON.stringify({checks,outcomes},null,2));
