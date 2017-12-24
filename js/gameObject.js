/**
 * Base GameObject class capable of holding multiple sprites and swapping between them,
 * recieving collision callbacks, and being destroyed. Each GameObject comes with an abstract update method 
 * which is called each frame.
 * @author Dan Singer
 */
class GameObject extends PIXI.Container{

    /**
     * Create a new GameObject
     * @param {String} name
     * @param {PIXI.Application} app
     * @param {PIXI.Point} position
     */
    constructor(name, app, position=null){
        super();
        //Note use of arrow function so this can be used in update method.
        //Also note we store a reference to this method so we can remove it from ticker later if this is destroyed.
        this.updateRef = ()=>this.update(); 
        app.ticker.add(this.updateRef);
        this.app = app;
        this.name = name;
        this.sprites = new Map();
        this.activeSprite = null;
        this.canUpdate = true;

        if (position)
        {
            this.position = position;
        }
        
        //Components
        this.motor = null;
        this.collider = null;
    }

    /**
     * Get the position as a Vector2
     */
    get posVector(){
        return new Vector2(this.position.x, this.position.y);
    }
    /**
     * Get the radius of this GameObject
     */
    get radius(){
        if (!this.activeSprite)
            return 0;
        else
            return Math.max(this.width, this.height) / 2;
    }

    /**
     * Get the rectangle of this GameObject
     */
    get rect(){
        return new PIXI.Rectangle(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
    }

    /**
     * Get the unit forward vector of this GameObject
     */
    get forward(){
        //PIXI considers rotations clockwise, so we need to adjust for this.
        let temp = new Vector2(1,0).rotate(-this.rotation);
        //Also, reflect y axis so up is down and down is up.
        temp.y *= -1;
        return temp;
    }

    /**
     * Set the forward of this gameObject by rotating in the direction of the unit vector
     * @param {Vector2} direction
     */
    set forward(direction){
        //Note that we don't have to account for y being backwards because rotation is clockwise 
        let angle = Math.atan2(direction.y, direction.x);
        this.rotation = angle;
    }

    /**
     * Add a sprite to the GameObject's list of potential sprites. Note this will not display the Sprite if there is already an active one.
     * @param {String} name name of the sprite, or path to sprite if second argument not supplied
     * @param {PIXI.Sprite} sprite 
     * @return {PIXI.Sprite}
     */
    addSprite(name, sprite=null){

        if (sprite == null)
            sprite = new PIXI.Sprite(PIXI.TextureCache[name]); 
        sprite.anchor.set(0.5,0.5);
        if (!this.activeSprite){
            sprite.visible = true;
            this.activeSprite = sprite;
        }
        else{
            sprite.visible = false;            
        }
        this.sprites.set(name, sprite);        
        this.addChild(sprite);
        return sprite;
    }


    /**
     * Attach a motor component to this GameObject so physics behaviors can be applied. 
     */
    attachMotor(){
        this.motor = new Motor(this);
    }

    /**
     * Attach a circle collider to this GameObject
     */
    attachCollider(){
        this.collider = new CircleCollider(this);
    }

    /**
     * Set the sprite named name to be active (make it visible!)
     * @param {String} name 
     */
    setActiveSprite(name){
        if (this.activeSprite)
            this.activeSprite.visible = false;
        this.activeSprite = this.sprites.get(name);
        this.activeSprite.visible = true;
    }

    /**
     * Add a potential animation to this GameObject.
     * Note that this is designed to work with animations created with Spriter, as it adheres to its naming convention of file_003.png
     * @param {String} prefix prefix of the animation 
     * @param {Number} min lowest frame number (inclusive) 
     * @param {Number} max highest frame number (exclusive)
     * @param {Boolean} reverse generate the animation in reverse?
     * @return {PIXI.extras.AnimatedSprite} 
     */
    addAnimation(prefix, min, max, reverse=false){
        let arr = [];

        let pushToArr = (i) => arr.push(PIXI.Texture.fromFrame(`${prefix}_${GameObject.toSpriterNum(i)}.png`));
        
        if (!reverse)
            for (let i=min; i<max; i++)
                pushToArr(i);
        else
            for (let i=max-1; i>=min; i--)
                pushToArr(i);
        
        let anim = new PIXI.extras.AnimatedSprite(arr);

        if (reverse) prefix += "-r";
        
        this.addSprite(prefix, anim);
        return anim;
    }

    /**
     * Play the specified sprite's animation. Sprite must be an AnimatedSprite for this to work.
     * @param {String} name 
     */
    playAnimation(name){
        this.setActiveSprite(name);
        this.sprites.get(name).gotoAndPlay(0);
    }

    /**
     * Make the GameObject flicker quickly (or provide parameters to adjust this)
     * @param {Number} newAlpha 
     * @param {Number} duration 
     */
    flicker(newAlpha=0.5, duration=100){
        let prevAlpha = this.activeSprite.alpha;
        this.alpha = newAlpha;
        setTimeout(()=>this.alpha=prevAlpha, duration);
    }

    /*Abstract Collision methods. You must attach a collider for these to be called. Other is a Collider.*/
    onCollisionBegin(other){ }
    onCollision(other){ }
    onCollisionEnd(other){ }

    /**
     * Called each frame. Override this in subclasses.
     */
    update(){}


    /**
     * Unregister the collider if it exists, stop updating, and remove from the parent container
     */
    destroy(){
        if (this.collider){
            CollisionManager.unregister(this.collider);
        }
        this.app.ticker.remove(this.updateRef);        
        this.parent.removeChild(this);
    }

    /**
     * Convert an index to a Spriter index. For example, 4 would be converted to "004"
     * @param {Number} num 
     * @return {String}
     */
    static toSpriterNum(num){
        if (num < 10) 
            return `00${num}`;
        else if (num < 100)
            return `0${num}`;
        else
            return num + "";
    }
}


/**
 * Component class responsible for applying simple physics to gameObjects
 * @author Dan Singer
 */
class Motor{

