// Deploy inside an Alexa-hosted Node.js skill or a properly configured AWS Lambda.
// ASK SDK verifies Alexa requests when invoked through a supported skill runtime.
// Do not expose handleDemoAlexaRequest directly as an unauthenticated web API.
import {SkillBuilders} from 'ask-sdk-core';
import {handleDemoAlexaRequest} from './skillLogic.mjs';
const route={
 canHandle:()=>true,
 handle(handlerInput){
  const envelope=handlerInput.requestEnvelope;
  const attrs=handlerInput.attributesManager.getSessionAttributes() || {};
  const result=handleDemoAlexaRequest({...envelope,session:{...envelope.session,attributes:attrs}});
  handlerInput.attributesManager.setSessionAttributes(result.sessionAttributes || {});
  const text=result.response.outputSpeech.text;
  const builder=handlerInput.responseBuilder.speak(text);
  if(result.response.shouldEndSession)builder.withShouldEndSession(true);
  else builder.reprompt(result.response.reprompt?.outputSpeech?.text || 'Say next step or help.');
  return builder.getResponse();
 }
};
export const handler=SkillBuilders.custom().addRequestHandlers(route).lambda();
