// Collects every line the games can say into tools/lines.json (run with the site served on :8090).
// Needs Playwright:  node tools/collect-lines.mjs
import { chromium } from 'playwright';
import fs from 'fs';
const b=await chromium.launch(); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8090/'); await p.waitForTimeout(300);
const res=await p.evaluate(async()=>{
  const { games } = await import('/js/games/index.js');
  const { PRAISE, RETRY, finishLine } = await import('/js/core/choice-game.js');
  const { STICKERS } = await import('/js/core/stickers.js');
  const lines=new Set(); const grow=[];
  const add=(x)=>{ if(Array.isArray(x)) x.forEach(add); else if(typeof x==='string' && x.trim()) lines.add(x); };
  [...PRAISE,...RETRY].forEach(add); add(finishLine(null)); STICKERS.forEach(s=>add(finishLine(s)));
  for (const g of games.filter(x=>x.id!=='sounds')) {
    let before=0;
    for (let d=0; d<3; d++) for (let lv=1; lv<=g.maxLevels[d]; lv++) {
      const hist=[];
      for (let i=0;i<4000;i++) {
        const r=g.makeRound(lv,hist,d); hist.push(r.key);
        add(r.say); add(r.retrySay); add(r.praise);
        if (r.advance) { const v=document.createElement('div'); r.render?.(v); for(;;){ const nx=r.advance(v); if(!nx) break; add(nx.say); add(r.say); add(r.retrySay);} }
      }
    }
    grow.push([g.id,lines.size-before]);
  }
  return {lines:[...lines], grow};
});
fs.writeFileSync(new URL('./lines.json', import.meta.url), JSON.stringify(res.lines.sort(),null,0));
console.log('unique lines:',res.lines.length, 'errors:',errs);
const chars=res.lines.reduce((n,l)=>n+l.length,0); console.log('total chars',chars);
await b.close();
