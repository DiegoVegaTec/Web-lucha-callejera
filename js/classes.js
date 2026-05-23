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
        this.health = 100;
        this.isAI = isAI;
        
        this.facing = isAI ? 'left' : 'right';
        this.animationFrame = 0;
    }

    drawHumanoid(ctx) {
        if (this.velocity.x !== 0 && this.position.y >= 386) {
            this.animationFrame += 0.15; 
        } else if (this.position.y < 386) {
            this.animationFrame = 0.5; 
        } else {
            this.animationFrame = 0; 
        }

        const posX = this.position.x + this.width / 2;
        const posY = this.position.y;
        
        ctx.save();
        
        if (this.facing === 'left') {
            ctx.translate(this.position.x + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(this.position.x + this.width / 2), 0);
        }

        // 1. Cabeza con visor
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(posX, posY + 25, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(posX + 8, posY + 18, 8, 4); 

        // 2. Torso
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(posX - 18, posY + 45);
        ctx.lineTo(posX + 18, posY + 45);
        ctx.lineTo(posX + 10, posY + 95);
        ctx.lineTo(posX - 10, posY + 95);
        ctx.closePath();
        ctx.fill();

        // 3. Piernas
        ctx.lineWidth = 10;
        ctx.strokeStyle = this.color;
        ctx.lineCap = 'round';

        // Pierna Izquierda
        ctx.beginPath();
        ctx.moveTo(posX - 8, posY + 95);
        ctx.lineTo(posX - 12 + Math.sin(this.animationFrame) * 8, posY + 125);
        ctx.lineTo(posX - 10 + Math.sin(this.animationFrame) * 6, posY + 150);
        ctx.stroke();

        // Pierna Derecha
        ctx.beginPath();
        ctx.moveTo(posX + 8, posY + 95);
        ctx.lineTo(posX + 12 - Math.sin(this.animationFrame) * 8, posY + 125);
        ctx.lineTo(posX + 16 - Math.sin(this.animationFrame) * 6, posY + 150);
        ctx.stroke();

        // 4. Brazos (Guardia / Ataque)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 8;
        
        if (this.isAttacking) {
            ctx.beginPath();
            ctx.moveTo(posX + 8, posY + 55);
            ctx.lineTo(posX + 45, posY + 55);
            ctx.stroke();
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(posX + 48, posY + 55, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(posX + 8, posY + 55);
            ctx.lineTo(posX + 22, posY + 45);
            ctx.lineTo(posX + 18, posY + 25);
            ctx.stroke();
        }

        ctx.restore();
    }

    update(ctx, gravity, canvasHeight, opponent) {
        this.drawHumanoid(ctx);
        
        if (opponent) {
            this.facing = (this.position.x < opponent.position.x) ? 'right' : 'left';
            
            if (this.facing === 'right') {
                this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
            } else {
                this.attackBox.position.x = this.position.x - this.attackBox.width + this.width - this.attackBox.offset.x;
            }
            this.attackBox.position.y = this.position.y + 30;

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

        if (distance > 70) {
            this.velocity.x = (this.position.x < opponent.position.x) ? 3 : -3;
        } else {
            this.velocity.x = 0;
            if (Math.random() < 0.05 && !this.isAttacking) {
                this.attack();
            }
        }

        if (opponent.isAttacking && distance < 120 && Math.random() < 0.1 && this.velocity.y === 0) {
            this.velocity.y = -13;
            playSound('jump');
        }
    }

    attack() {
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false;
        }, 150);
    }
}