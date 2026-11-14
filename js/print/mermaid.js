// The mermaid coloring page, drawn in a softer, hand-drawn style: flowing curves, big shiny eyes, rounded lines.
import { INK, lockShape, smoothClosed, smoothLine } from './draw.js';

const W = 650;
const R = (w = 4) => `class="region" fill="#fff" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const P = (d, w) => `<path ${R(w)} d="${d}"/>`;
const L = (d, w = 2.6) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const C = (x, y, r, w) => `<circle ${R(w)} cx="${x}" cy="${y}" r="${r}"/>`;
/** Mirror an absolute path (M/C/Q/L/Z with x,y pairs) left-to-right around the middle of the picture. */
const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, (m, x, y) => `${W - +x} ${y}`);
const both = (d, w) => P(d, w) + P(mirror(d), w);
const bothL = (d, w) => L(d, w) + L(mirror(d), w);

/** A round bubble with a shine. */
const bubble = (x, y, r) => C(x, y, r, 3) + L(`M${x - r * 0.55} ${y - r * 0.05} C${x - r * 0.55} ${y - r * 0.45} ${x - r * 0.25} ${y - r * 0.6} ${x + r * 0.05} ${y - r * 0.58}`, 2.2);

export function mermaidPicture() {
  let o = '';
  // bubbles all around
  for (const [x, y, r] of [[70, 70, 22], [130, 40, 10], [580, 60, 16], [610, 130, 9], [520, 150, 26], [60, 190, 12], [95, 300, 28], [40, 380, 10],
    [600, 330, 20], [560, 420, 12], [610, 520, 26], [80, 520, 16], [130, 600, 30], [470, 260, 10], [175, 140, 14], [455, 70, 12]]) o += bubble(x, y, r);

  // sea floor, seaweed, shells, starfish
  o += P('M0 720 C80 700 150 712 230 726 C320 742 420 704 520 712 C580 716 620 726 650 722 L650 800 L0 800 Z', 3.5);
  for (const [spine, w] of [[[[40, 726], [28, 680], [46, 630], [30, 580], [44, 540]], 26], [[[82, 726], [96, 670], [80, 620], [100, 572]], 22],
    [[[600, 726], [612, 676], [594, 626], [612, 572], [598, 530]], 26], [[[566, 726], [552, 684], [568, 640], [552, 604]], 20]]) {
    o += P(lockShape(spine, w, 4), 3.4) + smoothLine(spine.slice(0, -1), 2);
  }
  { // a starfish with soft, rounded arms
    const sx = 205, sy = 758, pts = [];
    for (let i = 0; i < 10; i++) { const a = (i * 36 - 90) * Math.PI / 180, r = i % 2 ? 14 : 34; pts.push([sx + Math.cos(a) * r, sy + Math.sin(a) * r]); }
    o += P(smoothClosed(pts), 3);
    for (let i = 0; i < 5; i++) { const a = (i * 72 - 90) * Math.PI / 180; o += `<circle cx="${(sx + Math.cos(a) * 17).toFixed(1)}" cy="${(sy + Math.sin(a) * 17).toFixed(1)}" r="2.4" fill="${INK}"/>`; }
  }
  o += P('M470 770 C468 742 500 730 520 744 C540 730 572 742 570 770 C550 778 490 778 470 770 Z', 3) + L('M496 768 C498 752 506 744 520 742 M520 742 C534 744 542 752 544 768', 2.2);

  // flowing hair: a soft mass behind, then wavy locks that taper into curls
  const mx = (pts) => pts.map(([x, y]) => [W - x, y]);
  o += P(smoothClosed([[325, 116], [396, 130], [440, 186], [452, 260], [446, 340], [462, 420], [440, 500], [400, 520], [325, 420], [250, 520], [210, 500], [188, 420], [204, 340], [198, 260], [210, 186], [254, 130]]), 4);
  const locks = [
    [[[296, 196], [244, 220], [214, 264], [222, 330], [196, 392], [190, 452], [206, 500], [186, 548], [160, 570]], 78, 0],
    [[[292, 214], [266, 262], [262, 322], [244, 384], [248, 440], [264, 488], [248, 532], [230, 556]], 56, 0],
    [[[276, 196], [220, 214], [180, 262], [172, 324], [150, 380], [144, 436], [124, 480], [100, 496]], 52, 0],
  ];
  for (const [spine, w0, w1] of locks) {
    o += P(lockShape(spine, w0, w1), 3.6) + P(lockShape(mx(spine).map(([x, y], i) => [x + (i % 2 ? 6 : -4), y + (i > 3 ? 8 : 0)]), w0, w1), 3.6);
    const inner = spine.slice(1, -2).map(([x, y], i) => [x + (i % 2 ? 5 : -3), y]);
    o += smoothLine(inner, 2.2) + smoothLine(mx(inner).map(([x, y]) => [x + 4, y + 6]), 2.2);
  }
  // tail (behind the body), with scales and a big fin
  const tail = 'M300 432 C284 492 292 552 322 602 C346 642 376 660 400 668 L412 642 C392 628 372 600 360 560 C348 518 352 472 350 432 Z';
  o += P('M404 662 C434 690 478 726 540 722 C522 694 516 662 540 626 C496 618 452 622 410 642 Z', 4);
  o += L('M416 650 C450 652 490 650 528 636 M412 658 C452 672 490 690 528 712 M414 654 C456 662 500 668 532 674', 2.4);
  o += P(tail, 4);
  o += `<clipPath id="tailclip"><path d="${tail}"/></clipPath><g clip-path="url(#tailclip)">`;
  for (let row = 0; row < 11; row++) {
    const y = 456 + row * 20, shift = row * 6;
    let d = '';
    for (let x = 270 + shift + (row % 2) * 10; x < 420; x += 20) d += `M${x} ${y} C${x + 2} ${y + 13} ${x + 18} ${y + 13} ${x + 20} ${y} `;
    o += L(d, 2.2);
  }
  o += '</g>';
  o += P('M298 430 C312 446 338 446 352 430 C346 452 336 458 325 448 C314 458 304 452 298 430 Z', 3.5);

  // arms, body, shell top
  // slim arms bending in, hands resting on the tail
  const arm = [[292, 336], [262, 374], [256, 414], [284, 444]];
  o += P(lockShape(arm, 24, 16), 3.5) + P(lockShape(arm.map(([x, y]) => [W - x, y]), 24, 16), 3.5);
  o += P(smoothClosed([[286, 436], [300, 434], [308, 444], [300, 454], [288, 452]]), 3) + P(smoothClosed([[364, 436], [350, 434], [342, 444], [350, 454], [362, 452]]), 3);
  o += P(smoothClosed([[292, 332], [325, 324], [358, 332], [362, 370], [352, 404], [356, 434], [325, 440], [294, 434], [298, 404], [288, 370]]), 3.5);
  o += L('M322 408 C324 414 326 414 328 408', 2);
  o += both('M280 362 C282 338 312 332 325 352 C318 372 294 378 280 362 Z', 3.5);
  o += bothL('M290 364 C292 352 298 344 306 340 M300 368 C302 358 308 350 316 346 M312 368 C314 362 318 358 322 356', 2);
  o += P('M312 294 C312 310 310 318 304 326 L346 326 C340 318 338 310 338 294 Z', 3.5);

  // face
  o += P('M262 212 C262 160 388 160 388 212 C388 264 358 302 325 304 C292 302 262 264 262 212 Z', 4);
  // big shiny eyes
  for (const x of [298, 352]) {
    o += `<ellipse ${R(3)} cx="${x}" cy="232" rx="17" ry="20"/>`;
    o += `<circle ${R(2.5)} cx="${x}" cy="236" r="14"/><circle cx="${x}" cy="237" r="7.5" fill="${INK}"/>`;
    o += `<circle cx="${x + 5}" cy="229" r="4.6" fill="#fff"/><circle cx="${x - 5}" cy="243" r="2.4" fill="#fff"/>`;
    o += L(`M${x - 18} 223 C${x - 12} 209 ${x + 12} 208 ${x + 19} 221`, 4.6);
  }
  o += L('M279 221 L271 215 M281 216 L275 208 M371 221 L379 215 M369 216 L375 208', 2.4); // lashes
  o += L('M286 198 C292 193 304 193 310 197 M340 197 C346 193 358 193 364 198', 2.8); // brows
  o += L('M322 262 C324 265 327 265 329 262', 2.4) + L('M313 277 C320 284 331 284 338 277', 2.8);
  o += `<ellipse ${R(2)} cx="280" cy="266" rx="11" ry="7"/><ellipse ${R(2)} cx="370" cy="266" rx="11" ry="7"/>`;

  // bangs over the forehead
  o += P('M258 220 C252 150 302 120 330 124 C378 128 398 170 392 222 C380 196 360 178 336 176 C344 188 344 198 336 206 C320 186 296 182 276 196 C268 204 262 212 258 220 Z', 4);
  o += L('M300 140 C292 156 286 172 280 190 M350 140 C362 156 372 174 380 198 M326 128 C334 140 338 156 336 172', 2.2);

  // flower in her hair
  const fx = 268, fy = 162;
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * Math.PI / 180, b = a + 0.5, c = a - 0.5;
    const tip = [fx + Math.cos(a) * 30, fy + Math.sin(a) * 30], s1 = [fx + Math.cos(b) * 20, fy + Math.sin(b) * 20], s2 = [fx + Math.cos(c) * 20, fy + Math.sin(c) * 20];
    o += P(`M${fx} ${fy} C${s1.map((v) => v.toFixed(1)).join(' ')} ${tip.map((v) => v.toFixed(1)).join(' ')} ${tip.map((v) => v.toFixed(1)).join(' ')} C${tip.map((v) => v.toFixed(1)).join(' ')} ${s2.map((v) => v.toFixed(1)).join(' ')} ${fx} ${fy} Z`, 3);
  }
  o += C(fx, fy, 8, 3);

  // a little fish friend
  o += P('M470 360 C490 336 534 336 548 360 C534 384 490 384 470 360 Z', 3.5) + P('M548 360 C560 344 574 340 580 344 C574 356 574 364 580 376 C574 380 560 376 548 360 Z', 3.5);
  o += `<circle cx="490" cy="356" r="4" fill="${INK}"/>` + L('M504 346 C510 354 510 366 504 374 M486 368 C490 371 494 371 497 368', 2.2);
  return o;
}
