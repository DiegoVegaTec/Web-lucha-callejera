const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

const gravity = 0.6;

// Array global para almacenar las partículas activas del escenario
let particles = [];

// Función para instanciar ráfagas de chispas vectoriales al impactar
function createSparks(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle({
            position: { x: x, y: y },
            velocity: {
                x: (Math.random() - 0.5) * 8,
                y: (Math.random() - 0.5) * 8
            },
            color: color
        }));
    }
}

// Función auxiliar para generar un color hexadecimal aleatorio (Variedad Visual)
function getRandomColor() {
    const letters = '3456789ABCDEF'; // Evitamos colores muy oscuros para mantener la visibilidad
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

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
    color: '#c0392b', // Color base inicial
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

    // Renderizar y limpiar partículas de chispas activas
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        } else {
            particles[i].update(ctx);
        }
    }

    player.velocity.x = 0;
    // El movimiento horizontal se restringe si el jugador está bloqueando
    if (!player.isBlocking) {
        if (keys.a.pressed && player.lastKey === 'a') {
            player.velocity.x = -6;
        } else if (keys.d.pressed && player.lastKey === 'd') {
            player.velocity.x = 6;
        }
    }

    if (gameActive) {
        // --- COLISIONES DE GOLPES BÁSICOS (Con mitigación por Bloqueo) ---
        if (rectangularCollision({ rectangle1: player, rectangle2: enemy }) && player.isAttacking && player.attackType !== 'special') {
            player.isAttacking = false;
            let damage = player.attackType === 'kick' ? 12 : 7; 
            
            if (enemy.isBlocking) damage = damage * 0.5; // Absorbe el 50% de daño al bloquear
            
            enemy.health -= damage;
            player.energy = Math.min(100, player.energy + 20); 
            
            playSound('hit'); 
            createSparks(enemy.position.x + enemy.width/2, player.attackBox.position.y, '#ffcc00'); // Chispas normales
            document.getElementById('enemy-health').style.width = Math.max(0, enemy.health) + '%';
            document.getElementById('player-energy').style.width = player.energy + '%';
        }

        if (rectangularCollision({ rectangle1: enemy, rectangle2: player }) && enemy.isAttacking && enemy.attackType !== 'special') {
            enemy.isAttacking = false;
            let damage = enemy.attackType === 'kick' ? 14 : 9;
            
            if (player.isBlocking) damage = damage * 0.5; // Absorbe el 50% de daño al bloquear
            
            player.health -= damage;
            enemy.energy = Math.min(100, enemy.energy + 20);
            
            playSound('hit'); 
            createSparks(player.position.x + player.width/2, enemy.attackBox.position.y, '#fff');
            document.getElementById('player-health').style.width = Math.max(0, player.health) + '%';
            document.getElementById('enemy-energy').style.width = enemy.energy + '%';
        }

        // --- COLISIONES DE BOLA ESPECIAL (Con ráfaga explosiva de partículas) ---
        if (player.specialBall.isActive) {
            if (player.specialBall.x >= enemy.position.x && 
                player.specialBall.x <= enemy.position.x + enemy.width &&
                player.specialBall.y >= enemy.position.y && 
                player.specialBall.y <= enemy.position.y + enemy.height) {
                
                let damage = 20;
                if (enemy.isBlocking) damage = damage * 0.5; // Mitiga poder
                
                enemy.health -= damage; 
                player.specialBall.isActive = false; 
                playSound('hit');
                createSparks(player.specialBall.x, player.specialBall.y, '#00ffff'); // Estallido de partículas cian
                document.getElementById('enemy-health').style.width = Math.max(0, enemy.health) + '%';
            }
        }

        if (enemy.specialBall.isActive) {
            if (enemy.specialBall.x >= player.position.x && 
                enemy.specialBall.x <= player.position.x + player.width &&
                enemy.specialBall.y >= player.position.y && 
                enemy.specialBall.y <= player.position.y + player.height) {
                
                let damage = 20;
                if (player.isBlocking) damage = damage * 0.5;
                
                player.health -= damage; 
                enemy.specialBall.isActive = false; 
                playSound('hit');
                createSparks(enemy.specialBall.x, enemy.specialBall.y, '#00ffff'); // Estallido de partículas cian
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
    player.isBlocking = false;
    enemy.isBlocking = false;
    particles = []; // Limpiar remanentes de partículas
    
    // Cambiar color aleatorio al enemigo en cada reinicio (Variedad Visual)
    enemy.color = getRandomColor();
    
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
        case 's': // Nueva mecánica: Mantener presionado para Activar Bloqueo
            player.isBlocking = true;
            break;
        case 'w':
            if (player.velocity.y === 0 && !player.isBlocking) {
                player.velocity.y = -15;
                playSound('jump'); 
            }
            break;
        case ' ':
            if (!player.isAttacking && !player.isBlocking) {
                player.attackType = 'punch';
                player.attack();
            }
            break;
        case 'e': 
            if (!player.isAttacking && !player.isBlocking) {
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
        case 's': // Soltar para desactivar escudo de bloqueo
            player.isBlocking = false;
            break;
    }
});