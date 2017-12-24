/**
 * Vehicle class based on Craig Reynolds's steering algorithms
 * @see https://www.red3d.com/cwr/papers/1999/gdc99steer.pdf
 * @author Dan Singer
 */
class Vehicle extends GameObject{
    /**
     * Construct a new Vehicle
     */
    constructor(name, app, position=null){
        super(name, app, position);
        this.maxSpeed = 700;
        this.attachMotor();
        this.attachCollider();
    }

    /**
     * Get a force that causes this vehicle to seek the target
     * @param {Vector2} target 
     * @return {Vector2}
     */
    seek(target){
        let desired = Vector2.subtract(target, this.posVector); 
        desired.normalize().scale(this.maxSpeed);
        let steerForce = Vector2.subtract(desired, this.motor.velocity);
        return steerForce;
    }
    /**
     * Get a force that causes this vehicle to flee the target
     * @param {Vector2} target 
     * @return {Vector2}
     */
    flee(target){
        let desired = Vector2.subtract(this.posVector, target);
        desired.normalized.scale(this.maxSpeed);
        let steerForce = Vector2.subtract(desired, this.motor.velocity);
        return steerForce;
    }
    /**
     * Get a force that causes this vehicle to wander around
     * @param {Number} lookAhead how far ahead to project the circle 
     * @param {Number} radius radius of projected circle
     * @return {Vector2}
     */
    wander(lookAhead, radius){   
        let center = Vector2.scale(this.forward, lookAhead).add(this.posVector); 
        let angleVariation = 2 * Math.PI;
        let angle = Math.random() * angleVariation;
        let displacementVector = Vector2.rotate(this.forward, angle).scale(radius);
        let seekLoc = center.add(displacementVector);
        return this.seek(seekLoc);
    }

    /**
     * Get a force that causes this vehicle to be constrained to the provided rectangle
     * @param {PIXI.Rectangle} rectangle 
     * @return {Vector2}
     */
    constrain(rectangle){
        let test = Collider.circleCompletelyInRectangle(this.position, this.radius, rectangle);
        if (!test)
        {
            let center = new Vector2(rectangle.x + rectangle.width/2, rectangle.y + rectangle.height/2);
            return this.seek(center);
        }
        else{
            return new Vector2(0,0);
        }

    }
}

/**
 * Base enemy class
 * @author Dan Singer
 */
class Enemy extends Vehicle{
    /**
     * Construct a new Enemy. Note this base enemy does not do anything besides handle elastic collisions with the player.
     * @param {Player} player 
     */
    constructor(name, app, player, position=null){
        super(name, app, position);
        this.player = player;
        this.health = 15;
        this.strength = 1;
        this.motor.mass = 4; 
        this.worth = 100;
        //In milliseconds
        this.cooldownDuration = 1000;
        this.stunned = false;


        this.constrainRect = new PIXI.Rectangle(this.position.x - this.app.screen.width/2, this.position.y - this.app.screen.height/2, this.app.screen.width, this.app.screen.height);
        this.fireInfo = {
            canFire: false,
            msBetweenShots: 1000,
            lastFireTime: 0
        };

        //Add Sprites
        let animIdle = this.addAnimation("enemy-idle", 0, 15);
            animIdle.speed = 0.3;
        let animDie = this.addAnimation("enemy-die", 0, 9);
            animDie.loop = false;
            animDie.speed = 0.1;
            animDie.onComplete = ()=>{
                gameManager.enemyDestroyed(this);
                this.destroy();
            };  
    }

    /** @inheritdoc */
    onCollisionBegin(other){
        if (other.gameObject instanceof Player && this.canUpdate){
            other.gameObject.adjustHealth(-this.strength);
            Motor.resolveElasticCollision(this.motor, other.gameObject.motor);   

            //Stop seeking for a second to give player a change to escape
            this.stunned = true;
            setTimeout(()=>this.stunned=false, this.cooldownDuration);

        }
    }

    /**
     * Decrease the enemies health by the provided amount
     * @param {Number} amount 
     */
    decrementHealth(amount){
        this.health -= amount;
        this.flicker();
        if (this.health <= 0){
            this.playAnimation("enemy-die"); //Will destroy enemy after complete
        }
    }

    /**
     * Fire a bullet in the provided direction
     * @param {Vector2} direction 
     */
    fire(direction){
        if (new Date().getTime() - this.fireInfo.lastFireTime  > this.fireInfo.msBetweenShots)
        {
            let spawnPos = Vector2.add(this.posVector, Vector2.scale(direction, this.radius));
            let bullet = new EnemyBullet("eb", this.app, spawnPos, direction);
            this.parent.addChild(bullet);
            this.fireInfo.lastFireTime = new Date().getTime();
        }
    }
    /**
     * Apply drag, face in direction of velocity, and only update if in the view of the camera
     */
    update(){
        this.motor.applyDrag(gameManager.dragSettings);
        //Face in direction of velocity 
        this.forward = this.motor.velocity.normalized;

        //If I'm not in the camera's view, set stunned to true
        this.canUpdate = gameManager.camera.rect.contains(this.position.x, this.position.y);
        if (!this.canUpdate)
            this.motor.stop();
    }
}

/**
 * Enemy which will seek the player
 * @author Dan Singer
 */
class SeekEnemy extends Enemy{
    /** @inheritdoc */    
    constructor(name, app, player, position=null){
        super(name, app, player, position);
    }

    /**
     * Seek the player 
     */
    update(){
        super.update();
        if (this.stunned || !this.canUpdate) return;
        this.motor.applyForce(this.seek(this.player));   
    }
}

/**
 * Enemy which will wander, constrain to constrainRect, and fire towards the player
 * @see Enemy
 * @author Dan Singer
 */
class WanderFireEnemy extends Enemy{
    /** @inheritdoc */    
    constructor(name, app, player, position=null){
        super(name, app, player, position);
        
    }

    /**
     * Wander, constrain to constrainRect, and fire towards the player
     */
    update(){
        super.update();
        if (this.stunned || !this.canUpdate) return;

        let netForce = new Vector2(0,0);


        netForce.add(this.wander(200, 400));
        netForce.add(this.constrain(this.constrainRect));
        this.fire(Vector2.subtract(this.player.posVector, this.posVector).normalized);
        this.motor.applyForce(netForce);

    }
}

/**
 * Boss class
 * @author Dan Singer
 */
class Boss extends Enemy{
    /** @inheritdoc */
    constructor(name, app, player, position=null){
        super(name, app, player, position);
        this.canUpdate = false;
        this.visible = false;
        CollisionManager.unregister(this.collider);
        this.worth = 500;
    }

    /**
     * Display and update the boss. This exists as the boss is not visible or updated by default.
     */
    activate(){
        this.visible = true;
        this.canUpdate = true;
        this.playAnimation("enemy-idle");
        CollisionManager.register(this.collider);
    }

    /**
     * Apply drag, look in direction of velocity, seek the player, and fire foward.
     */
    update(){
        //We're not going to use parent's update here.
        if (this.stunned || !this.canUpdate) return;
        this.motor.applyDrag(gameManager.dragSettings);
        this.forward = this.motor.velocity.normalized;

        this.motor.applyForce(this.seek(this.player));   
        this.fire(this.forward);
    }
}

