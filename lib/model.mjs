export const STATES=['要整理','未着手','作業中','確認待ち','保留','完了','中止'];
export const AUDIT_STATES=['未照合','照合中','照合完了','重複・旧版として統合済み','判断待ち','対応不要・対象外'];
const required=['project_id','parent_id','kind','state','evidence_state','acceptance','source','evidence','blocked_by','priority','updated','owner'];
export const filled=v=>typeof v==='string'&&v.trim()!==''&&v.trim()!=='-';
export const key=t=>`${t.project_id}:${t.task_id}`;
export const deps=t=>filled(t.blocked_by)?t.blocked_by.split(/[,、\s]+/).filter(Boolean):[];
export const audit=t=>String(t.scope).includes('資料監査')||filled(t.document_id);
export const evidenced=t=>t.state==='完了'&&filled(t.acceptance)&&filled(t.evidence)&&filled(t.evidence_state)&&t.evidence_state!=='未照合'&&(t.kind!=='検証'||['試験合格','受入確認'].includes(t.evidence_state));
export function parseLedger(file){
 const out=[]; let t=null; let fence=false;
 for(const [i,line] of file.content.split(/\r?\n/).entries()){
  if(/^```/.test(line)){fence=!fence;continue;} if(fence)continue;
  const h=line.match(/^### ([A-Za-z0-9][A-Za-z0-9_-]*)[｜|](.+)$/);
  if(h){t={task_id:h[1],title:h[2].trim(),ledger:file.path,line:i+1,group:file.path.split('/').pop().replace(/_タスク台帳\.md$/,'').replace(/^\d+_/,''),source_sha:file.sha||null};out.push(t);continue;}
  const f=line.match(/^- ([a-z_]+):\s*(.*)$/);if(t&&f){if(Object.hasOwn(t,f[1]))throw Error(`${t.task_id}: 重複フィールド ${f[1]}`);t[f[1]]=f[2];}
 }
 return out;
}
export function validate(data){
 if(data?.schema_version!=='compass-1'||!Array.isArray(data.tasks)||!Array.isArray(data.projects)||data.tasks.length>100000)throw Error('対応する全量データではありません');
 const map=new Map(),projects=new Set();const warnings=[];
 for(const p of data.projects){if(!p.id||!p.name||projects.has(p.id))throw Error('プロジェクトIDが不正または重複');projects.add(p.id);}
 for(const t of data.tasks){for(const f of ['task_id','title',...required])if(typeof t[f]!=='string'||!t[f])throw Error(`${t.task_id||'?'}: ${f} が欠落`);if(!projects.has(t.project_id))throw Error(`${t.task_id}: プロジェクト未登録`);if(map.has(key(t)))throw Error(`ID重複: ${key(t)}`);map.set(key(t),t);if(!STATES.includes(t.state))throw Error(`${t.task_id}: 未知の状態 ${t.state}`);if(!['作業','判断','検証','障害','調査'].includes(t.kind))throw Error(`${t.task_id}: 未知の種類`);if(!/^\d{4}-\d{2}-\d{2}$/.test(t.updated))throw Error(`${t.task_id}: 更新日不正`);if(t.state==='完了'&&!evidenced(t))warnings.push(`${t.task_id}: 完了根拠または試験証跡が不足（完了集計から除外）`);}
 for(const t of data.tasks){for(const id of [t.parent_id,...deps(t)])if(filled(id)&&!map.has(`${t.project_id}:${id}`))throw Error(`${t.task_id}: 参照先不明 ${id}`);}
 for(const relation of ['parent','dependency']){const done=new Set();for(const t of data.tasks){const stack=[[t,false]],visiting=new Set();while(stack.length){const [n,leave]=stack.pop();const k=key(n);if(leave){visiting.delete(k);done.add(k);continue;}if(visiting.has(k))throw Error(`${n.task_id}: ${relation} 循環参照`);if(done.has(k))continue;visiting.add(k);stack.push([n,true]);const ids=relation==='parent'?(filled(n.parent_id)?[n.parent_id]:[]):deps(n);for(const id of ids)stack.push([map.get(`${n.project_id}:${id}`),false]);}}}
 const docIds=new Set();for(const d of data.documents||[]){if(!d.document_id||docIds.has(d.document_id))throw Error('資料ID重複または欠落');docIds.add(d.document_id);if(filled(d.task_id)&&!data.tasks.some(t=>t.task_id===d.task_id&&t.project_id===d.project_id))throw Error(`資料 ${d.document_id}: 監査タスク不明`);}
 return {...data,warnings};
}
export function fromBundle(bundle){
 if(bundle?.schema_version!=='compass-ledgers-1'||!Array.isArray(bundle.files))throw Error('Markdownバンドルの形式が不正');
 const files=new Map();for(const f of bundle.files){if(typeof f.path!=='string'||typeof f.content!=='string'||files.has(f.path))throw Error('ファイル形式またはパス重複');files.set(f.path,f);}
 const tasks=bundle.files.filter(f=>f.path.endsWith('_タスク台帳.md')).flatMap(parseLedger);
 const projects=[];const registry=bundle.files.find(f=>f.path.endsWith('01_プロジェクト一覧.md'));
 if(registry)for(const m of registry.content.matchAll(/\[\[([^|\]]+\/00_ホーム)\|([^\]]+)\]\]/g)){const root=m[1].split('/')[0];const projectTask=tasks.find(t=>t.ledger.startsWith(root+'/'));projects.push({id:projectTask?.project_id||`vault:${root}`,name:m[2],home:m[1]+'.md',description:projectTask?'分野別の正本台帳から制作・確認・資料整理を追跡':'プロジェクト登録済み。構造化台帳の取り込みは未実施',coverage:'棚卸し中',updated:projectTask?tasks.filter(t=>t.project_id===projectTask.project_id).map(t=>t.updated).sort().at(-1):null});}
 for(const t of tasks)if(!projects.some(p=>p.id===t.project_id))projects.push({id:t.project_id,name:t.project_id,description:'Markdownタスク台帳から取り込み',coverage:'棚卸し中',updated:t.updated});
 const documents=[];
 for(const f of bundle.files.filter(f=>f.path.endsWith('全資料対応台帳.md')))for(const line of f.content.split('\n')){const c=line.split('|').map(x=>x.trim());if(!/^[A-Z0-9]+-SRC-/.test(c[1]||''))continue;const related=tasks.find(t=>t.task_id===c[5]);documents.push({document_id:c[1],project_id:related?.project_id||tasks.find(t=>t.ledger.split('/')[0]===f.path.split('/')[0])?.project_id,task_id:c[5],path:c[6]?.replaceAll('`',''),inventory_state:c[3]});}
 // A current file registry supersedes historical path snapshots for its project.
 for(const f of bundle.files.filter(f=>f.path.endsWith('差分監査レジストリ.json'))){
  const registry=JSON.parse(f.content);
  if(registry.schema_version!=='novel-audit-1'||!Array.isArray(registry.files)||!registry.project_id)throw Error('資料レジストリ形式不正');
  for(let i=documents.length-1;i>=0;i--)if(documents[i].project_id===registry.project_id)documents.splice(i,1);
  const paths=new Set();
  for(const d of registry.files){
   if(paths.has(d.path)||!d.document_id||!/^[a-f0-9]{40}$/.test(d.blob_sha||'')||!Array.isArray(d.task_ids)||!d.task_ids.length)throw Error('資料レジストリのパス・SHA・監査ID不正');
   if(['complete','inherited_complete'].includes(d.review_state)&&d.last_reviewed_sha!==d.blob_sha)throw Error('照合済みSHAが現行資料と不一致');
   paths.add(d.path);
   for(const id of d.task_ids)if(!tasks.some(t=>t.task_id===id&&t.project_id===registry.project_id))throw Error('資料の監査ID不明');
   documents.push({document_id:d.document_id,project_id:registry.project_id,task_id:d.task_ids[0],path:d.path,blob_sha:d.blob_sha,last_reviewed_sha:d.last_reviewed_sha,inventory_state:d.review_state,source_commit:registry.source_commit});
  }
 }
 for(const t of tasks.filter(audit)){const doc=documents.find(d=>d.task_id===t.task_id&&d.project_id===t.project_id);if(doc)t.document_id=doc.document_id;}
 return validate({schema_version:'compass-1',source_commit:bundle.source_commit||null,observed_at:bundle.observed_at||null,generated_at:new Date().toISOString(),mode:'manual',projects,tasks,documents,files:bundle.files.map(({path,sha})=>({path,sha:sha||null}))});
}
export function index(data,pid){const tasks=data.tasks.filter(t=>t.project_id===pid),byId=new Map(tasks.map(t=>[t.task_id,t])),children=new Map();for(const t of tasks){if(!children.has(t.parent_id))children.set(t.parent_id,[]);children.get(t.parent_id).push(t);}const leaves=tasks.filter(t=>!children.has(t.task_id)&&t.scope!=='集計専用親');const blocked=t=>deps(t).filter(id=>!evidenced(byId.get(id)||{}));return {tasks,byId,children,leaves,blocked};}
export function summary(data,pid){const ix=index(data,pid);const ordinary=ix.leaves.filter(t=>!audit(t));return {registered:ix.tasks.length,leaves:ix.leaves.length,open:ordinary.filter(t=>!['完了','中止'].includes(t.state)).length,waiting:ordinary.filter(t=>t.state==='確認待ち').length,blocked:ordinary.filter(t=>!['完了','中止'].includes(t.state)&&ix.blocked(t).length).length,design:ordinary.filter(t=>evidenced(t)&&t.evidence_state==='資料確認').length,tested:ordinary.filter(t=>evidenced(t)&&t.kind==='検証').length,completion:null};}
export function auditState(t){if(AUDIT_STATES.includes(t.audit_state))return t.audit_state;if(t.state==='確認待ち'||t.kind==='判断')return '判断待ち';if(evidenced(t)&&/統合/.test(t.evidence+' '+(t.note||''))&&/全文/.test(t.note||''))return '重複・旧版として統合済み';if(evidenced(t))return '照合完了';if(t.state==='作業中')return '照合中';return '未照合';}
export function diff(oldData,newData){const old=new Map(oldData.tasks.map(t=>[key(t),t])),now=new Map(newData.tasks.map(t=>[key(t),t]));return {added:[...now.keys()].filter(k=>!old.has(k)),removed:[...old.keys()].filter(k=>!now.has(k)),changed:[...now.keys()].filter(k=>old.has(k)&&JSON.stringify(old.get(k))!==JSON.stringify(now.get(k)))};}
export function safeImport(oldData,input){const data=input?.schema_version==='compass-ledgers-1'?fromBundle(input):validate(input);if(oldData){const d=diff(oldData,data);if(d.removed.length)throw Error(`既存ID ${d.removed.length}件が欠落しています。全量データを取り込み、統合・中止の履歴を台帳に残してください。`);if(oldData.observed_at&&data.observed_at&&Date.parse(data.observed_at)<Date.parse(oldData.observed_at))throw Error('古いスナップショットへの巻き戻しを停止しました');}return data;}
