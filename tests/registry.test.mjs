import test from 'node:test';
import assert from 'node:assert/strict';
import {fromBundle,audit,summary} from '../lib/model.mjs';
const ledger={path:'test/01_タスク台帳.md',content:'### SYN-1｜Synthetic audit\n'+Object.entries({project_id:'test',parent_id:'-',kind:'調査',state:'作業中',evidence_state:'資料確認',acceptance:'Synthetic acceptance',source:'synthetic',evidence:'-',blocked_by:'-',priority:'中',updated:'2026-11-08',owner:'AI',scope:'資料監査'}).map(([k,v])=>'- '+k+': '+v).join('\n')};
const registry=()=>({schema_version:'novel-audit-1',project_id:'test',files:[{document_id:'SYN-DOC-1',path:'test/a.md',blob_sha:'a'.repeat(40),task_ids:['SYN-1'],review_state:'pending',last_reviewed_sha:null}]});
const bundle=r=>({schema_version:'compass-ledgers-1',files:[ledger,{path:'test/差分監査レジストリ.json',content:JSON.stringify(r)}]});
test('current registry imports documents without completing audit',()=>{const data=fromBundle(bundle(registry()));assert.equal(data.documents.length,1);assert.equal(audit(data.tasks[0]),true);assert.equal(summary(data,'test').open,0);});
test('unknown tracking ID and stale completion are rejected',()=>{let r=registry();r.files[0].task_ids=['UNKNOWN'];assert.throws(()=>fromBundle(bundle(r)));r=registry();r.files[0].review_state='inherited_complete';assert.throws(()=>fromBundle(bundle(r)));});
test('duplicate path rejected',()=>{const r=registry();r.files.push({...r.files[0],document_id:'SYN-DOC-2'});assert.throws(()=>fromBundle(bundle(r)));});
