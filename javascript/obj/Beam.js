import Vector from "../lib/Vector";
import EnemyCircle from "./EnemyCircle";
import Explosion from "./Explosion";

import Particle from "./Particle";
import DamageNumber from "./DamageNumber";
import SlashSpark from "./SlashSpark";
import EnemyParticle from "./EnemyParticle";

const WIDTH = 60;
const LENGTH = 150;
const HITBOX_RATIO = 0.95;
const KNOCKBACK = 10;
const DAMAGE = 80;
const DURATION = 13;
// const COLOR = "white";

class Beam extends Particle {
  static COLOR() {
    return {
      NORMAL: [255, 255, 255],
      CRIT: [255, 165, 0],
      CANNON: [255, 0, 0],
      PLAYER: [13, 115, 119],
      FADE: [230, 230, 230],
      TEAL: [0, 205, 205],
      AQUA: [0, 160, 170],
    }
  }

  constructor(game, startX, startY, aim, combo = 0, active = true, length = LENGTH, width = WIDTH) {
    super(game, startX, startY);
    this.aim = aim || this.game.player.aim.dup();
    this.combo = combo || 0;

    // Formula to get the radian angle between the Y axis and a point
    this.angle = Math.atan2(this.aim.y, this.aim.x);

    this.width = width;
    this.length = length;
    this.origin = new Vector(this.pos.x);
    this.damage = DAMAGE;
    this.knockback = KNOCKBACK;
    this.aliveTime = DURATION;
    this.hitRatio = HITBOX_RATIO;
    this.active = active;
    this.initialTime = this.aliveTime;
    this.bomb = false

    this.color = Beam.COLOR().NORMAL;

    // this.update = this.update.bind(this);
    // this.draw = this.draw.bind(this);
  }


  checkCollision(obj) {
    if (!obj.alive) return; //Don't check collision if object is not alive
    if (!this.active) return;

    if(!this.hitWidth) this.hitWidth = this.width * this.hitRatio;
    if(!this.hitLength) this.hitLength = this.length * this.hitRatio;

    if (obj instanceof EnemyCircle || (this.bomb ? obj instanceof EnemyParticle : false)) {

      let x = this.pos.x;
      let y = this.pos.y;

      // === Infinite linear collision detection ===
      // let dist = Math.abs(this.aim.x * diff.y - this.aim.y * diff.x) / this.aim.length();
      // if (this.width / 2 + obj.r > dist) {
      // =============

      // === Translate positions to unrotated box, then box collision
      // Invert Y axis because canvas uses Y axis pointing down, and most cartesian
      // calculations are using Y axis up
      // --------------
      // calculate obj's relative position to beam origin
      // x′ = xcosθ − ysinθ      
      // y′ = ycosθ + xsinθ
      
      // Get the obj relative position to beam origin pos
      let diff = Vector.difference(new Vector(obj.pos.x, -obj.pos.y), new Vector(x, -y));

      let x2 = diff.x * Math.cos(this.angle) - diff.y * Math.sin(this.angle);
      let y2 = diff.y * Math.cos(this.angle) + diff.x * Math.sin(this.angle);

      // Collision using obj as a box,
      // Use LENGTH > HIT_LENGTH to hide inaccuracy of hitbox
      if ( 
        x2 + obj.r >= 0 &&
        x2 - obj.r <= 0 + this.hitLength &&
        y2 + obj.r >= 0 - this.hitWidth / 2 &&
        y2 - obj.r <= 0 + this.hitWidth / 2
      ) {
        diff = new Vector(1,0);
        let x = diff.x * Math.cos(this.angle) - diff.y * Math.sin(this.angle);
        let y = diff.y * Math.cos(this.angle) + diff.x * Math.sin(this.angle);
        let knockStraight = new Vector(x, y);
        
        obj.health -= this.damage;
        if (obj.health <= 0) {
          obj.alive = false;
        } else {
          if (!this.silenced) {
            if (this.combo === this.game.player.maxSlashCombo) {
              this.game.playSoundMany(`${this.game.filePath}/assets/SE_00017.wav`, 0.03);
            } else {
              this.game.playSoundMany(`${this.game.filePath}/assets/SE_00017.wav`, 0.08);
            }
          }
        }

        switch (this.combo) {
          case this.game.player.maxSlashCombo:
            this.game.vanity.push(new DamageNumber(obj, this.damage, 11, 30, knockStraight.x));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x - 50 + Math.random() * 100, obj.pos.y - 50 + Math.random() * 100, this.combo, Math.random() * 4, 30 + Math.random() * 70));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x - 50 + Math.random() * 100, obj.pos.y - 50 + Math.random() * 100, this.combo, Math.random() * 4, 30 + Math.random() * 70));
            obj.vel.add(knockStraight.multiply(-this.knockback));
            break;
          case "BEAM":
            let num = new DamageNumber(obj, this.damage, 40 * Math.log(this.damage) / Math.log(7000), 70, knockStraight.x)
            this.game.vanity.push(num);
            // this.game.vanity.push(new SlashSpark(this.game, obj.pos.x, obj.pos.y, this.combo, this.width / 200 * obj.r, obj.r * 20, 20, Math.atan2(this.aim.y, this.aim.x)));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x, obj.pos.y, 0, 2, 40));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x, obj.pos.y, 0, 3, 60));

