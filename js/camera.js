/**
 * Simulate a camera by adjusting a container.
 * @author Dan Singer
 */
class Camera{

    /** @inheritdoc */
    constructor(container, app){
        this.container = container;
        this.app = app;
        this.updateRef = ()=>this.update();
        this.app.ticker.add(this.updateRef);
    }
    /**
     * Set the upper left corner of the camera viewing rectangle.
     * @param {Vector2} newPos
     */
    set position(newPos){
        this.container.position = Vector2.scale(newPos, -1);
    }

    /**
     * Get the upper left corner of the camera viewing rectangle.
     * @return {Vector2}
     */
    get position(){
        return Vector2.scale(this.container.position, -1);
    }

    /**
     * Set the zoom of the camera
     * @param {Number} zoom
     */
    set zoom(newZoom){
        this.container.scale = new Vector2(newZoom, newZoom);
    }

    /**
     * Get the viewing rectangle of this camera
     * @return {PIXI.Rectangle}
     */
    get rect(){
        let pos = this.position;
        return new PIXI.Rectangle(pos.x, pos.y, this.app.screen.width, this.app.screen.height);
    }

    /** @inheritdoc */
    update(){ }

    /**
     * Stop updating the camera
     */
    destroy(){
        this.app.ticker.remove(this.updateRef);
    }
}

/**
 * Specialized camera which will smoothly follow a target
 * @author Dan Singer
 */
class FollowCam extends Camera{
    /**
     * Make a follow camera
     * @param {PIXI.Container} target 
     */
    constructor(container, app, target, speed=1){
        super(container, app);
        this.target = target;
        this.speed = speed;
        this.following = true;
    }

    /**
     * Follow the target if there is one
     */
    update(){
        if (this.following && this.target){        
            let dt = 1 / this.app.ticker.FPS;
            let desiredPosition = new Vector2(this.target.x - this.app.screen.width/2, this.target.y - this.app.screen.height/2 );
            this.position = Vector2.lerp(this.position, desiredPosition, this.speed * dt);
        }
        else{
            this.position = new Vector2(0,0);
        }
    }


}