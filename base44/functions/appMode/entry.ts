import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json().catch(() => ({}));
    const rows = await base44.asServiceRole.entities.AppSetting.filter({key:'global-mode'});
    const row = (Array.isArray(rows) ? rows : rows.items || [])[0];
    if (data.action !== 'set') return Response.json({ok:true,mode:row?.mode === 'live' ? 'live' : 'demo'});
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ok:false,error:'Administrator sign-in required to change mode.'},{status:403});
    }
    if (!['demo','live'].includes(data.mode)) return Response.json({ok:false,error:'Invalid mode'},{status:400});
    if (row) await base44.asServiceRole.entities.AppSetting.update(row.id,{mode:data.mode,updated_at:new Date().toISOString()});
    else await base44.asServiceRole.entities.AppSetting.create({key:'global-mode',mode:data.mode,updated_at:new Date().toISOString()});
    return Response.json({ok:true,mode:data.mode,notice:'Mode updated. Demo records remain isolated and are never treated as live records.'});
  } catch(err) {
    return Response.json({ok:false,error:'Unable to read or update application mode.'},{status:500});
  }
}