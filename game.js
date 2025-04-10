const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(32, 32);

const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');
holdCtx.scale(32, 32);

const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
nextCtx.scale(32, 32);

const colors = {
  'I': '#00ffff',
  'J': '#0000ff',
  'L': '#ff7f00',
  'O': '#ffff00',
  'S': '#00ff00',
  'T': '#800080',
  'Z': '#ff0000',
  0: '#000000'
};

const matrixes = {
  'I': [
    [0, 0, 0, 0],
    ['I', 'I', 'I', 'I'],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  'J': [
    ['J', 0, 0],
    ['J', 'J', 'J'],
    [0, 0, 0]
  ],
  'L': [
    [0, 0, 'L'],
    ['L', 'L', 'L'],
    [0, 0, 0]
  ],
  'O': [
    ['O', 'O'],
    ['O', 'O']
  ],
  'S': [
    [0, 'S', 'S'],
    ['S', 'S', 0],
    [0, 0, 0]
  ],
  'T': [
    [0, 'T', 0],
    ['T', 'T', 'T'],
    [0, 0, 0]
  ],
  'Z': [
    ['Z', 'Z', 0],
    [0, 'Z', 'Z'],
    [0, 0, 0]
  ]
};

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

function drawGrid(ctx, width, height) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 0.05;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.strokeRect(x, y, 1, 1);
    }
  }
}

function drawMatrix(matrix, offset, ctx = context) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 0.05;
        ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
  }
  dropCounter = 0;
}

function playerHardDrop() {
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  merge(arena, player);
  playerReset();
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerReset() {
  if (queue.length < 7) queue.push(...shuffle('IJLOSTZ'.split('')));
  const type = queue.shift();
  player.matrix = matrixes[type];
  player.pos.y = 0;
  player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
  usedHold = false;
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function draw() {
  context.fillStyle = '#111';
  context.fillRect(0, 0, 10, 20);
  drawGrid(context, 10, 20);
  drawMatrix(arena, {x: 0, y: 0});
  drawMatrix(player.matrix, player.pos);
  drawGhost();
  drawHold();
  drawNext();
}

function drawGhost() {
  const ghostY = player.pos.y;
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  context.globalAlpha = 0.3;
  drawMatrix(player.matrix, player.pos);
  context.globalAlpha = 1.0;
  player.pos.y = ghostY;
}

function drawHold() {
  holdCtx.clearRect(0, 0, 4, 4);
  drawGrid(holdCtx, 4, 4);
  if (hold.matrix) drawMatrix(hold.matrix, {x: 0.5, y: 0.5}, holdCtx);
}

function drawNext() {
  nextCtx.clearRect(0, 0, 4, 16);
  drawGrid(nextCtx, 4, 16);
  for (let i = 0; i < 5; i++) {
    const nextType = queue[i];
    const matrix = matrixes[nextType];
    drawMatrix(matrix, {x: 0.5, y: i * 3.5 + 0.5}, nextCtx);
  }
}

function holdPiece() {
  if (usedHold) return;
  const current = player.matrix;
  if (!hold.matrix) {
    hold.matrix = current;
    playerReset();
  } else {
    [hold.matrix, player.matrix] = [player.matrix, hold.matrix];
    player.pos.y = 0;
    player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
  }
  usedHold = true;
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') playerMove(-1);
  else if (e.key === 'ArrowRight') playerMove(1);
  else if (e.key === 'ArrowDown') playerDrop();
  else if (e.key === 'ArrowUp') playerHardDrop();
  else if (e.key === 'x' || e.key === 'X') playerRotate(-1); // 左回転
  else if (e.key === 'z' || e.key === 'Z') playerRotate(1);  // 右回転
  else if (e.key === 'c' || e.key === 'C') holdPiece();
});

const arena = createMatrix(10, 20);
const player = { pos: {x: 0, y: 0}, matrix: null };
const hold = { matrix: null };
const queue = [];
let usedHold = false;

playerReset();

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

update();
