// Color Factory game - sort colored blobs into matching bins
const colors = { red:'rgba(255,107,107,1)', blue:'rgba(91,193,255,1)', yellow:'rgba(255,217,102,1)', green:'rgba(127,227,176,1)' };
const colorNames = ['red','blue','yellow','green'];

let blobs = [], score = 0, level = 0, gameRunning = true;

const cvs = document.getElementById('cv');
const ctx = cvs.getContext('2d');
const promptEl = document.getElementById('prompt');
const toast = document.getElementById('toast');
const progress = document.getElementById('prog');

const buddyId = new URLSearchParams(location.search).get('buddy') || 'pip';
const buddy = BUDDIES.find(b => b.id === buddyId) || BUDDIES[0];

const BOUNCE_AMT = 3;

function drawBin(x, color, label) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 20, 300, 80, 180, 12);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 20, 300, 80, 180, 12);
  ctx.fillStyle = color;
  ctx.fillRect(x, 270, 100, 35, 12);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawBuddyAtBottom() {
  const t = 0;
  drawBuddy(ctx, buddy, 'happy', t);
}

function drawScene() {
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  colorNames.forEach((name, i) => {
    drawBin(60 + i * 130, colors[name], name);
  });
  drawBuddyAtBottom();
  blobs.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function newBlob(colorName) {
  return {
    x: 60 + Math.random() * 460,
    y: 60,
    r: 22,
    color: colors[colorName],
    name: colorName,
    falling: true,
    vx: (Math.random() - 0.5) * 4,
    vy: 4 + Math.random() * 3
  };
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1200);
}

function gameLoop() {
  if (!gameRunning) return;
  progress.style.width = Math.min(100, level * 8) + '%';

  // Clear with fading effect
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  // Draw bins and buddy
  colorNames.forEach((name, i) => drawBin(60 + i * 130, colors[name], name));
  drawBuddyAtBottom();

  // Update blobs
  blobs.forEach(b => {
    b.y += b.vy;
    b.x += b.vx;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Check if landed in bin area
    if (b.y + b.r > 300 && b.falling) {
      const binIdx = Math.floor((b.x - 60) / 130);
      if (binIdx >= 0 && binIdx < 4) {
        const binColor = colorNames[binIdx];
        if (b.name === binColor) {
          score++;
          document.getElementById('score').textContent = score;
          showToast('Correct! 🎉');
          cvs.classList.add('bounce');
          setTimeout(() => cvs.classList.remove('bounce'), 300);
          if (score >= level) {
            level++;
            setTimeout(startLevel, 800);
          }
        } else {
          showToast(`That's the ${binColor} bin!`);
        }
        b.falling = false;
      } else {
        b.y -= 30; // bounced back
      }
    }
  });

  // Remove landed blobs
  blobs = blobs.filter(b => b.falling || b.y < 300);

  // Spawn new blob
  if (blobs.length === 0) {
    const color = colorNames[Math.floor(Math.random() * 4)];
    blobs.push(newBlob(color));
    promptEl.textContent = `Can you find the ${color} bin?`;
  }

  requestAnimationFrame(gameLoop);
}

function startLevel() {
  blobs = [];
  score = 0;
  document.getElementById('score').textContent = score;
  promptEl.textContent = 'Ready? Color Factory starts now! 🎨';
}

// Clickable bins
const binsContainer = document.getElementById('bins');
colorNames.forEach((name, i) => {
  const bin = document.createElement('div');
  bin.className = 'bin';
  bin.dataset.color = name;
  bin.style.cssText = `
    width: 80px; height: 80px; border-radius: 50%; margin: auto;
    cursor: pointer; border: 4px solid ${colors[name]}; background: #fff;
    display: flex; align-items: center; justify-content: center;
  `;
  bin.innerHTML = `<span style="font-size: 28px;">${name === 'red' ? '🔴' :
    name === 'blue' ? '🔵' :
    name === 'yellow' ? '🟡' : '🟢'}</span>`;
  bin.onclick = () => {
    blobs.forEach(b => {
      if (b.name === name && b.falling) {
        const idx = colorNames.indexOf(name);
        b.x = 150 + idx * 130 + 40;
        b.y = 260;
        b.falling = false;
        b.vx = 0;
        b.vy = 0;
        showToast('Great sorting! ✨');
      }
    });
  };
  binsContainer.appendChild(bin);
});

startLevel();
gameLoop();