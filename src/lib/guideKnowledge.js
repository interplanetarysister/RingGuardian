// Curated answers remain available when the live AI endpoint cannot be used.
// Statistics always name the source and distinguish theft from other losses.
export function guideKnowledgeAnswer(question,{role='customer',stepTitle='',instruction=''}={}){
 const q=String(question||'').toLowerCase();
 if(/\b(never recover(?:ed)?|never found|unresolved|never resolved|never get.*back)\b/.test(q))
  return 'There is no reliable nationwide count here for packages never recovered or complaints never resolved. Theft reports, refunds, replacements and finding the original package measure different things.';
 if(/\b(how many|statistic|annual|per year|percentage|percent|rate)\b/.test(q)&&/\b(stolen|theft|package|complaint|report)\b/.test(q))
  return 'Security.org’s 2025 survey estimated roughly 37 million packages stolen annually in the United States. Among surveyed theft victims, 64 percent reported their latest theft to a retailer and 62 percent to a carrier. These categories overlap and do not describe all lost shipments.';
 if(/\b(stolen|theft|porch pirates?)\b/.test(q)&&/\b(prove|know|was it|evidence)\b/.test(q))
  return 'A missing package or a delivered scan cannot by itself prove theft. Compare the recorded status and available evidence, then prepare a report describing what you actually observed.';
 if(/\b(alexa|model|artificial intelligence|who are you|what ai)\b/.test(q))
  return 'I am '+(role==='management'?'Piper, the management guide':'Amy, the customer guide')+'. The optional conversational model is Meta Llama 3.1 8B Instruct FP8 via Cloudflare Workers AI. The walkthrough is an Alexa-style simulation, not a registered Alexa+ voice integration.';
 if(role==='customer' && /\b(ups|fedex|usps|dhl|ontrac|other carrier|non.amazon|courier)\b/.test(q))
  return 'On the Customer page, open Non-Amazon package updates. Add a tracking notice from email or copy it from your carrier portal, confirm the carrier and tracking number, then select the parcel. You can prepare a Word complaint and attach your own doorbell clip with the reported delivery time window. Download the evidence package and send it through the carrier’s official claims page yourself.';
 if(role==='customer' && /\b(email|inbox|gmail|outlook|shipping update|tracking update|connect account)\b/.test(q))
  return 'Non-Amazon deliveries can be added from an exported shipping email or copied carrier status. Optional Gmail and Outlook account linking requires a registered provider connection, your sign-in and explicit consent. No mailbox is monitored by default, and carrier portal accounts are not automatically synchronized.';
 if(role==='customer' && /\b(step one|step 1|first section|yellow|select package|which package)\b/.test(q))
  return 'Start with section one, the sunshine-yellow Select Package panel. Choose a linked fictional parcel and optionally name it. That unlocks the orange-red detail section.';
 if(role==='customer' && /\b(step two|step 2|orange|compile details|delivery window|time slot)\b/.test(q))
  return 'In the orange-red second section, choose the issue and check the carrier-reported delivery time slot. Your explanation is optional. Continue to the teal evidence review.';
 if(role==='customer' && /\b(step three|step 3|turquoise|teal|gather evidence|watch footage|video preview)\b/.test(q))
  return 'Section three is teal. Play the simulated Ring-style scene associated with the selected package, choose whether to attach it, then confirm you reviewed it. It is synthetic, not live Ring footage.';
 if(role==='customer' && /\b(step four|step 4|green|submit investigation|send investigation)\b/.test(q))
  return 'The green fourth section shows the package, issue, time window, and selected synthetic video. Select Submit Investigation. The internal demo management queue receives the complaint; no outside carrier or police report is filed.';
 if(role==='management' && /\b(step one|step 1|yellow|start|what first|complaints)\b/.test(q))
  return 'Open yellow section one, Review Customer Reports, and inspect the internal fictional complaints and any simulated Ring evidence receipts. Then continue to shipment review.';
 if(role==='management' && /\b(step two|step 2|orange|follow shipment|package history)\b/.test(q))
  return 'Section two is orange-red. Open Hub overview or Package history, inspect the fictional tracking record, then return to Management to unlock scanner and camera evidence.';
 if(role==='management' && /\b(step three|step 3|teal|turquoise|match camera|scanners?)\b/.test(q))
  return 'Section three is teal. Open Scanner stations and Camera evidence, then compare parcel identity, timestamps and source. Do not treat missing video as proof of non-delivery.';
 if(role==='management' && /\b(step four|step 4|green|investigations?)\b/.test(q))
  return 'Section four is green. Open Investigations, review the fictional findings and audit trail, and return. The demo does not automatically recover parcels or resolve live cases.';
 if(/\b(police|insurance|claim|refund|complaint|report)\b/.test(q)&&role==='customer')
  return 'On the Customer page, choose a paired fictional shipment, optionally nickname it, select the issue and synthetic Ring-style video, then press Submit report and selected evidence. The report and playable simulated scene go to the Ring Guardian demo management queue. Step 4 checks My submitted reports for the reference and video receipt. No police, insurer, carrier or retailer is contacted; the separate Word report is for your own use.';
 if(/\b(scan|truck|warehouse|manifest|custody|camera evidence|worker)\b/.test(q)&&role==='management')
  return 'In Management, use Scanner stations for handoff records and Camera evidence for timestamps. Compare the fictional records before investigating an exception. Opening a screen does not confirm that a package was actually handled.';
 if(/\b(how.*ship|shipping process|delivery process)\b/.test(q))
  return 'A shipment normally passes through acceptance, sorting, transportation, loading and last-mile delivery. Tracking shows recorded milestones; evidence can help investigate any gap between them.';
 if(/\b(what next|what should i do|where do i start|i am lost|confused)\b/.test(q))
  return stepTitle && instruction ? 'You are on '+stepTitle+'. '+instruction:'Choose a sample task in your role’s walkthrough. I can explain the next action one step at a time.';
 return null;
}