const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

const gravity = 0.6;

// --- CONFIGURACIÓN MATRIX ---
const mCanvas = document.getElementById('matrixCanvas');
const mCtx = mCanvas.getContext('2d');

function resizeMatrixCanvas() {
    mCanvas.width = window.innerWidth;
    mCanvas.height = window.innerHeight;
}
resizeMatrixCanvas();
window.addEventListener('resize', resizeMatrixCanvas);

const matrixChars = ['1', '0'];
const fontSize = 16;
let columns = mCanvas.width / fontSize;
let dropPositions = Array(Math.floor(columns)).fill(1);

function drawMatrixBackground() {
    mCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
    mCtx.fillStyle = '#00ff46'; 
    mCtx.font = fontSize + 'px monospace';

    if (dropPositions.length !== Math.floor(mCanvas.width / fontSize)) {
        columns = mCanvas.width / fontSize;
        dropPositions = Array(Math.floor(columns)).fill(1);
    }

    for (let i = 0; i < dropPositions.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const x = i * fontSize;
        const y = dropPositions[i] * fontSize;
        mCtx.fillText(char, x, y);
        if (y > mCanvas.height && Math.random() > 0.975) {
            dropPositions[i] = 0;
        }
        dropPositions[i]++;
    }
}
// ----------------------------

const player = new Fighter({
    position: { x: 150, y: 0 },
    velocity: { x: 0, y: 0 },
    color: '#2980b9', 
    offset: { x: 40, y: 0 }
});

const enemy = new Fighter({
    position: { x: 800, y: 0 },
    velocity: { x: 0, y: 0 },
    color: '#c0392b', 
    offset: { x: 40, y: 0 },
    isAI: true 
});

const keys = {
    a: { pressed: false },
    d: { pressed: false }
};

let timer = 99;
let timerId;
let gameActive = true;

function decreaseTimer() {
    if (timer > 0 && gameActive) {
        timerId = setTimeout(decreaseTimer, 1000);
        timer--;
        document.getElementById('timer').innerText = timer;
    }
    if (timer === 0) {
        determineWinner({ player, enemy, timerId });
    }
}

function determineWinner({ player, enemy, timerId }) {
    clearTimeout(timerId);
    gameActive = false;
    playSound('ko'); 

    const textScreen = document.getElementById('game-over-text');
    const restartBtn = document.getElementById('restart-btn');
    
    if (player.health === enemy.health) {
        textScreen.innerText = 'TIEMPO FUERA - EMPATE';
    } else if (player.health > enemy.health) {
        textScreen.innerText = '¡VICTORIA!';
        textScreen.style.color = '#2ecc71';
    } else {
        textScreen.innerText = 'FIN DEL JUEGO (K.O.)';
        textScreen.style.color = '#e74c3c';
    }
    restartBtn.style.display = 'block';
}

function animate() {
    window.requestAnimationFrame(animate);
    drawMatrixBackground();

    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 4); 

    player.update(ctx, gravity, canvas.height, enemy);
    enemy.update(ctx, gravity, canvas.height, player);

    player.velocity.x = 0;
    if (keys.a.pressed && player.lastKey === 'a') {
        player.velocity.x = -6;
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 6;
    }

    if (gameActive) {
        // --- COLISIONES DE GOLPES BÁSICOS ---
        if (rectangularCollision({ rectangle1: player, rectangle2: enemy }) && player.isAttacking && player.attackType !== 'special') {
            player.isAttacking = false;
            let damage = player.attackType === 'kick' ? 12 : 7; 
            enemy.health -= damage;
            player.energy = Math.min(100, player.energy + 20); // 5 golpes para cargar el 100%
            
            playSound('hit'); 
            document.getElementById('enemy-health').style.width = Math.max(0, enemy.health) + '%';
            document.getElementById('player-energy').style.width = player.energy + '%';
        }

        if (rectangularCollision({ rectangle1: enemy, rectangle2: player }) && enemy.isAttacking && enemy.attackType !== 'special') {
            enemy.isAttacking = false;
            let damage = enemy.attackType === 'kick' ? 14 : 9;
            player.health -= damage;
            enemy.energy = Math.min(100, enemy.energy + 20);
            
            playSound('hit'); 
            document.getElementById('player-health').style.width = Math.max(0, player.health) + '%';
            document.getElementById('enemy-energy').style.width = enemy.energy + '%';
        }

        // --- COLISIONES DE BOLA ESPECIAL (CÁLCULO MATEMÁTICO DE 1 HIT) ---
        // Bola del Jugador impactando a la IA
        if (player.specialBall.isActive) {
            // Verificar si el centro de la bola está dentro del rectángulo del enemigo
            if (player.specialBall.x >= enemy.position.x && 
                player.specialBall.x <= enemy.position.x + enemy.width &&
                player.specialBall.y >= enemy.position.y && 
                player.specialBall.y <= enemy.position.y + enemy.height) {
                
                enemy.health -= 20; // Exactamente el 20% de la vida máxima
                player.specialBall.isActive = false; // Se destruye al meter el hit único
                playSound('hit');
                document.getElementById('enemy-health').style.width = Math.max(0, enemy.health) + '%';
            }
        }

        // Bola de la IA impactando al Jugador
        if (enemy.specialBall.isActive) {
            if (enemy.specialBall.x >= player.position.x && 
                enemy.specialBall.x <= player.position.x + player.width &&
                enemy.specialBall.y >= player.position.y && 
                enemy.specialBall.y <= player.position.y + player.height) {
                
                player.health -= 20; 
                enemy.specialBall.isActive = false; 
                playSound('hit');
                document.getElementById('player-health').style.width = Math.max(0, player.health) + '%';
            }
        }

        if (player.health <= 0 || enemy.health <= 0) {
            determineWinner({ player, enemy, timerId });
        }
    }
}

decreaseTimer();
animate();

function restartGame() {
    gameActive = true;
    timer = 99;
    
    player.health = 100;
    enemy.health = 100;
    player.energy = 0;
    enemy.energy = 0;
    
    document.getElementById('player-health').style.width = '100%';
    document.getElementById('enemy-health').style.width = '100%';
    document.getElementById('player-energy').style.width = '0%';
    document.getElementById('enemy-energy').style.width = '0%';
    document.getElementById('timer').innerText = timer;

    player.position = { x: 150, y: 0 };
    player.velocity = { x: 0, y: 0 };
    player.specialBall.isActive = false;
    
    enemy.position = { x: 800, y: 0 };
    enemy.velocity = { x: 0, y: 0 };
    enemy.specialBall.isActive = false;

    document.getElementById('game-over-text').innerText = '¡ROUND 1!';
    document.getElementById('game-over-text').style.color = '#fff';
    document.getElementById('restart-btn').style.display = 'none';

    decreaseTimer();
}

window.addEventListener('keydown', (event) => {
    if (!gameActive) return;
    
    switch (event.key.toLowerCase()) {
        case 'd':
            keys.d.pressed = true;
            player.lastKey = 'd';
            break;
        case 'a':
            keys.a.pressed = true;
            player.lastKey = 'a';
            break;
        case 'w':
            if (player.velocity.y === 0) {
                player.velocity.y = -15;
                playSound('jump'); 
            }
            break;
        case ' ':
            if (!player.isAttacking) {
                player.attackType = 'punch';
                player.attack();
            }
            break;
        case 'e': 
            if (!player.isAttacking) {
                player.attackType = 'kick';
                player.attack();
            }
            break;
        case 'q': 
            player.fireSpecial();
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'd': keys.d.pressed = false; break;
        case 'a': keys.a.pressed = false; break;
    }
});