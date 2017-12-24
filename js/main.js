"use strict";

/**
 * Main Game Manager for Space Voyager
 * @author Dan Singer
 */
const gameManager = {
    
    app: null,
    camera: null,
    dragSettings: {
        airDensity: 0.3,
        drag: .14,
        areaDivisor: 8000
    },
    pickupsPerCell: {min: 3, max: 5},
    scenes: {
        title: null,
        instructions: null,
        main: null,
        paused: null, //This is a nested in the main scene
        death: null,
        win: null
    },
    pickups: [],
    enemies: [],    
    //Rectangle describing bounds of level
    bounds : null,
    player: null,
    score: 0,
    highScore: 0,
    cellDimensions: new Vector2(1600, 900),
    //Grid of rectangles in the level (Just for reference, they don't hold anything)
    levelGrid: [],
    gridDimensions: new Vector2(3,3),
    enemiesDestroyed: 0,
    regularEnemyQuanity: 4,
    textures: null,
    gameContainer: null,
    paused: false,
    keyPrefix: "djs5435-",
    /**
     * Called when window has loaded.
     */
    windowLoaded(){
        
        this.gameContainer = document.querySelector("#game");
        this.app = new PIXI.Application({width:this.gameContainer.clientWidth, height:this.gameContainer.clientHeight});
        this.gameContainer.appendChild(this.app.view);
        this.bounds = new PIXI.Rectangle(-this.cellDimensions.x, -this.cellDimensions.y, this.cellDimensions.x * 3, this.cellDimensions.y * 3);

        //Create the reference rectangles
        for (let i=0; i<this.gridDimensions.y; i++){
            this.levelGrid.push([]);
            for (let j=0; j<this.gridDimensions.x; j++){
                this.levelGrid[this.levelGrid.length-1].push(
                    //j-1 and i-1 so cell in middle is at (0,0) 
                    new PIXI.Rectangle((j-1) * this.cellDimensions.x, (i-1) * this.cellDimensions.y, this.cellDimensions.x, this.cellDimensions.y)
                );
            }
        }

        PIXI.loader
            .add("media/sprites.json")
            .load(()=>{
                this.assetsLoaded();
            });
    },

    /**
     * Callback when assets have been loaded
     */
    assetsLoaded(){
        this.textures = PIXI.loader.resources["media/sprites.json"].textures;
        this.app.ticker.add(()=>{CollisionManager.update()});


        //Make all scenes except for the main one
        this.scenes.title = this.generateTitle();
        this.scenes.instructions = this.generateInstructions();
        this.scenes.win = this.generateWin();
            this.scenes.win.visible = false;
        this.scenes.death = this.generateDeath();
            this.scenes.death.visible = false;
        for (let scene in this.scenes){
            if (this.scenes[scene])
                this.app.stage.addChild(this.scenes[scene]);
        }

        //Create camera 
        this.spawnCamera();

        //Make a permanent mute button
        let button = new Button("audio", ()=>{
            if (audBg.playing()){
                audBg.pause();
            }
            else{
                audBg.play();
            }
        }, 0);
        button.position = {x:this.app.screen.width - button.width, y:this.app.screen.height-button.height};
        this.app.stage.addChild(button);

        //Pause functionality
        document.addEventListener("keydown", (e)=>{
            if (e.key == "Escape")
                this.togglePause();
        });

        //Fix canvas when window is resized
        window.onresize = (e) => {
            this.app.renderer.resize(this.gameContainer.clientWidth, this.gameContainer.clientHeight);
        };
    },
    
    /**
     * Generate the title scene
     * @return {PIXI.Container}
     */
    generateTitle(){
        let titleScene = new PIXI.Container();
        let title = new Title("Space Voyager");
            title.position = {x: this.app.screen.width/2 - title.width/2, y: this.app.screen.height/2 - title.height/2};


        //Here, we chain together faders to implement smooth transitions between instructions
        let button = new Button("Start", ()=>{
            new Fader(titleScene, this.app).fadeTo(0).then(()=>{
                new Fader(this.scenes.instructions.children[0], this.app).fadeTo(1).then(()=>{
                    new Fader(this.scenes.instructions.children[1], this.app).fadeTo(1).then(()=>{
                        new Fader(this.scenes.instructions.children[0], this.app).fadeTo(0);
                        new Fader(this.scenes.instructions.children[1], this.app).fadeTo(0).then(()=>{
                            new Fader(this.scenes.instructions.children[2], this.app, 2).fadeTo(1).then(()=>{
                                new Fader(this.scenes.instructions.children[2], this.app, 2).fadeTo(0).then(()=>{
                                    titleScene.visible = false;
                                    this.scenes.main = this.generateLevel();
                                    this.scenes.main.alpha = 0;
                                    new Fader(this.scenes.main, this.app).fadeTo(1);
                                    this.app.stage.addChild(this.scenes.main);
                                });                                
                            });
                        });
                    });
                });
            });
        });
        button.position = {x: this.app.screen.width/2 - button.width/2, y: this.app.screen.height - button.height*2};
            
        titleScene.addChild(title);
        titleScene.addChild(button);
        return titleScene;
    },

    /**
     * Generate the instructions scene
     * @return {PIXI.Container}
     */
    generateInstructions(){
        let container = new PIXI.Container();
        let instr = new Label("WASD/Arrows to move");
            instr.position = {x:this.app.screen.width/2-instr.width, y:this.app.screen.height/2-instr.height};    
            instr.alpha = 0;
        let instr2 = new Label("Left Click/Space to shoot");
            instr2.position = {x:this.app.screen.width/2, y:this.app.screen.height/2};        
            instr2.alpha = 0;
        let instr3 = new Label("Rid the world of the GL5 creatures");
            instr3.position = {x:this.app.screen.width/2 - instr3.width/2, y:this.app.screen.height/2 - instr3.height/2};
            instr3.alpha = 0;        
            
        container.addChild(instr);
        container.addChild(instr2);
        container.addChild(instr3);
        
        return container;
    },

    /**
     * Generate the win scene
     * @return {PIXI.Container}
     */
    generateWin(){

        let winScene = new PIXI.Container();

        let label = new Label("Mission Accomplished");
        label.position = {x: this.app.screen.width/2 - label.width/2, y: 0};

        let button = new Button("Back to title", ()=>{
            new Fader(winScene, this.app).fadeTo(0).then(()=>{
                this.camera.target = null;                
                this.scenes.win.visible = false;
                this.scenes.title.visible = true;
                new Fader(this.scenes.title, this.app).fadeTo(1);
            });
        });
        button.position = {x:this.app.screen.width/2 - button.width/2, y: this.app.screen.height - button.height};        
        

        let scoreLabel = new ScoreLabel(()=>`Score: ${this.score}`, this.app);
        let highScoreLabel = new HighScoreLabel(()=>`High Score: ${this.getHighScore()}`, this.app);
        

        winScene.addChild(label, button, scoreLabel, highScoreLabel);
        return winScene;
    },
    
    /**
     * Generate the death scene
     * @return {PIXI.Container}
     */
    generateDeath(){
        let deathScene = new PIXI.Container();
        
        let label = new Label("Mission Failed");
            label.position = {x: this.app.screen.width/2 - label.width/2, y: 0};

        let button = new Button("Restart", ()=>{
            new Fader(deathScene, this.app).fadeTo(0).then(()=>{
                this.camera.target = null;
                this.scenes.main = this.generateLevel();
                this.scenes.death.visible = false;
                this.app.stage.addChild(this.scenes.main);
            });
        });
        button.position = {x:this.app.screen.width/2 - button.width/2, y: this.app.screen.height - button.height};
        

        let scoreLabel = new ScoreLabel(()=>`Score: ${this.score}`, this.app);        
        let highScoreLabel = new HighScoreLabel(()=>`High Score: ${this.getHighScore()}`, this.app);
        

        deathScene.addChild(label, button, scoreLabel, highScoreLabel);
        return deathScene;
    },

    /**
     * Generate the main level
     * @return {PIXI.Container} container with level
     */
    generateLevel(){
        let mainScene = new PIXI.Container();
        this.spawnPlayer(mainScene);
        this.spawnEnemies(mainScene);
        this.drawBoundaries(mainScene);
        this.spawnPickups(mainScene);
        this.createHUD(mainScene);
        this.createPauseMenu(mainScene);
        this.camera.target = this.player;
        this.camera.container = mainScene;
        return mainScene;
    },

    /**
     * Spawn player in the scene
     * @param {PIXI.Container} scene 
     */
    spawnPlayer(scene){
        this.player = new Player("player", this.app, {x: this.app.screen.width/2, y:this.app.screen.height/2});
        scene.addChild(this.player);
    },

    /**
     * Spawn a follow camera which follows nothing.
     */
    spawnCamera(){
        this.camera = new FollowCam(this.app.stage, this.app, null);
    },

    /**
     * Generate the heads-up-display for the scene
     * @param {PIXI.Container} scene 
     */
    createHUD(scene){
        let margin = 20;
        let healthHUD = new HUDLabel(()=>{return `Health: ${this.player.health}`;}, this.app, this.camera);
            healthHUD.positionOffset = {x:margin, y:margin};

        let scoreHUD = new HUDLabel(()=>{return `Score: ${this.score}`;}, this.app, this.camera);
            scoreHUD.positionOffset = {x:this.app.screen.width-scoreHUD.width-margin*4, y:margin};

        let roomHUD = new HUDLabel( ()=> {
            for (let i=0; i<this.levelGrid.length; i++){
                for (let j=0; j<this.levelGrid[i].length; j++){
                    if (Collider.circleCompletelyInRectangle(this.player.position, this.player.radius, this.levelGrid[i][j])){
                        return `Sector ${i+1}.${j+1}`;
                    }
                }
            }
        }, this.app, this.camera);

        roomHUD.positionOffset = {x:this.app.screen.width/2 - roomHUD.width/2, y:this.app.screen.height-roomHUD.height-margin};
        scene.addChild(healthHUD); scene.addChild(scoreHUD); scene.addChild(roomHUD);
    },

    /**
     * Spawn enemies in the scene
     * @param {PIXI.Container} scene 
     */
    spawnEnemies(scene){
        this.enemies = [
            new SeekEnemy("seek1", this.app, this.player, {x:-this.cellDimensions.x/2, y:-this.cellDimensions.y/2}),
            new SeekEnemy("seek2", this.app, this.player, {x:this.cellDimensions.x*1.5, y:this.cellDimensions.y*1.5}),
            new WanderFireEnemy("wander1", this.app, this.player, {x:-this.cellDimensions.x/2, y:this.cellDimensions.y*1.5}),
            new WanderFireEnemy("wander2", this.app, this.player, {x:this.cellDimensions.x*1.5, y:-this.cellDimensions.y/2}),
            new Boss("boss", this.app, this.player, {x:this.cellDimensions.x/2 + 50, y:this.cellDimensions.y/2})
        ];
        this.enemies.forEach((enemy) => scene.addChild(enemy));
    },

    /**
     * Spawn pickups in the scene
     * @param {PIXI.Container} scene 
     */
    spawnPickups(scene){
        //Get the rectangles where pickups will be spawed
        let rects = [
            new PIXI.Rectangle(-this.cellDimensions.x, 0, this.cellDimensions.x, this.cellDimensions.y),
            new PIXI.Rectangle(this.cellDimensions.x, 0, this.cellDimensions.x, this.cellDimensions.y),
            new PIXI.Rectangle(0, -this.cellDimensions.y, this.cellDimensions.x, this.cellDimensions.y),
            new PIXI.Rectangle(0, this.cellDimensions.y, this.cellDimensions.x, this.cellDimensions.y)
        ];
        rects.forEach( (rect) => {
            let pickupsToSpawn = Math.random() * (this.pickupsPerCell.max - this.pickupsPerCell.min) + this.pickupsPerCell.min;
            for (let i=0; i<pickupsToSpawn; i++)
            {            
                let PickupType = Math.random() < .5 ? HealthPickup : ScorePickup;
                let pickup = new PickupType("pickup", this.app); 
                let min = new Vector2(rect.x + pickup.width/2, rect.y + pickup.height/2);
                let max = new Vector2(rect.x + rect.width - pickup.width/2, rect.y + rect.height - pickup.height/2);
                pickup.x = Math.random() * (max.x - min.x) + min.x; 
                pickup.y = Math.random() * (max.y - min.y) + min.y;

                this.pickups.push(pickup);
                scene.addChild(pickup);
            }
        });
    },

    /**
     * Draw a rectangle around the world boundaries
     * @param {PIXI.Container} scene 
     */
    drawBoundaries(scene){
        let boundRect = new PIXI.Graphics();
        boundRect.beginFill(0,0);
        boundRect.lineStyle(1, 0xFFFFFF, 1);
        boundRect.drawShape(this.bounds);
        boundRect.endFill();
        scene.addChild(boundRect);
    },

    /**
     * Create a pause menu in the main scene
     * @param {PIXI.Container} scene 
     */
    createPauseMenu(scene){
        this.scenes.paused = new PIXI.Container();
        let pLabel = new HUDLabel(()=>"-Paused-", this.app, this.camera);
        pLabel.positionOffset = {x:this.app.screen.width/2-pLabel.width/2, y:this.app.screen.height/2 - pLabel.height/2};
        this.scenes.paused.addChild(pLabel);
        this.scenes.paused.visible = false;
        scene.addChild(this.scenes.paused);
    },

    /**
     * Called when an enemy is destroyed
     */
    enemyDestroyed(enemy){
        this.enemiesDestroyed++;
        this.score += enemy.worth;
        if (this.enemiesDestroyed == this.regularEnemyQuanity)
        {
            this.enemies[this.enemies.length-1].activate();
        }
        else if (this.enemiesDestroyed == this.regularEnemyQuanity + 1)
        {
            this.gameWon();      
        }
    },
    /**
     * Called when the game was won
     */
    gameWon(){
        this.app.stage.removeChild(this.scenes.main);
        this.scenes.win.visible = true;
        this.scenes.win.alpha = 1;
        let dummy = new GameObject("dummy", this.app, {x: this.app.screen.width/2, y:this.app.screen.height/2});
        this.camera.target = dummy;
        //update high score
        if (this.score > this.getHighScore()){
            this.setHighScore(this.score);
        }
    },

    /**
     * Called when the player died
     */
    playerDied(){
        this.app.stage.removeChild(this.scenes.main);
        this.scenes.death.visible = true;
        this.scenes.death.alpha = 1;
        let dummy = new GameObject("dummy", this.app, {x: this.app.screen.width/2, y:this.app.screen.height/2});
        this.camera.target = dummy;

        //update high score
        if (this.score > this.getHighScore()){
            this.setHighScore(this.score);
        }
    },

    /**
     * Toggle whether the game is paused or not
     */
    togglePause(){
        if (this.scenes.main == null)
            return;
        this.paused = !this.paused;
        this.scenes.paused.visible = this.paused;      
        //We need to wait a few milliseconds here to allow pixi to display the pause menu before we pause the entire ticker  
        setTimeout(()=>{
            if (this.paused){
                this.app.ticker.stop();
            }
            else{
                this.app.ticker.start();
            }
        }, 20);
    },

    /**
     * Set the high score in localStorage
     * @param {Number} score 
     */
    setHighScore(score){
        localStorage.setItem(this.keyPrefix + "high-score", score);
    },
    /**
     * Get the high score from localStorage
     * @return {Number}
     */
    getHighScore(){
        let score = localStorage.getItem(this.keyPrefix + "high-score");
        if (score){
            return parseInt(score);
        }
        else{
            return 0;
        }
    }

};

