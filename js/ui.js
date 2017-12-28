/**
 * A generic label
 * @author Dan Singer 
 */
class Label extends PIXI.Text{
    constructor(text, app){
        let style = new PIXI.TextStyle({
            fontFamily: "Verdana",
            fontSize: 36,
            fill: 0xFFFFFF
        });
        super(text, style);
        this.updateRef = ()=>this.update();
        this.app = app;
        this.app.ticker.add(this.updateRef);
    }

    set posGetter(pos){
        this.posGetterFunc = pos;
        this.position = this.posGetterFunc();
    }

    update(){
        if (this.posGetterFunc)
            this.position = this.posGetterFunc();
    }

    destroy(options){
        this.app.ticker.remove(this.updateRef);
        super.destroy(options);
    }
}

/**
 * A label whose text is updated each frame
 * @author Dan Singer
 */
class DynamicLabel extends Label{
    constructor(textGetter, app){
        super(textGetter(), app);        
        this.style.fontSize = 24;
        this.textGetter = textGetter;
    }
    update(){
        super.update();
        this.text = this.textGetter();
    }
}

/**
 * Label that matches camera's position
 * @author Dan Singer
 */
class HUDLabel extends DynamicLabel{
    constructor(textGetter, app, camera){
        super(textGetter, app);        
        this.camera = camera;
    }

    update(){
        super.update();
        let offset = this.posGetterFunc();
        this.position = {x:this.camera.position.x+offset.x, y:this.camera.position.y+offset.y};
    }
}

/**
 * Title class
 * @author Dan Singer 
 */
class Title extends Label{
    constructor(text, app){
        let style = new PIXI.TextStyle({
            fontFamily: "Saira",
            fontSize: 72,
            fill: 0xFFFFFF
        });
        super(text, app);
        this.style = style;
    }
}

/**
 * Button class which abstracts boilerplate PIXI button code
 * @author Dan Singer
 */
class Button extends Label{
    /**
     * Construct a new button
     * @param {String} text 
     * @param {Function} pressFunc function called when pressed
     * @param {Number} disableTime how long in milliseconds this button will not perform pressFunc after pressed.
     */
    constructor(text, app, pressFunc, disableTime=1000){
        let style = new PIXI.TextStyle({
            fontFamily: "Verdana",
            fontSize: 32,
            fill: 0x747272
        });
        super(text, app);
        this.style = style;
        this.interactive = true;
        this.buttonMode = true;
        this.pressFunc = pressFunc;

        this.on("pointerdown", ()=>this.alpha=.25 )
            .on("pointerup", ()=>this.alpha=1 )
            .on("pointerupoutside", ()=>this.alpha=1)
            .on("pointerover", ()=>this.alpha=0.5)
            .on("pointerout", ()=>this.alpha=1)
            .on("pointerdown", ()=>{
                if (this.pressFunc)
                {
                    this.pressFunc();
                    let origPressFunc = this.pressFunc;
                    this.pressFunc = null;
                    setTimeout(()=>this.pressFunc = origPressFunc, disableTime);
                }
            });
    }
}

