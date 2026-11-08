import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';
export async function GET(){
 const row=await (env as any).DB.prepare('SELECT * FROM snapshot WHERE id=1').first();
 const sync={status:row?.status||'empty',last_attempt:row?.attempt,last_success:row?.success,error:row?.error};
 if(!row?.payload)return Response.json({error:'初回同期を待っています',sync},{status:503,headers:{'Cache-Control':'private, no-store'}});
 return Response.json({...JSON.parse(row.payload),sync},{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