    /**
     * Construct a new motor for the GameObject
     * @param {GameObject} gameObject 
     */
    constructor(gameObject){
        this.gameObject = gameObject;
        //Note this is not the same as the gameObject's position!
        this.position = new Vector2(0,0);
        this.velocity = new Vector2(0,0);
        this.acceleration = new Vector2(0,0);
        this.mass = 1;
        this.gameObject.app.ticker.add(()=>this.update());
    }

    /**
     * Apply a force this frame to the GameObject
     * @param {Vector2} force 
     */
    applyForce(force){
        this.acceleration.add(force.scale(1/this.mass));
    }

    /**
     * Resolve a collision between two motors using the conservation of momentum
     * @see https://en.wikipedia.org/wiki/Elastic_collision#One-dimensional_Newtonian
     * @param {Motor} motorA 
     * @param {Motor} motorB 
     */
    static resolveElasticCollision(motorA, motorB){

        let u1 = motorA.velocity;
        let u2 = motorB.velocity;
        let m1 = motorA.mass;
        let m2 = motorB.mass;

        let v1 = Vector2.scale(u1, m1-m2)
                .add(Vector2.scale(u2, 2*m2))
                .scale(1/(m1+m2));
        motorA.velocity = v1;

        let v2 = Vector2.scale(u2, m2-m1)
                        .add(Vector2.scale(u1, 2*m1))
                        .scale(1/(m1+m2));
        motorB.velocity = v2;
    }

    /**
     * Apply a drag force to this object based on the provided settings
     * @see https://en.wikipedia.org/wiki/Drag_equation
     * @param {DragSettings} settings should contain airDensity, drag, and areaDivisor
     */
    applyDrag(settings){
        let airDensity = settings.airDensity; //0.3;
        let drag = settings.drag; //0.14;
        let areaDivisor = settings.areaDivisor; // 8000
        let area = this.gameObject.width * this.gameObject.height / 8000;
        let airResistanceMag = airDensity * drag * area * this.velocity.sqrMagnitude / 2;
        this.applyForce(this.velocity.normalized.scale(-airResistanceMag));
    }

    /**
     * This frame, zero out velocity and acceleration.
     */
    stop(){
        this.velocity.clear();
        this.acceleration.clear();
    }
    

    /**
     * Synchronize the motor's stored position with the gameObject's position, as the gameObject's position is not a Vector2.
     */
    syncPosition(){
        this.position.x = this.gameObject.position.x; 
        this.position.y = this.gameObject.position.y;        
    }

    /**
     * Called each frame to update velocity and position, and reset acceleration after each frame
     */
    update(){
        this.syncPosition();
        let dt = 1 / this.gameObject.app.ticker.FPS;
        this.velocity.add(Vector2.scale(this.acceleration, dt));
        this.position.add(Vector2.scale(this.velocity, dt));
        this.gameObject.position.x = this.position.x; this.gameObject.position.y = this.position.y;
        this.acceleration.clear();
    }
}