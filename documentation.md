# Space Voyager Documentation

## The Process
I began this project by sketching a UML diagram of my class hierarchy. I started programming the fundamental classes, like GameObject, Vector2, and Motor, and then started prototyping ship movement with forces and placeholder graphics. Once the gameplay was in place, I created the graphics with Inkscape and Spriter. I then implemented the graphics into the game, added a UI, and fixed bugs.

## Sources
- Illustrator
- Spriter
- WebFont library
- [Craig Reynolds Steering Behaviours](https://www.red3d.com/cwr/papers/1999/gdc99steer.pdf)
- Howler
- PixiJS

## Above and Beyond
- Created custom Vector2 class
- Created efficient collision detection manager, which does not redundantly check object collisions
- GameObject class is highly extensible, can hold multiples sprites and/or animations, and is somewhat modular: GameObjects can add a Motor component, Collider component, both, or neither.
- Implemented some of Craig Reynolds steering algorithms
- Created an extensible Camera class
- Created and implemented original music

## What went right?
I was able to code a small game engine inside of PIXI with collision detection, physics, and GameObjects that works well. Also, I was able to generate a fairly sizeable open-world level. Additionally, I implemented a high score system using the local storage api.

## What went wrong?
The scene management is highly inefficient, and not ideal. Additionally, I would have hoped to implement more player guidance, but ran out of time.
Audio implementation is not very robust, and, if I had more time, would have liked to make it extensible and clearer.
## Future improvements
- Create a fully-featured scene manager and give the player more clear instructions.
- Create an extensible audio manager.

## Contributions
This was a solo project, so I completed the entirety of the project myself.

## Grade: 98%