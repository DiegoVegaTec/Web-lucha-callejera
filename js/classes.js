// Clase para los efectos visuales de chispas vectoriales
class Particle {
    constructor({ position, velocity, color }) {
        this.position = { x: position.x, y: position.y };
        this.velocity = velocity;
        this.radius = Math.random() * 3 + 2;
        this.alpha = 1;
        this.color = color;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update(ctx) {
        this.draw(ctx);
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.alpha -= 0.02; // Desvanecimiento progresivo
    }
}

class Fighter {
    constructor({ position, velocity, color, offset, isAI = false }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 60;
        this.height = 150;
        this.color = color;
        this.lastKey;
        
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offset: offset,
            width: 80,
            height: 40
        };
        
        this.isAttacking = false;
        this.attackType = 'punch'; 
        this.health = 100;
        this.energy = 0; 
        this.isAI = isAI;
        this.isBlocking = false; // Nueva bandera de mitigación de daño
        
        this.facing = isAI ? 'left' : 'right';
        this.animationFrame = 0;

        this.specialBall = {
            isActive: false,
            x: 0,
            y: 0,
            radius: 20,
            speed: 12,
            direction: 1
        };
    }

    drawHumanoid(ctx) {
        if (this.velocity.x !== 0 && this.position.y >= 386) {
            this.animationFrame += 0.18;
        } else if (this.position.y < 386) {
            this.animationFrame = (this.attackType === 'kick' && this.isAttacking) ? this.animationFrame + 0.4 : 0.5;
        } else {
            this.animationFrame = 0;
        }

        const posX = this.position.x + this.width / 2;
        const posY = this.position.y;
        
        ctx.save();
        
        if (this.facing === 'left') {
            ctx.translate(posX, 0);
            ctx.scale(-1, 1);
            ctx.translate(-posX, 0);
        }

        // 1. Cabeza
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(posX, posY + 22, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(posX + 6, posY + 15, 10, 4); 

        // 2. Cuello
        ctx.lineWidth = 6;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(posX, posY + 40);
        ctx.lineTo(posX, posY + 46);
        ctx.stroke();

        // 3. Torso
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(posX - 22, posY + 46);
        ctx.lineTo(posX + 22, posY + 46);
        ctx.lineTo(posX + 12, posY + 95);
        ctx.lineTo(posX - 12, posY + 95);
        ctx.closePath();
        ctx.fill();

        // 4. Piernas
        ctx.lineWidth = 12;
        ctx.strokeStyle = this.color;
        ctx.lineCap = 'round';
        let legSwing = Math.sin(this.animationFrame);

        ctx.beginPath();
        ctx.moveTo(posX - 8, posY + 95);
        ctx.lineTo(posX - 14 + legSwing * 12, posY + 125);
        ctx.lineTo(posX - 10 + legSwing * 10, posY + 150);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(posX + 8, posY + 95);
        ctx.lineTo(posX + 14 - legSwing * 12, posY + 125);
        ctx.lineTo(posX + 12 - legSwing * 10, posY + 150);
        ctx.stroke();

        // 5. Brazos (Condicionales para Guardia Pasiva, Ataque o Bloqueo)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 9;

        if (this.isBlocking) {
            // Animación de bloqueo: Ambos brazos cubriendo juntos cruzados al frente
            ctx.beginPath();
            ctx.moveTo(posX + 4, posY + 55);
            ctx.lineTo(posX + 25, posY + 45);
            ctx.lineTo(posX + 25, posY + 20);
            ctx.moveTo(posX + 12, posY + 55);
            ctx.lineTo(posX + 28, posY + 50);
            ctx.lineTo(posX + 28, posY + 25);
            ctx.stroke();
            
            // Escudo sutil de energía defensiva
            ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(posX + 20, posY + 40, 25, -Math.PI/2, Math.PI/2);
            ctx.fill();
            ctx.stroke();
        } 
        else if (this.isAttacking) {
            if (this.attackType === 'punch') {
                ctx.beginPath();
                ctx.moveTo(posX + 10, posY + 55);
                ctx.lineTo(posX + 48, posY + 55);
                ctx.stroke();
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(posX + 52, posY + 55, 7, 0, Math.PI * 2);
                ctx.fill();
            } 
            else if (this.attackType === 'kick') {
                if (this.position.y < 386) {
                    let spin = Math.sin(this.animationFrame * 5);
                    ctx.beginPath();
                    ctx.moveTo(posX, posY + 80);
                    ctx.lineTo(posX + (spin * 55), posY + 80);
                    ctx.stroke();
                    ctx.fillStyle = '#ff5722';
                    ctx.beginPath();
                    ctx.arc(posX + (spin * 55), posY + 80, 8, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.moveTo(posX + 10, posY + 90);
                    ctx.lineTo(posX + 55, posY + 85);
                    ctx.stroke();
                    ctx.fillStyle = '#ff5722';
                    ctx.beginPath();
                    ctx.arc(posX + 58, posY + 85, 9, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else {
            // Guardia pasiva normal
            ctx.beginPath();
            ctx.moveTo(posX + 10, posY + 55);
            ctx.lineTo(posX + 24, posY + 42);
            ctx.lineTo(posX + 20, posY + 24);
            ctx.stroke();
        }

        ctx.restore();

        // 6. Bola de Luz Especial
        if (this.specialBall.isActive) {
            ctx.save();
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00ffff';
            
            let glow = ctx.createRadialGradient(this.specialBall.x, this.specialBall.y, 2, this.specialBall.x, this.specialBall.y, this.specialBall.radius);
            glow.addColorStop(0, '#ffffff');
            glow.addColorStop(0.4, '#00ffff');
            glow.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(this.specialBall.x, this.specialBall.y, this.specialBall.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    update(ctx, gravity, canvasHeight, opponent) {
        this.drawHumanoid(ctx);
        
        if (this.specialBall.isActive) {
            this.specialBall.x += this.specialBall.speed * this.specialBall.direction;
            if (this.specialBall.x > 1050 || this.specialBall.x < -50) {
                this.specialBall.isActive = false;
            }
        }

        if (opponent) {
            if (!this.specialBall.isActive) {
                this.facing = (this.position.x < opponent.position.x) ? 'right' : 'left';
            }
            
            if (this.facing === 'right') {
                this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
            } else {
                this.attackBox.position.x = this.position.x - this.attackBox.width + this.width - this.attackBox.offset.x;
            }
            
            if (this.attackType === 'kick') {
                this.attackBox.width = 110; 
                this.attackBox.position.y = this.position.y + 60;
            } else {
                this.attackBox.width = 80;  
                this.attackBox.position.y = this.position.y + 30;
            }

            if (this.isAI && this.health > 0 && opponent.health > 0) {
                this.think(opponent);
            }
        }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.y + this.height + this.velocity.y >= canvasHeight - 40) {
            this.velocity.y = 0;
            this.position.y = canvasHeight - 40 - this.height;
        } else {
            this.velocity.y += gravity;
        }
    }

    think(opponent) {
        const distance = Math.abs(this.position.x - opponent.position.x);

        if (this.energy >= 100) {
            this.fireSpecial();
            return;
        }

        // Lógica IA inteligente: Si el jugador ataca de cerca, la IA tiene probabilidad de bloquear
        if (opponent.isAttacking && distance < 100 && Math.random() < 0.4) {
            this.isBlocking = true;
            this.velocity.x = 0;
            return;
        } else {
            this.isBlocking = false;
        }

        if (distance > 80) {
            this.velocity.x = (this.position.x < opponent.position.x) ? 3 : -3;
        } else {
            this.velocity.x = 0;
            if (Math.random() < 0.05 && !this.isAttacking) {
                this.attackType = Math.random() < 0.6 ? 'punch' : 'kick';
                this.attack();
            }
        }

        if (opponent.isAttacking && distance < 130 && Math.random() < 0.08 && this.velocity.y === 0) {
            this.velocity.y = -13;
            playSound('jump');
        }
    }

    attack() {
        if (this.isBlocking) return; // No se puede atacar mientras bloqueas
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false;
        }, 150);
    }

    fireSpecial() {
        if (this.energy < 100 || this.specialBall.isActive || this.isBlocking) return;
        
        this.energy = 0;
        this.attackType = 'special';
        this.isAttacking = true;
        playSound('beam');

        this.specialBall.isActive = true;
        this.specialBall.direction = (this.facing === 'right') ? 1 : -1;
        this.specialBall.y = this.position.y + 65; 
        this.specialBall.x = (this.facing === 'right') ? this.position.x + this.width + 10 : this.position.x - 10;

        setTimeout(() => {
            this.isAttacking = false;
        }, 300);
    }
}