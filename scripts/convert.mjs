import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fromBundle} from '../lib/model.mjs';
const [vault,out]=process.argv.slice(2);if(!vault||!out)throw Error('node scripts/convert.mjs <同期済みvault> <出力.json>');
const root=path.resolve(vault);const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||e.name==='node_modules')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/_タスク台帳\.md$|全資料対応台帳\.md$|01_プロジェクト一覧\.md$/.test(e.name))files.push({path:path.relative(root,p).split(path.sep).join('/'),content:fs.readFileSync(p,'utf8')});}}
walk(root);let commit=null;try{commit=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
const result=fromBundle({schema_version:'compass-ledgers-1',observed_at:new Date().toISOString(),source_commit:commit,files});fs.writeFileSync(out,JSON.stringify(result));console.log(JSON.stringify({tasks:result.tasks.length,projects:result.projects.length,warnings:result.warnings.length,output:out}));
