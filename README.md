# HTML5 Pong
100% credit to SMenigat on this. I am just experimenting with adding some new features (this project is not currently working, as it is unfinished) Great project!
Pong game written in vanilla JavaScript, utilising HTML5 Canvas. 

You want to play and try it out? [Here you go!](https://rawgit.com/SMenigat/html5-pong/master/pong-demo.html)

# Usage
## Installation
In order to install `html5-pong` on your website you have to simply add the script file to your page. Please feel free to use the CDN version like in the example below.

```JavaScript
<script type="application/javascript" src="https://github.com/NolanSoo/html5-pong/master/pong.js" />
```

## Setting up a game
To initialize a game you got to have at least one **canvas** nodes in your HTML body. The size or dimensions of the **canvas** nodes do not matter, the script turns everything into a game - enjoyable or not. The **canvas** node needs to have an **id** attribute set! This is needed for the further initialization.

Take a look at the following example to get an idea on how to initialize a game.

```JavaScript
<canvas id="gameCanvas" width="800" height="600" tabindex="1"></canvas>
<script>
    // initialize the game, giving it the id of the canvas we want to transform
    var Game = new PongGame('gameCanvas');
    
    // run the game with some options
    Game.run({
        difficulty: PongGame.aiDifficulty.easy,
        names: {
            Player1: 'PongPlayer'
        }
    });
</script>
```

## Options
Below you can take a look at the default configuration of the game.

```JavaScript
{
  isMultiplayer: false,
  // available difficulty values: easy, normal, hard
  difficulty: PongGame.aiDifficulty.normal, 
  finalScore: 5,
  names: {
      Player1: 'Player1',  
      Player2: 'Player2'  
  },
  // available color values: any hex color code or css color name
  colors: {
      background: 'black',
      bat: 'green',
      ball: 'white',
      scores: 'red'
  },
  controls: {
      Player1: {
          up: 'w',
          down: 's'
      },
      Player2: {
          up: 'o',
          down: 'l'
      }
  }
}
```

These default values can be overwritten by a custom configuration object, handed in at `PongGame.run()` like in the example before. 

Additionally you could also use `PongGame.setConfiguration()` to change some configuration dynamicly:

```JavaScript
<script>
    // all of a sudden, our PongPlayer wants to be called "SuperPongPlayer"
    Game.setConfiguration({
      names: {
        Player1: 'SuperPongPlayer'
      }
    });
</script>
```

## Additional methods
There are some more methods available that you can use. Just have a look.

```JavaScript
<script>
    /*
      pausing the game. 
      this is done automaticly if the game canvas looses focus.
    */
    Game.pause();
    
    /*
      resuming the game.
    */
    Game.resume();
    
    /*
      changing the difficulty. 
      in this example to the unbeatable hardmode.
    */
    Game.setDifficulty(PongGame.aiDifficulty.hard);
    
    // this is equal to:
    Game.setConfiguration({
      difficulty: PongGame.aiDifficulty.hard
    });
    
    /*
      toggling multiplayer. 
      in this example, we are enabling it (it's disabled per default)
    */
    Game.setMultiplayer(true);
    
    // this is equal to:
    Game.setConfiguration({
      isMultiplayer: true
    });
</script>
```
