/**
 * Pickup class
 * @author Dan Singer
 */
class Pickup extends GameObject{
    /** @inheritdoc */
    constructor(name, app, position=null){
        super(name, app, position);
        this.worth = 1;
        this.scale = {x:.2, y:.2};
        this.attachCollider();
    }

    /** @inheritdoc */
    onCollisionBegin(other){
        if (other.gameObject instanceof Player){
            this.onPickedUp(other.gameObject);
            this.destroy();
        }
    }

    /**
     * Called when this pickup is picked up
     * @param {Player} player 
     */
    onPickedUp(player){ }
}

/**
 * Health pickup
 * @author Dan Singer
 */
class HealthPickup extends Pickup{
    constructor(name, app, position=null){
        super(name, app, position);
        this.addSprite("pickup-health.png");
    }

    onPickedUp(player){
        player.adjustHealth(this.worth);
    }
}
/**
 * Score pickup
 * @author Dan Singer
 */
class ScorePickup extends Pickup{
    constructor(name, app, position=null){
        super(name, app, position);
        this.addSprite("pickup-score.png"); 
        this.worth = 10;       
    }

    onPickedUp(player){
        gameManager.score += this.worth;
    }
}