/**
 * Transforms a given HTML5 canvas into a pong game
 * @param gameCanvasNodeId
 * @param self.config.names.Player1
 * @param self.config.names.Player2
 * @constructor
 */
var PongGame = function(gameCanvasNodeId){
    var self = this;

    // difficulty enumeration
    PongGame.aiDifficulty = {
        easy: 0.6,
        normal: 0.8,
        hard: 1.0
    };

    // configuration editable by user
    self.config = {
        isMultiplayer: false,
        difficulty: PongGame.aiDifficulty.normal,
        finalScore: 5,
        names: {
            Player1: 'Player1',  
            Player2: 'Player2'  
        },
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
    };

    // game performance settings & timings
    var drawRate = 10; // in milliseconds
    var gameSpeed = 2;
    var gameBounceSmoothness = 0.05;
    var gameBounceSpeedRatio = 0.25;
    var scorePauseTimer = 1000; // in milliseconds

    // trigger that stops the game
    var gameStopped = true;

    // canvas
    var gameCanvas = document.getElementById(gameCanvasNodeId);
    var canvasWidth = gameCanvas.offsetWidth;
    var canvasHeight = gameCanvas.offsetHeight;
    gameCanvas.setAttribute('width', canvasWidth);   // workaround to fix 2d context
    gameCanvas.setAttribute('height', canvasHeight); // workaround to fix 2d context
    var canvasContext = gameCanvas.getContext('2d');

    // game object dimensions
    var batHeightRatio = 0.3;
    var batHeight = canvasHeight * batHeightRatio;
    var batWidthRatio = 0.035;
    var batWidth = canvasWidth * batWidthRatio;
    var batBorderSpacingRatio = 0.01;
    var batBorderSpacing = canvasWidth * batBorderSpacingRatio;
    var ballRadiusRatio = 0.02;
    var ballRadius = canvasWidth * ballRadiusRatio;
    var scoreFontSizeRatio = 0.03;
    var scoreFontSize = canvasWidth * scoreFontSizeRatio;
    var centeredMessageFontSize = scoreFontSize * 2;

    // game objects itself
    var Player1Bat;
    var Player2Bat;
    var Ball;
    var BallVelocity;

    // players & scores
    var scorePlayer1 = 0;
    var scorePlayer2 = 0;

    // input control's
    var keyboardInputEventMap = [];
    self.keyboardIO = {
        Player1Up: false,
        Player1Down: false,
        Player2Up: false,
        Player2Down: false
    };

    /**
     * initializes the game and starts the game loop
     */
    this.run = function (configObj) {

        // apply configuration if there is a custom config
        if (configObj) this.setConfiguration(configObj);

        // blur the game canvas because user needs to click the canvas to play
        gameCanvas.blur();

        // rename player2 if ai is controlling it
        if (!self.config.isMultiplayer) self.config.names.Player2 = 'PongBot';

        // update keymap on keydown / keyup
        gameCanvas.addEventListener('keydown', keyboardInputHandler);
        gameCanvas.addEventListener('keyup', keyboardInputHandler);
        gameCanvas.addEventListener('blur', this.pause);
        gameCanvas.addEventListener('focus', this.resume);

        // create the game objects & give the ball a random velocity and direction
        resetGameObjects();

        // game is started if screen is clicked
        drawCenteredText(
            'HTML5 Pong',
            'Click here to start the game.'
        );
    };

    /**
     * method pauses the game engine
     */
    this.pause = function(){
        gameStopped = true;
        drawCenteredText(
            'Game Paused',
            'Click here to continue the game.'
        );
    };

    /**
     * resumes / restarts the game if paused or game has been ended
     */
    this.resume = function (){
        if (gameStopped) {
            gameStopped = false;
            engine();
        }
    };

    /**
     * overwrites default config values with the given config object's values
     * @param configObject
     */
    this.setConfiguration = function(configObject) {
        self.config = Object.deepExtend(self.config, configObject);

        // reset difficulty to check if the set difficulty is ok (& from our enum)
        self.setDifficulty(self.config.difficulty);
    };

    /**
     * switches gamemode between single and multiplayer
     * @param multiplayer
     */
    this.setMultiplayer = function(multiplayer) {
        self.config.isMultiplayer = multiplayer;
    };

    /**
     * sets difficulty for singleplayer game. if value not in aiDifficulty enum, difficulty is set to normal.
     * @param difficulty
     */
    this.setDifficulty = function(difficulty) {

        // set default difficulty if given difficulty is not in enum
        if (Array.arrayValues(PongGame.aiDifficulty).indexOf(difficulty) === -1) {
            difficulty = PongGame.aiDifficulty.normal;
        }
        self.config.difficulty = difficulty;
    };

    /**
     * game engine, calculates positions of game objects and players scores
     */
    var engine = function(){

        // we are not executing this if the game is stopped
        if (gameStopped) return;

        // make raw keyboard inputs better handel'ble
        updateKeyboardIO();

        // singleplayer ai
        var batSpeedPlayer2 = gameSpeed;
        if (!self.config.isMultiplayer) {
            if (Ball.y < Player2Bat.y) self.keyboardIO.Player2Up = true;
            if (Ball.y > Player2Bat.y) self.keyboardIO.Player2Down = true;
            batSpeedPlayer2 = gameSpeed * self.config.difficulty;
        }

        // move the players bats
        if (self.keyboardIO.Player1Up && canBatBeMovedOnYAxis(Player1Bat, (gameSpeed * 2) * -1)) {
            Player1Bat.moveObject(new Vector(0, (gameSpeed * 2) * -1));
        }
        if (self.keyboardIO.Player1Down && canBatBeMovedOnYAxis(Player1Bat, (gameSpeed * 2))) {
            Player1Bat.moveObject(new Vector(0, (gameSpeed * 2)));
        }
        if (self.keyboardIO.Player2Up && canBatBeMovedOnYAxis(Player2Bat, (batSpeedPlayer2 * 2) * -1)) {
            Player2Bat.moveObject(new Vector(0, (batSpeedPlayer2 * 2) * -1));
        }
        if (self.keyboardIO.Player2Down && canBatBeMovedOnYAxis(Player2Bat, (batSpeedPlayer2 * 2))) {
            Player2Bat.moveObject(new Vector(0, (batSpeedPlayer2 * 2)));
        }

        // check if ball colides with player1's bat
        if (checkBallCollision(Player1Bat)) {

            // we need to add a velocity limit to avoid collision detection from bugging out
            var VelocityX = (BallVelocity.x - (gameSpeed * gameBounceSpeedRatio));
            if (Math.abs(VelocityX) > ballRadius) {
                VelocityX = ballRadius * -1;
            }

            // bounce the ball from the bat & speed the ball up
            BallVelocity = new Vector(
                VelocityX * -1,
                (Player1Bat.y - Ball.y) * gameBounceSmoothness * -1
            );
        }

        // check if ball colides with player2's bat
        if (checkBallCollision(Player2Bat)) {

            // we need to add a velocity limit to avoid collision detection from bugging out
            var VelocityX = (BallVelocity.x + (gameSpeed * gameBounceSpeedRatio));
            if (Math.abs(VelocityX) > ballRadius) {
                VelocityX = ballRadius;
            }

            // bounce the ball from the bat & speed the ball up
            BallVelocity = new Vector(
                VelocityX * -1,
                (Player2Bat.y - Ball.y) * gameBounceSmoothness * -1
            );
        }

        // check if ball collides with canvas's top or bottom border
        if ((Ball.y - ballRadius) <= 0 || (Ball.y + ballRadius) >= canvasHeight) {

            // bounce the ball
            BallVelocity = new Vector(
                BallVelocity.x,
                BallVelocity.y * -1
            );
        }

        // move the ball
        Ball.moveObject(BallVelocity);

        // check if someone has scored
        if (checkScore()) {

            // has one of the players won?
            if (scorePlayer1 === self.config.finalScore || scorePlayer2 === self.config.finalScore) {

                // we have to blur the canvas to make a restart possible
                gameCanvas.blur();

                // print winning screen
                drawCenteredText(
                    ((scorePlayer1 === self.config.finalScore) ? self.config.names.Player1 : self.config.names.Player2) + ' has won!',
                    'Click here to restart.'
                );

                // reset the game, in case the game gets restarted
                scorePlayer1 = scorePlayer2 = 0;
                resetGameObjects();

                // stop engine (until game is restarted)
                return;
            } else {

                // nobody has won yet, so we are resetting the ball to the middle & are
                // readjusting the bats
                resetGameObjects();
            }
        }

        // draw all game object onto the canvas
        drawGame();

        // rerun the engnie function
        setTimeout(function(){
            engine();
        }, drawRate);
    };

    /**
     * if a player has scored the players score is raised and true is returned
     * @returns {boolean}
     */
    var checkScore = function(){

        // check if player1 has scored
        if (Ball.x >= canvasWidth) {
            scorePlayer1++;
            return true;
        }

        // check if player2 has scored
        if (Ball.x <= 0) {
            scorePlayer2++;
            return true;
        }

        // nobody scored
        return false;
    };

    /**
     * checks if ball colides with given player bat
     * @param playerBat
     * @returns {boolean}
     */
    var checkBallCollision = function(playerBat) {

        // bat coordinates
        var batInfo = {
            centerX: playerBat.x,
            centerY: playerBat.y,
            smallestX: playerBat.x - (batWidth / 2),
            biggestX: playerBat.x + (batWidth / 2),
            smallestY: playerBat.y - (batHeight / 2),
            biggestY: playerBat.y + (batHeight / 2)
        };

        // ball coordinates
        var ballInfo = {
            centerX: Ball.x,
            centerY: Ball.y,
            smallestX: Ball.x - ballRadius,
            biggestX: Ball.x + ballRadius,
            smallestY: Ball.y - ballRadius,
            biggestY: Ball.y + ballRadius
        };

        // check if they would collide on the x axis
        if (
            (batInfo.smallestX <= ballInfo.smallestX && ballInfo.smallestX <= batInfo.biggestX) ||
            (batInfo.smallestX <= ballInfo.biggestX && ballInfo.biggestX <= batInfo.biggestX)
        ) {
            // check if the are colliding on the y axis too
            if (
                (batInfo.smallestY <= ballInfo.smallestY && ballInfo.smallestY <= batInfo.biggestY) ||
                (batInfo.smallestY <= ballInfo.biggestY && ballInfo.biggestY <= batInfo.biggestY)
            ) {
                return true;
            }
        }

        // the ball didn't collide with the given bat
        return false;
    };

    /**
     * (re)creates the ball game object and generates a random velocity for it
     */
    var resetGameObjects = function(){

        // initialize the player bats
        Player1Bat = new GameObject(
            batBorderSpacing + (batWidth / 2),
            canvasHeight / 2
        );

        Player2Bat = new GameObject(
            canvasWidth - batBorderSpacing - (batWidth / 2),
            canvasHeight / 2
        );

        // create ball object
        Ball = new GameObject(
            canvasWidth / 2,
            canvasHeight / 2
        );

        // start moving the ball, but we have to determine in which direction
        // which is done randomly
        if (Math.random() > 0.5) {
            BallVelocity = new Vector(gameSpeed * -1, 0);
        } else {
            BallVelocity = new Vector(gameSpeed, 0);
        }

        // we pause the script execution for the defined pause time
        var startTime = new Date();
        var currentTime = null;
        do {
            currentTime = new Date();
        } while(currentTime - startTime < scorePauseTimer);
    };

    /**
     * checks if bat can be moved up or down the Y axis, or if bat is already to close to the border
     * @param bat
     * @param distance
     * @returns {boolean}
     */
    var canBatBeMovedOnYAxis = function(bat, distance) {

        // are we to far too the top if we move the bat?
        if ((bat.y - (batHeight / 2)) + distance <= 0) {
            return false;
        }

        // are we too far to the bottom if we move the bat?
        if ((bat.y + (batHeight / 2)) + distance >= canvasHeight) {
            return false;
        }

        // everything is fine, bat can be moved
        return true;
    };

    /**
     * fills & updates keymap, saves if a certain key code is pressed as boolean
     * @param event
     */
    var keyboardInputHandler = function(event) {
        var char = String.fromCharCode(event.keyCode).toLowerCase();
        keyboardInputEventMap[char] = (event.type == 'keydown');
    };

    /**
     * eventhandler for keypress events of document which sets the player's io states
     * @param event
     */
    var updateKeyboardIO = function(){

        // if player1 moves the bat
        if (keyboardInputEventMap[self.config.controls.Player1.up] || keyboardInputEventMap[self.config.controls.Player1.down]) {

            // up
            if (keyboardInputEventMap[self.config.controls.Player1.up]) {
                self.keyboardIO.Player1Up = true;
                self.keyboardIO.Player1Down = false;
            }

            // down
            else if (keyboardInputEventMap[self.config.controls.Player1.down]) {
                self.keyboardIO.Player1Up = false;
                self.keyboardIO.Player1Down = true;
            }
        } else {

            // player1 is not moving
            self.keyboardIO.Player1Up = false;
            self.keyboardIO.Player1Down = false;
        }

        // if player2 moves the bat (just enabled if multiplayer is active)
        if ((keyboardInputEventMap[self.config.controls.Player2.up] || keyboardInputEventMap[self.config.controls.Player2.down]) && self.config.isMultiplayer) {

            // up
            if (keyboardInputEventMap[self.config.controls.Player2.up]) {
                self.keyboardIO.Player2Up = true;
                self.keyboardIO.Player2Down = false;
            }

            // down
            else if (keyboardInputEventMap[self.config.controls.Player2.down]) {
                self.keyboardIO.Player2Up = false;
                self.keyboardIO.Player2Down = true;
            }
        } else {

            // player1 is not moving
            self.keyboardIO.Player2Up = false;
            self.keyboardIO.Player2Down = false;
        }
    };

    /**
     * clears all drawings from the canvas
     */
    var drawClear = function(){
        canvasContext.fillStyle = self.config.colors.background;
        canvasContext.clearRect(
            0,
            0,
            canvasWidth,
            canvasHeight
        );

        // apply background color
        gameCanvas.style.backgroundColor = self.config.colors.background;
    };

    /**
     * clears the whole canvas and
     * @param FatText
     * @param SmallerText
     */
    var drawCenteredText = function(FatText, SmallerText) {

        // clear all drawings from the canvas
        drawClear();

        // draw the message
        canvasContext.fillStyle = self.config.colors.scores;
        canvasContext.font = 'bold ' + centeredMessageFontSize + 'px Courier New';
        canvasContext.fillText(
            FatText,
            (canvasWidth / 2) - (canvasContext.measureText(FatText).width / 2),
            (canvasHeight / 2) - (centeredMessageFontSize / 2)
        );

        // draw smaller text if available
        if (SmallerText) {
            canvasContext.font = 'bold ' + scoreFontSize + 'px Courier New';
            canvasContext.fillText(
                SmallerText,
                (canvasWidth / 2) - (canvasContext.measureText(SmallerText).width / 2),
                (canvasHeight / 2) + (centeredMessageFontSize / 2)
            );
        }
    };

    /**
     * draws all game objects onto the canvas
     */
    var drawGame = function(){

        // clear all drawings from the canvas
        drawClear();

        // draw player bats
        var bats = [Player1Bat, Player2Bat];
        for (var bat in bats) {
            canvasContext.fillStyle = self.config.colors.bat;
            canvasContext.fillRect(
                bats[bat].x - (batWidth / 2),
                bats[bat].y - (batHeight / 2),
                batWidth,
                batHeight
            );
        }

        // draw the ball
        canvasContext.fillStyle = self.config.colors.ball;
        canvasContext.beginPath();
        canvasContext.arc(
            Ball.x,
            Ball.y,
            ballRadius,
            0,
            2*Math.PI
        );
        canvasContext.fill();

        // draw the player's scores
        canvasContext.fillStyle = self.config.colors.scores;
        canvasContext.font = 'bold ' + scoreFontSize + 'px Courier New';

        // player1
        canvasContext.fillText(
            self.config.names.Player1 + ' ' + scorePlayer1,
            batBorderSpacing,
            scoreFontSize
        );

        // player2
        canvasContext.fillText(
            self.config.names.Player2 + ' ' + scorePlayer2,
            canvasWidth - canvasContext.measureText(self.config.names.Player2 + ' ' + scorePlayer2).width - batBorderSpacing,
            scoreFontSize
        );
    };


    /**
     * minimalistic GameObject
     * @param x
     * @param y
     * @constructor
     */
    var GameObject = function (x, y) {
        var self = this;
        this.x = x;
        this.y = y;

        /**
         * moves the game object by the given vector
         * @param vector
         */
        this.moveObject = function (vector) {
            self.x += vector.x;
            self.y += vector.y;
        };
    };


    /**
     * Vector object shell
     * @param x
     * @param y
     * @constructor
     */
    var Vector = function(x, y) {
        var self = this;
        this.x = x;
        this.y = y;
    };

    /**
     * returns all values of an array like javascript object (array or object)
     * @param arrayLikeObject
     * @returns {Array}
     */
    Array.arrayValues = function(arrayLikeObject){
        if (typeof arrayLikeObject !== 'object') {
            throw new Error('Given arrayLikeObject is not array like!');
        }
        var values = [];
        for(key in arrayLikeObject) {
            values.push(arrayLikeObject[key]);
        }
        return values;
    };

    /**
     * nice method to deep extend JS objects. found here:
     * http://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/
     * @param destination
     * @param source
     * @returns {*}
     */
    Object.deepExtend = function(destination, source) {
        for (var property in source) {
            if (source[property] && source[property].constructor &&
                source[property].constructor === Object) {
                destination[property] = destination[property] || {};
                arguments.callee(destination[property], source[property]);
            } else {
                destination[property] = source[property];
            }
        }
        return destination;
    };
};
