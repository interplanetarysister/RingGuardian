// Exact command phrases only. A question containing "skip", "stop", or
// "repeat" is NOT permission to change the walkthrough state.
export function guideSpeechCommand(value) {
 const q=String(value||'').trim().toLowerCase().replace(/[.!?]+$/,'').replace(/\s+/g,' ');
 if(/^(please )?(stop|stop talking|stop speaking|stop audio|be quiet|end audio|turn off the voice)$/.test(q))return 'stop';
 if(/^(please )?(pause|pause audio|pause speaking|hold on|wait a second|wait a moment)$/.test(q))return 'pause';
 if(/^(please )?(resume|resume audio|continue speaking|keep talking|continue the audio|unpause)$/.test(q))return 'resume';
 if(/^(please )?(repeat|repeat that|repeat this step|say that again|say it again|replay|replay the instruction|repeat the instruction)$/.test(q))return 'repeat';
 if(/^(please )?(skip|skip this step|skip the step|skip the current step|next step)$/.test(q))return 'skip';
 if(/^(please )?(go back|previous step|back one step|last step)$/.test(q))return 'back';
 if(/^(please )?(start the tour|start walkthrough|start the walkthrough|begin walkthrough|begin tour|start with audio)$/.test(q))return 'start';
 if(/^(please )?(start text only|text only|turn off narration|show text only|use text only)$/.test(q))return 'text';
 if(/^(please )?(restart|restart tour|restart walkthrough|start over|begin again)$/.test(q))return 'restart';
 if(/^(where am i|what step am i on|what is the current step|where are we|what do i do next)$/.test(q))return 'context';
 if(/^(help|help me|what can i say|voice commands|available commands)$/.test(q))return 'help';
 return null;
}
export const GUIDE_COMMANDS_HELP='Say: start walkthrough, pause, resume, repeat that, skip this step, go back, what step am I on, text only, restart tour, or stop talking. You can also ask a normal question about this screen.';