/**
 * Fader utility class
 * @author Dan Singer
 */
class Fader{
    /**
     * Make a new fader object
     * @param {PIXI.Container} container 
     * @param {PIXI.Application} app 
     * @param {Number} duration 
     */
    constructor(container, app, duration=1, skippable=true){
        this.container = container;
        this.duration = duration;
        this.app = app;
        this.updateRef = ()=>{this.update()};
        app.ticker.add(this.updateRef);
        this.startAlpha = container.alpha;
        this.alphaTarget = null;
        this.timer = 0;
        this.callback = null;

        //Don't add the event listener immediately, in the event that the user just clicked a button
        setTimeout(()=>{
            if (skippable){
                document.addEventListener("click", (e)=>{
                    this.timer = 1;
                });
            }
        }, 100); 

    }

    /**
     * Make the container fade to the specified alpha value over the duration specified in the constructor
     * @param {Number} alpha 
     */
    fadeTo(alpha){
        this.container.visible = true;
        this.alphaTarget = alpha;
        return this;
    }

    /**
     * Set the function to be called when the fadeTo operation is complete
     * @param {Function} callback 
     */
    then(callback){
        this.callback = callback;
        return this;
    }

    /**
     * Lerp between starting alpha and target alpha, if there is one
     */
    update(){
        let dt = 1 / this.app.ticker.FPS;
        if (this.alphaTarget != null){ 
            this.container.alpha = Fader.lerp(this.startAlpha, this.alphaTarget, this.timer);
            if (this.timer >= 1){
                this.timer = 0;
                this.startAlpha = this.alphaTarget;
                this.alphaTarget = null;                
                if (this.callback)
                    this.callback();
                this.callback = null; //Make sure this doesn't get called again if we chain fades with then 
            }
            this.timer += dt / this.duration;            
        }
    }


    /**
     * Linear Interpolate from a to b by t
     * @param {Number} a
     * @param {Number} b
     * @param {Number} t
     * @return {Number}
     */
    static lerp(a, b, t){
        return a + t*(b-a);
    }
}

//Load bg audio first
let audBg = new Howl({
    src: ["media/audio/bg.wav"],
    loop: true
}).once("load", ()=>{
    audBg.play();
    //Wait for custom font to be loaded before making the canvas
    WebFont.load({
        google: {
            families: ['Saira']
        },
        //Use arrow function so proper this will be used
        active:e=>{
            gameManager.windowLoaded();
        }
    });
});


