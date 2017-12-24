/**
 * Singleton CollisionManager object which cycles through each object registered with it,
 * and notifies them if they collided with each other using their definition of collision check.
 * NOTE: Collisions will not be checked unless the update method is called each frame!
 * @author Dan Singer
 */
const CollisionManager = {
    colliders : [], 
    collMap: new Map(),
    /**
     * Register a collider so it can be checked for collisions
     * @param {Collider} collider 
     */
    register(collider){
      this.colliders.push(collider);  
    },
    /**
     * Unregister a collider so collisions will stop being checked with it
     * @param {Collider} collider 
     */
    unregister(collider){
        this.colliders.splice(this.colliders.indexOf(collider), 1);

        //Remove all traces of this collider
        if (this.collMap.has(collider))
            this.collMap.delete(collider);
        for (let key of this.collMap.keys()){
            if (this.collMap.get(key).includes(collider))
            {
                let arr = this.collMap.get(key);
                arr.splice(arr.indexOf(collider), 1);
            }
        }
    },
    /**
     * Check every collider in the colliders array against each other to see if they're colliding.
     * This should be called each frame.
     */
    update(){
        for (let i=0; i<this.colliders.length-1; i++){
            let colliderA = this.colliders[i];
            
            for (let j=i+1; j<this.colliders.length; j++)
            {
                let colliderB = this.colliders[j];
                if (colliderA.collidingWith(colliderB)){

                    if (!this.collMap.has(colliderA) || !this.collMap.get(colliderA).includes(colliderB))
                    {
                        colliderA.gameObject.onCollisionBegin(colliderB);
                        colliderB.gameObject.onCollisionBegin(colliderA);
                        if (this.collMap.has(colliderA))
                            this.collMap.get(colliderA).push(colliderB);
                        else
                            this.collMap.set(colliderA, [colliderB]);             
                    }
                    colliderA.gameObject.onCollision(colliderB);
                    colliderB.gameObject.onCollision(colliderA);
                }
                
                else{
                    if (this.collMap.has(colliderA) && this.collMap.get(colliderA).includes(colliderB))
                    {
                        colliderA.gameObject.onCollisionEnd(colliderB);
                        colliderB.gameObject.onCollisionEnd(colliderA);
                        let collisions = this.collMap.get(colliderA);
                        collisions.splice(collisions.indexOf(colliderB), 1);                        
                    }
                }
            }
        }
    }
};

/**
 * Abstract Collider class. Extend to make a specific collider, like a circle or box collider.
 * @author Dan Singer
 */
class Collider{
    /**
     * Construct a new Collider attached to a gameObject
     * @param {GameObject} gameObject 
     */
    constructor(gameObject){ 
        this.gameObject = gameObject;
        CollisionManager.register(this);
    }

    /**
     * Abstract collision check method
     * @param {Collider} other 
     */
    collidingWith(other) { }

    /**
     * Perform an Axis-Aligned Bounding Box Collision test between the two rectangles.
     * @param {PIXI.Rectangle} A 
     * @param {PIXI.Rectangle} B 
     * @return {Boolean}
     */
    static AABB(A, B){
        let Ainfo = {
            min: new Vector2(A.x, A.y),
            max: new Vector2(A.x + A.width, A.y + A.height )
        };
        let Binfo = {
            min: new Vector2(B.x, B.y),
            max: new Vector2(B.x + B.width, B.y + B.height )
        };
        
        let test = Ainfo.min.x < Binfo.max.x && Ainfo.max.x > Binfo.min.x && Ainfo.min.y < Binfo.max.y && Ainfo.max.y > Binfo.min.y;
        return test;
    }

    /**
     * Determine if a circle is completely inside of a rectangle
     * @param {Vector2} pos 
     * @param {Number} radius 
     * @param {PIXI.Rectangle} rect 
     * @return {Boolean}
     */
    static circleCompletelyInRectangle(pos, radius, rect){
        let test = pos.x + radius > rect.x + rect.width || pos.x - radius < rect.x 
            || pos.y + radius > rect.y + rect.height || pos.y - radius < rect.y;
        return !test;
    }
}

/**
 * Circle Collider
 * @author Dan Singer
 */
class CircleCollider extends Collider{

    /**
     * Check if there is a collision between this collider and the other one using a circle collision test
     * @param {CircleCollider} other 
     * @returns {Boolean}
     */
    collidingWith(other){
        let thisRadius = this.gameObject.radius;
        let connectingLine = Vector2.subtract(other.gameObject.posVector, this.gameObject.posVector);
        let radSum = thisRadius + other.gameObject.radius;
        return (connectingLine.sqrMagnitude < Math.pow(radSum, 2));
    }
}