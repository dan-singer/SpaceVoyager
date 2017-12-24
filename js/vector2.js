/**
 * Class representing a Vector in 2-dimensional space.
 * @author Dan Singer
 */
class Vector2{
    /**
     * Create a new Vector2.
     * @param {*Number} x 
     * @param {*Number} y 
     */
    constructor(x,y){
        this.x = x;
        this.y = y;
    }

    /**
     * Return the magnitude of this vector.
     * @returns {Number}
     */
    get magnitude(){
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    /**
     * Return the magnitude squared of this vector.
     * @returns {Number}
     */
    get sqrMagnitude(){
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }

    /**
     * Return the normalized vector based on this vector.
     * @returns {Vector2}
     */
    get normalized(){
        let mag = this.magnitude;
        if (mag == 0) return new Vector2(0,0);
        
        let normalizedVec = new Vector2(this.x/mag, this.y/mag);
        return normalizedVec;
    }

    /**
     * Add the other vector to this one.
     * @param {*Vector2} other 
     */
    add(other){
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    /**
     * Subtract the other vector from this one.
     * @param {*Number} other 
     */
    subtract(other){
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    /**
     * Scale this vector by the scalar
     * @param {*Number} scalar 
     */
    scale(scalar){
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Make this vector have a magntiude of one
     */
    normalize(){
        let mag = this.magnitude;
        if (mag == 0) return new Vector2(0,0);

        this.x /= mag;
        this.y /= mag;
        return this;
    }

    /**
     * Return the dot product of this vector and the other one.
     * @param {Vector2} other 
     * @returns {Number}
     */
    dot(other){
        return (this.x * other.x) + (this.y * other.y);
    }

    /**
     * Rotate this vector counterclockwise by the specified amount of radians
     * @param {*Number} radians 
     */
    rotate(radians){
        let newX = this.x * Math.cos(radians) - this.y * Math.sin(radians);
        let newY = this.x * Math.sin(radians) + this.y * Math.cos(radians);
        this.x = newX; this.y = newY;
        return this;
    }

    /**
     * Make this vector's x and y components be zero.
     */
    clear(){
        this.x = 0; this.y = 0;
    }

    /**
     * Static vector addition method
     * @param {Vector2} a 
     * @param {Vector2} b 
     */
    static add(a, b){
        return new Vector2(a.x + b.x, a.y + b.y);
    }
    /**
     * Static vector subtraction method
     * @param {Vector2} a 
     * @param {Vector2} b 
     */
    static subtract(a,b){
        return new Vector2(a.x - b.x, a.y - b.y);
    }
    /**
     * Static scalar multiplication method
     * @param {Vector2} a 
     * @param {Number} scalar 
     */
    static scale(a, scalar){
        return new Vector2(a.x * scalar, a.y * scalar);
    }
    /**
     * Static vector rotation method. Rotates a ccw radians.
     * @param {Vector2} a 
     * @param {Number} radians 
     */
    static rotate(a, radians){
        let temp = new Vector2(a.x, a.y);
        return temp.rotate(radians);
    }
    /**
     * Linearly interpoloate from vectors a to b by t
     * @param {Vector2} a 
     * @param {Vector2} b 
     * @param {Number} t 
     */
    static lerp(a, b, t){
        return this.add(a, this.subtract(b,a).scale(t)); // a + t(b-a)
    }

}