            let explosionB = new Explosion(this.game, obj.pos.x, obj.pos.y, 30);
            explosionB.aliveTime = 1;
            this.game.vanity.push(explosionB);
            obj.vel.add(knockStraight.multiply(this.knockback));
            break;
          case "FINISHER":
            this.game.vanity.push(new DamageNumber(obj, this.damage, 20, 60, knockStraight.x));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x, obj.pos.y, this.combo, 15, 150, 50));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x, obj.pos.y, 0, 4, 40));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x, obj.pos.y, 0, 4, 60));
            let explosionF = new Explosion(this.game, obj.pos.x, obj.pos.y, 50);
            explosionF.aliveTime = 3;
            this.game.vanity.push(explosionF);
            obj.vel.add(knockStraight.multiply(this.knockback));
            obj.pos.add(knockStraight);
            break;
          default:
            this.game.vanity.push(new DamageNumber(obj, this.damage, 15, 50, knockStraight.x));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x, obj.pos.y, this.combo, 3, 40));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x, obj.pos.y, this.combo, 3, 40));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x, obj.pos.y, this.combo, 3, 60));
            this.game.vanity.push(new SlashSpark(this.game, obj.pos.x, obj.pos.y, this.combo, 7, 90, 40));
            let explosion = new Explosion(this.game, obj.pos.x, obj.pos.y, 40);
            explosion.aliveTime = 4;
            this.game.vanity.push(explosion);
            obj.vel.add(knockStraight.multiply(this.knockback));
            break;
        }
      }
    }    
  }

  drawRect() {
    // Offset the rect based on its width but maintain origin
    this.ctx.translate(this.pos.x + Math.sin(this.angle) * this.width / 2,
                       this.pos.y - Math.cos(this.angle) * this.width / 2);
    this.ctx.rotate(this.angle);
    this.ctx.fillRect(0, 0, this.length, this.width * 1.1);
  }

  update() {
    if (!this.alive) return; //Don't check collision if object is not alive

    
    if (this.aliveTime >= this.initialTime && this.active === true) {
      this.game.entities.forEach(entity => { this.checkCollision(entity) });
      // this.game.freeze(5);
      if(this.combo === "BEAM") {
        this.game.enemyParticles.forEach(entity => { this.checkCollision(entity) });
      }
    }

    if (this.aliveTime <= 0) {
      this.alive = false;
    }
    this.aliveTime--;
    this.cb();
  }

  // ctx.arc(x, y, r, sAngle, eAngle, [counterclockwise])
  draw() {
    if (this.aliveTime > this.initialTime - 6) {
      this.ctx.save();
      this.ctx.beginPath();
      let color = this.color;
      // let gradient = this.ctx.createLinearGradient(0, 0, this.length, this.width * 1.1);
      // gradient.addColorStop(0.0, `rgba(${color[0]},${color[1]},${color[2]},.9)`);
      // gradient.addColorStop(0.9, `rgba(${color[0]},${color[1]},${color[2]},.9)`);
      // gradient.addColorStop(0.95, `rgba(${color[0]},${color[1]},${color[2]},.1)`);
      // gradient.addColorStop(1.0, `rgba(${color[0]},${color[1]},${color[2]},0)`);
      // this.ctx.fillStyle = gradient;
      // this.ctx.shadowColor = gradient;
      this.ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.9)`;
      this.ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},0.9)`;
      this.ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},0.9)`;
      this.ctx.shadowBlur = 30;
      this.ctx.closePath();
      this.ctx.stroke();


      // this.ctx.shadowColor = color;
      // this.ctx.strokeStyle = "black";

      this.drawRect();

      this.ctx.restore();
    } else {
      this.ctx.save();


      let color = Beam.COLOR().FADE;
      // let color = this.color;
      this.ctx.beginPath();

      // let gradient = this.ctx.createLinearGradient(0, 0, this.length, this.width * 1.1);
      // gradient.addColorStop(0.0, `rgba(${color[0]},${color[1]},${color[2]},${(this.aliveTime + 3) / (this.initialTime - 6)})`);
      // gradient.addColorStop(0.9, `rgba(${color[0]},${color[1]},${color[2]},${(this.aliveTime + 3) / (this.initialTime - 6)})`);
      // gradient.addColorStop(1.0, `rgba(${color[0]},${color[1]},${color[2]},0)`);
      // this.ctx.fillStyle = gradient;
      // this.ctx.shadowColor = gradient;
      this.ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]}, ${Math.pow((this.aliveTime + 3) / (this.initialTime - 6), 3)})`;
      this.ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]}, ${Math.pow((this.aliveTime + 3) / (this.initialTime - 6), 3)})`;
      this.ctx.shadowBlur = 50;
      this.ctx.closePath();
      this.ctx.stroke();

      this.drawRect();

      this.ctx.restore();

    }
  }
}

export default Beam;