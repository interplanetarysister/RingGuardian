import { base44 } from '@/api/base44Client';
export async function getAppMode() {
 const result = await base44.functions.invoke('appMode', {action:'get'});
 if(result?.data?.ok !== true) throw Error(result?.data?.error || 'App mode could not be verified');
 return result?.data?.mode === 'live' ? 'live' : 'demo';
}
export async function setAppMode(mode) {
 const result = await base44.functions.invoke('appMode',{action:'set',mode});
 if(result?.data?.ok !== true) throw Error(result?.data?.error || 'Mode update was not confirmed');
 return result.data.mode;
}