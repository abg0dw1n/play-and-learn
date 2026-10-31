// Counting Buddy game - count the treats!
const params = new URLSearchParams(location.search);
const buddyId = params.get('buddy') || 'pip';
const buddy = BUDDIES.find(b => b.id === buddyId) || BUDDIES[0];

let target = 0, clicked = 0, score = 0, level = 0, gameRunning = true;
const ctx = document.getElementById('cv').getContext('2d');
const promptEl = document.getElementById('prompt');
const toast = document.getElementById('toast');
const prog = document.getElementById('prog');

const cvs = document.getElementById('cv');

function drawTreats() {
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  drawBuddy(ctx, buddy, 'happy', 0);
}

function startLevel() {
  level++;
  target = Math.floor(Math.random() * 5) + 1;
  clicked = 0;
  prog.style.width = Math.min(100, level * 10) + '%';
  promptEl.textContent = `Pip needs ${target} treat${target !== 1 ? 's' : ''}! How many can you feed?`;
  drawTreats();
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1200);
}

function nextLevel() {
  if (clicked === target) {
    score++;
    document.getElementById('score').textContent = score;
    showToast('Yay! Correct!');
    cvs.classList.add('bounce');
    setTimeout(() => cvs.classList.remove('bounce'), 300);
    setTimeout(startLevel, 1000);
  } else {
    showToast(`Pip is sad... it was ${target}`);
    setTimeout(() => { startLevel(); }, 1500);
  }
}

// Treat buttons
function makeTreats() {
  const container = document.getElementById('treats');
  container.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const btn = document.createElement('button');
    btn.textContent = '🍭';
    btn.className = 'treat-btn';
    btn.style.fontSize = '32px';
    btn.style.margin = '8px';
    btn.style.padding = '14px 14px';
    btn.style.background = i < 3 ? '#ffd966' : '#fff';
    btn.style.border = '3px solid #3a3a55';
    btn.style.borderRadius = '12px';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'transform .1s';
    btn.style.boxShadow = '0 4px 0 rgba(0,0,0,.15)';
    btn.onmousedown = () => { btn.style.transform = 'scale(.95)'; };
    btn.onmouseup = () => { btn.style.transform = 'scale(1)'; };
    btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
    btn.onclick = () => {
      if (!gameRunning) return;
      clicked++;
      if (clicked <= target) {
        drawTreats();
        if (clicked === target) nextLevel();
      } else {
        showToast(`Too many! It was ${target}`);
        clicked = target;
      }
    };
    container.appendChild(btn);
  }
}

startLevel();
makeTreats();

// Spacebar to add a treat
document.addEventListener('keydown', e => {
  if (e.key === ' ') {
    const btn = document.querySelector('.treat-btn');
    if (btn) btn.click();
  }
});