import {env} from 'cloudflare:workers';
import {safeImport} from '../../../lib/model.mjs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 const e=env as any;
 if(!e.SYNC_WRITE_KEY||req.headers.get('X-Sync-Key')!==e.SYNC_WRITE_KEY)return new Response('Unauthorized',{status:401});
 if(Number(req.headers.get('Content-Length')||0)>20000000)return new Response('Too large',{status:413});
 const db=e.DB,now=new Date().toISOString();
 const old=await db.prepare('SELECT * FROM snapshot WHERE id=1').first();
 try{
 const body=await req.text();if(body.length>20000000)throw Error('size');const incoming=JSON.parse(body);
 if(incoming.failure){await db.prepare("INSERT INTO snapshot(id,status,attempt,error,revision) VALUES(1,'failed',?,?,0) ON CONFLICT(id) DO UPDATE SET status='failed',attempt=excluded.attempt,error=excluded.error").bind(now,'台帳変換・配信に失敗。前回成功版を保持しています。').run();return Response.json({status:'failed',attempt:now});}
 if(!/^[a-f0-9]{40}$/.test(incoming.source_commit||''))throw Error('commit');
 const next=safeImport(old?.payload?JSON.parse(old.payload):null,incoming);
 const rev=Number(old?.revision||0);
 const result=await db.prepare("INSERT INTO snapshot(id,payload,status,attempt,success,error,revision) VALUES(1,?,'ok',?,?,NULL,1) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,status='ok',attempt=excluded.attempt,success=excluded.success,error=NULL,revision=snapshot.revision+1 WHERE snapshot.revision=?").bind(JSON.stringify(next),now,now,rev).run();
 if(!result.meta.changes)return Response.json({error:'conflict'},{status:409});
 return Response.json({status:'success',source_commit:next.source_commit,received_at:now});
 }catch{await db.prepare("INSERT INTO snapshot(id,status,attempt,error,revision) VALUES(1,'failed',?,?,0) ON CONFLICT(id) DO UPDATE SET status='failed',attempt=excluded.attempt,error=excluded.error").bind(now,'検証失敗。前回成功版を保持しています。').run();return Response.json({error:'validation_failed'},{status:422});}
}
