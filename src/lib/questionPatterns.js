// Local, aggregate-only question feedback. Never store transcripts, tracking IDs or answers.
const KEY='rgc.guide-question-categories.v1';
const CATEGORY_MAP={
 explainPlatform:'platform',explainFeature:'navigation',navigateToFeature:'navigation',
 explainCurrentScreen:'navigation',explainFeatures:'features',explainWorkflow:'workflow',
 explainCaseRecovery:'case-recovery',findPackage:'package',getLastVerifiedHandoff:'package',
 findScanExceptions:'exceptions',validatePackageLoading:'scans',listActiveCameras:'cameras',
 openEvidenceClip:'evidence',createInvestigation:'cases',conversation:'general',
 explainVoice:'voice',getLoadingManifest:'scans'
};
export function rememberQuestionType(tool){
 if(typeof window==='undefined')return;
 try{
  const category=CATEGORY_MAP[tool]||'other';
  const state=JSON.parse(localStorage.getItem(KEY)||'{}');
  const safe=state&&typeof state==='object'&&!Array.isArray(state)?state:{};
  safe[category]=Math.min(10000,Math.max(0,Number(safe[category])||0)+1);
  localStorage.setItem(KEY,JSON.stringify(safe));
 }catch{/* private browsing may disallow storage */}
}
export function questionPatterns(){
 if(typeof window==='undefined')return {};
 try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return Object.fromEntries(Object.entries(x).filter(([k,v])=>/^[a-z-]{2,30}$/.test(k)&&Number.isFinite(v)));}catch{return {};}
}
export function clearQuestionPatterns(){try{localStorage.removeItem(KEY);}catch{}}