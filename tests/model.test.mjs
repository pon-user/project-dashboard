import test from 'node:test';import assert from 'node:assert/strict';import {validate,safeImport,index,summary} from '../lib/model.mjs';
const t={task_id:'TEST-001',title:'Synthetic task',project_id:'test',parent_id:'-',kind:'作業',state:'未着手',evidence_state:'未照合',acceptance:'test',source:'test',evidence:'-',blocked_by:'-',priority:'中',updated:'2026-11-08',owner:'未割当',scope:'制作'};
const fixture=()=>({schema_version:'compass-1',projects:[{id:'test',name:'Synthetic project'}],tasks:[{...t}],documents:[]});
test('valid input and unconfirmed completion',()=>{const d=fixture();validate(d);assert.equal(summary(d,'test').completion,null);assert.equal(index(d,'test').leaves.length,1)});
test('duplicate and unknown reference rejected',()=>{const d=fixture();d.tasks.push({...t});assert.throws(()=>validate(d));const n=fixture();n.tasks[0].parent_id='UNKNOWN';assert.throws(()=>validate(n))});
test('missing IDs cannot disappear on sync',()=>{const old=fixture();const next=fixture();next.tasks=[];assert.throws(()=>safeImport(old,next))});
test('unvalidated completion is excluded from proof',()=>{const d=fixture();d.tasks[0].state='完了';assert.equal(validate(d).warnings.length,1)});
