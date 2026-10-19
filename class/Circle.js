import Vector2 from './Vector2.js';

export default class Circle {
  constructor(x, y, radius, color = '#38bdf8') {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.radius = radius;
    this.color = color;
    this.speed = 0.3;
  }

  update(delta, keyboard, boundsWidth, boundsHeight) {
    this.velocity.x = 0;
    this.velocity.y = 0;

    if (keyboard.isDown('KeyW') || keyboard.isDown('ArrowUp')) {
      this.velocity.y -= this.speed;
    }
    if (keyboard.isDown('KeyS') || keyboard.isDown('ArrowDown')) {
      this.velocity.y += this.speed;
    }
    if (keyboard.isDown('KeyA') || keyboard.isDown('ArrowLeft')) {
      this.velocity.x -= this.speed;
    }
    if (keyboard.isDown('KeyD') || keyboard.isDown('ArrowRight')) {
      this.velocity.x += this.speed;
    }

    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;

    if (this.position.x < this.radius) this.position.x = this.radius;
    if (this.position.x > boundsWidth - this.radius) this.position.x = boundsWidth - this.radius;
    if (this.position.y < this.radius) this.position.y = this.radius;
    if (this.position.y > boundsHeight - this.radius) this.position.y = boundsHeight - this.radius;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
