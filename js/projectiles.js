/**
 * Bullet class.
 * @author Dan Singer
 */
class Bullet extends GameObject{
    /**
     * Construct a new Bullet
     * @param {String} name 
     * @param {PIXI.Application} app 
     * @param {GameObject} source
     * @param {Vector2} direction 
     * @param {Number} launchForceMagnitude 
     */
    constructor(name, app, position, direction, launchForceMagnitude){
        super(name, app, position);
        this.attachCollider();
        this.attachMotor();
        this.forward = direction;
        this.motor.applyForce(Vector2.scale(direction, launchForceMagnitude));        

        this.strength = 1;
        this.motor.mass = 0.2;
    }
    /** @inheritdoc */
    onCollisionBegin(other){
        super.onCollisionBegin(other);
        this.destroy();
    }
    /** @inheritdoc */
    update(){

    }
}

/**
 * Bullets that the player fires
 * @author Dan Singer
 */
class PlayerBullet extends Bullet{
    /**
     * Make a new bullet
     * @param {Vector2} direction 
     */
    constructor(name, app, position, direction){
        super(name, app, position, direction, 50000);
        this.addSprite("bullet.png").scale = {x: .2, y:.2};

    }
    /** @inheritdoc */
    onCollisionBegin(other){
        
        //Player bullet should damage the enemy
        if (other.gameObject instanceof Enemy){
            other.gameObject.decrementHealth(this.strength);
            //Motor.resolveElasticCollision(this.motor, other.gameObject.motor);
        }
        if (!(other.gameObject instanceof Player))
            super.onCollisionBegin(other);
    }
}

/**
 * Bullets the enemy fires
 * @author Dan Singer
 */
class EnemyBullet extends Bullet{
    constructor(name, app, position, direction){
        super(name, app, position, direction, 25000);
        this.addSprite("bullet.png");
    }

    onCollisionBegin(other){
        //Enemy bullet should damage the player
        if (other.gameObject instanceof Player){
            other.gameObject.adjustHealth(-this.strength);
            Motor.resolveElasticCollision(this.motor, other.gameObject.motor);
        }
        if (!(other.gameObject instanceof Enemy))
            super.onCollisionBegin(other);
    }
}