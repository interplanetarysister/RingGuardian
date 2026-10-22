// Only record which fictional UI actions occurred. No tracking numbers,
// names, private observations, or video metadata are kept in guide progress.
const KEY='rgc.guide.verifiedActions.v1';
const ALLOWED=Object.freeze({
 customer:new Set(['packageSelected','issueSelected','evidenceReviewed','reportSubmitted','reportReviewed']),
 management:new Set(['dashboardOpened','scannersOpened','evidenceOpened','packageOpened','investigationsOpened','complaintsReviewed'])
});
export function readGuideActions(role){
 if(typeof sessionStorage==='undefined'||!Object.hasOwn(ALLOWED,role))return [];
 try{
  const saved=JSON.parse(sessionStorage.getItem(KEY)||'{}');
  return Array.isArray(saved?.[role])?saved[role].filter(action=>ALLOWED[role].has(action)):[];
 }catch{return [];}
}
export function recordGuideAction(role,action){
 if(!Object.hasOwn(ALLOWED,role)||!ALLOWED[role].has(action))return false;
 if(typeof sessionStorage==='undefined')return false;
 try{
  const saved={customer:readGuideActions('customer'),management:readGuideActions('management')};
  if(!saved[role].includes(action))saved[role].push(action);
  sessionStorage.setItem(KEY,JSON.stringify(saved));
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('rgc-guide-action',{detail:{role,action}}));
  return true;
 }catch{return false;}
}
export function clearGuideActions(role){
 if(!Object.hasOwn(ALLOWED,role)||typeof sessionStorage==='undefined')return;
 try{
  const saved={customer:readGuideActions('customer'),management:readGuideActions('management')};
  saved[role]=[];
  sessionStorage.setItem(KEY,JSON.stringify(saved));
 }catch{/* session storage may be disabled */}
}