/** @type {Array<[string,string,string[],string]>} */
const NAV=[
 ['customer', '/view/customer', ['my delivery','my package','customer','complaint','report an issue','report a problem'],'Open the customer workspace. Choose a sample package, select the delivery problem, then submit the internal demo report with optional synthetic doorbell footage. Step 4 is verifying its receipt in My submitted reports.'],
 ['management', '/view/management', ['management','manager','hub worker','warehouse tour'],'Open the management workspace for the operational walkthrough.'],
 ['packages','/packages',['package list','shipments','tracking list'],'Open Packages to inspect the simulated shipment records.'],
 ['scanners','/scanners',['scanner','scanning','scan event'],'Open Scanners and run a simulated scan. Check its timestamp against the matching evidence.'],
 ['evidence','/evidence',['evidence','camera clip','footage','recording','timestamp'],'Open Evidence to compare a scan and its associated recording window.'],
 ['investigations','/investigations',['investigation','case history','cases'],'Open Investigations to review the fictional discrepancy and audit trail.'],
 ['events','/live-events',['live event','simulation event','delivery scenario'],'Open Live Events. Choose a fictional scenario and select Start live simulation.'],
 ['alexa','/alexa',['alexa','voice briefing'],'Open Alexa to play a browser-spoken simulated package briefing.'],
 ['integration','/ring',['ring integration','ring camera connection'],'Open the Ring adapter to inspect simulated integration capabilities. No live Ring camera is paired.']
];
const NAV_INTENT=/\b(where|how|navigate|find|go to|open|show me|take me|which page|where is|where do i|what do i do|how do i get)\b/i;
export function navigationAnswer(question,options={}){
 if(!NAV_INTENT.test(question))return null;
 const text=question.toLowerCase();
 const match=NAV.find(([, ,words])=>words.some(w=>text.includes(w)));
 if(!match){
   if(/\b(here|this page|next|continue)\b/i.test(text)&&options.stepTitle)
     return {reply:'You are at '+options.stepTitle+'. '+(options.instruction||'Follow the highlighted action on this screen.'),to:options.path||null};
   return null;
 }
 if(options.role==='customer' && !['customer','alexa'].includes(match[0]))return {reply:'You are in the customer experience. Management evidence and scanner screens are separate. Return to the entry screen to choose the management demonstration.',to:'/'};
 return {reply:match[3],to:match[1]};
}