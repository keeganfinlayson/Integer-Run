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
const courses=[];
for(let index=0;index<3;index++){
 const canonical=M.solve(M.makeLevel(index,1));assert(canonical.wins.length>=8);
 const finalValues=[...new Set(canonical.wins.map(w=>w.value))];assert(finalValues.length>=2);
 const sides=new Map();
 for(let seed=1;seed<=100;seed++){
  const level=M.makeLevel(index,seed),result=M.solve(level);
  eq(result.wins.length,canonical.wins.length);
  eq([...new Set(result.wins.map(w=>w.value))].sort(),[...finalValues].sort());
  eq(level.rows.filter(r=>r.type==='gate').length,1);
  assert(level.length>1580);assert(level.rows.every((r,i)=>!i||r.z>level.rows[i-1].z));
  eq(level,M.makeLevel(index,seed));
  for(const row of level.rows){
   if(row.items){eq(row.items.map(i=>i.x),[-.52,.52]);for(const it of row.items){const key=row.id+':'+(it.label||it.id);if(!sides.has(key))sides.set(key,new Set());sides.get(key).add(it.x);}}
  }
  for(const win of result.wins){assert(win.trace.every(v=>Number.isSafeInteger(v)&&v!==0));const final=win.actions.at(-1);eq(final.label,'÷4');}
 }
 for(const positions of sides.values())eq(positions.size,2);
 for(const mode of Object.keys(M.DIFFICULTIES))eq(M.solve(M.makeLevel(index,7,mode)).wins.length,canonical.wins.length);
 courses.push({name:M.LEVELS[index].name,length:M.LEVELS[index].length,wins:canonical.wins.length,finalValues,failures:canonical.failures,examples:canonical.wins.slice(0,2)});
}
for(const n of [-8,-4,0,4,8]){eq(signAllowed(n,1),n>0);eq(signAllowed(n,-1),n<0);}
const report={checks,courses,shuffleSeedsPerCourse:100,difficultySpeeds:M.DIFFICULTIES};
require('fs').writeFileSync(require('path').resolve(__dirname,'../docs/arithmetic-results.json'),JSON.stringify(report,null,2));
console.log('Arithmetic and course checks passed:',checks,'equalities; 300 shuffled layouts; 3 courses');
