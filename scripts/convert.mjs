import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fromBundle} from '../lib/model.mjs';
const [vault,out]=process.argv.slice(2);if(!vault||!out)throw Error('node scripts/convert.mjs <同期済みvault> <出力.json>');
const root=path.resolve(vault);const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||e.name==='node_modules')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/_タスク台帳\.md$|全資料対応台帳\.md$|01_プロジェクト一覧\.md$|差分監査レジストリ\.json$/.test(e.name))files.push({path:path.relative(root,p).split(path.sep).join('/'),content:fs.readFileSync(p,'utf8'),sha:createHash('sha1').update(Buffer.from('blob '+fs.statSync(p).size+'\0')).update(fs.readFileSync(p)).digest('hex')});}}
walk(root);let commit=null;try{commit=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
if(commit&&execFileSync('git',['-C',root,'status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim())throw Error('Commit canonical changes before converting a source commit');
const result=fromBundle({schema_version:'compass-ledgers-1',observed_at:new Date().toISOString(),source_commit:commit,files});fs.writeFileSync(out,JSON.stringify(result));console.log(JSON.stringify({tasks:result.tasks.length,projects:result.projects.length,warnings:result.warnings.length,output:out}));
