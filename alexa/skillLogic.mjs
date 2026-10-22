// Alexa Skills Kit custom-skill request logic, pure and testable.
// The developer portal must configure a verified Alexa endpoint before this is deployable.
export const WALKTHROUGH = Object.freeze([
 'A dock worker starts a simulated, hypothetical wearable camera session.',
 'A package is scanned and matched to its tracking identifier.',
 'The employee loads the package into the assigned truck, and the scan and camera timestamps are linked.',
 'A driver accepts custody and the simulated delivery route begins.',
 'Location updates identify the delivery stop; location alone cannot prove which doorstep received the parcel.',
 'The driver drop-off camera view is compared with the intended address, and a human reviewer decides whether more investigation is needed.'
]);
const say = (speech, close=false, reprompt='You can say next step, previous step, or start over.') => ({
 version:'1.0',
 response:{outputSpeech:{type:'PlainText',text:speech},
 ...(close?{shouldEndSession:true}:{reprompt:{outputSpeech:{type:'PlainText',text:reprompt}},shouldEndSession:false})}
});
function response(speech,index,close=false){return {...say(speech,close),sessionAttributes:{tourIndex:index,simulation:true}};}
export function handleDemoAlexaRequest(body){
 const type=body?.request?.type || '';
 const name=body?.request?.intent?.name || '';
 const old=Number(body?.session?.attributes?.tourIndex ?? 0);
 const index=Number.isInteger(old)?Math.max(0,Math.min(WALKTHROUGH.length-1,old)):0;
 if(type==='LaunchRequest'||name==='StartTourIntent'||name==='AMAZON.StartOverIntent')
   return response('Welcome to Ring Guardian. This is a simulated package evidence walkthrough, not a live Ring camera or Amazon delivery service. Step one. '+WALKTHROUGH[0],0);
 if(name==='NextStepIntent'||name==='AMAZON.NextIntent'){
   const next=Math.min(WALKTHROUGH.length-1,index+1);
   return response('Step '+(next+1)+' of '+WALKTHROUGH.length+'. '+WALKTHROUGH[next]+(next===WALKTHROUGH.length-1?' The walkthrough is complete.':' Say next step to continue.'),next);
 }
 if(name==='PreviousStepIntent'||name==='AMAZON.PreviousIntent') {
   const previous=Math.max(0,index-1);
   return response('Step '+(previous+1)+'. '+WALKTHROUGH[previous],previous);
 }
 if(name==='RepeatStepIntent'||name==='AMAZON.RepeatIntent')return response('Step '+(index+1)+'. '+WALKTHROUGH[index],index);
 if(name==='AMAZON.StopIntent'||name==='AMAZON.CancelIntent'||type==='SessionEndedRequest')return response('Goodbye.',index,true);
 if(name==='AMAZON.HelpIntent')return response('This demonstration follows one simulated package from loading dock to doorstep. Say next step, previous step, repeat step, or start over.',index);
 return response('I can guide the simulated Ring Guardian evidence tour. Say start over, next step, or help.',index);
}
// Production Alexa requests must be signature-verified by ASK SDK or Alexa-hosted infrastructure.
// This pure function is NOT an HTTP handler and MUST NOT be exposed directly as a public endpoint.
