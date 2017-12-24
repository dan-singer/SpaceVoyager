/**
 * Player class for Space Voyager
 * @author Dan Singer
 */
class Player extends GameObject{
    constructor(name, app, position=null){
        super(name, app, position);
        this.attachMotor();
        this.attachCollider();

        this.thrustMagnitude = 450;
        this.radiansPerSecond = 1.5;
        this.health = 6;

        this.msBetweenShots = 250;
        this.wasFiring = false;
        this.wasUp = false;
        this.prevBulletFireTime = 0;
        this.isDead = false;


        //Attach sprites and animations
        this.addSprite("idle", new PIXI.Sprite(gameManager.textures["player-idle_000.png"]));
        let animStartTravel = this.addAnimation("player-start-traveling", 0, 3);
            animStartTravel.loop = false;
            animStartTravel.animationSpeed = 0.2;
            animStartTravel.onComplete = () => { 
                if (this.keysDown.has("up"))
                    this.playAnimation("player-travel"); };
        this.addAnimation("player-travel", 0, 9).animationSpeed = -.2;

        let animEndTravel = this.addAnimation("player-start-traveling", 0, 3, true); //call as player-start-traveling-r
            animEndTravel.speed = 0.2;
            animEndTravel.loop = false;
            animEndTravel.onComplete = () => { this.setActiveSprite("idle");};
        this.addSprite("player-end-traveling", animEndTravel);



        let animDie = this.addAnimation("player-die", 0, 12);
            animDie.loop = false;
            animDie.onComplete = () => { 
                gameManager.playerDied();
                this.destroy();
            }
            
        

        let travel = [];

        this.keyMapping = {
            "ArrowLeft": "left",
            "a": "left",
            "ArrowRight": "right",
            "d": "right",
            "ArrowUp": "up",
            "w": "up",
            " ": "fire" //space
        };

        this.keysDown = new Set();

        //Setup keyboard event handlers
        document.onkeydown = (e) => {
            if (e.key in this.keyMapping)
            {
                this.keysDown.add(this.keyMapping[e.key]);
            }
        };
        document.onkeyup = (e) =>{
            if (e.key in this.keyMapping)
            {
                this.keysDown.delete(this.keyMapping[e.key]);
            }
        }

        //Mouse Event handlers
        document.onmousedown = (e) => {this.keysDown.add("fire")};
        document.onmouseup = (e) => {this.keysDown.delete("fire")};
    }

    /** @inheritdoc */
    onCollisionBegin(other){

    }
    /** @inheritdoc */    
    onCollisionEnd(other){

    }

    /**
     * Adjust the player's health by the specified amount
     * @param {Number} amount 
     */
    adjustHealth(amount){
        this.health += amount;
        this.flicker();
        if (this.health <= 0){
            this.isDead = true;
            this.playAnimation("player-die");
        }
    }

    /**
     * Main player logic
     */
    update(){

        if (this.isDead) return;

        let dt = 1 / this.app.ticker.FPS;

        //Apply drag
        this.motor.applyDrag(gameManager.dragSettings);

        //Check if I'm out of bounds
        let futurePos = Vector2.add(this.posVector, Vector2.scale(this.motor.velocity, .1));
        if (!Collider.circleCompletelyInRectangle(futurePos, this.radius, gameManager.bounds)){
            //We can "fake" an elastic collision by just supplying an object literal with mass and velocity to the Motor method.
            Motor.resolveElasticCollision(this.motor, {mass: 10, velocity: new Vector2(0,0)});
        }

        //Thrust
        if (this.keysDown.has("up")){

            if (!this.wasUp)
            {
                this.playAnimation("player-start-traveling");
            }
            let force = this.forward.scale(this.thrustMagnitude);
            this.motor.applyForce(force);
        }
        else if (this.wasUp)
        {
            this.playAnimation("player-start-traveling-r");
        }

        //Rotation
        if (this.keysDown.has("left")){
            this.rotation -= this.radiansPerSecond * dt;
        }
        if (this.keysDown.has("right")){
            this.rotation += this.radiansPerSecond * dt;            
        }

        //Fire
        if (this.keysDown.has("fire") && !this.wasFiring){

            if (new Date().getTime() - this.prevBulletFireTime > this.msBetweenShots)
            {
                //Spawn a bullet
                let spawnPos = Vector2.add(this.posVector, Vector2.scale(this.forward, this.radius));
                let bullet = new PlayerBullet("b", this.app, spawnPos, this.forward);
                this.parent.addChild(bullet);
                this.prevBulletFireTime = new Date().getTime();
            }
        }
        

        this.wasFiring = this.keysDown.has("fire");
        this.wasUp = this.keysDown.has("up");
    }


}