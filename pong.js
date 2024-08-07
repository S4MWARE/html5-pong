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
        isTimedMode: false, // New setting for timed mode
        timeDuration: 120, // Time duration in seconds
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

    var remainingTime;
    var timerInterval;

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

        // start timer if timed mode is enabled
        if (self.config.isTimedMode) {
            startTimer(self.config.timeDuration);
        }

        // game is started if screen is clicked
        drawCenteredText(
            'HTML5 Pong',
            'Click here to start the game.'
        );
    };

    /**
     * Pause game
     */
    this.pause = function() {
        if (!gameStopped) gameStopped = true;
    };

    /**
     * Resume game
     */
    this.resume = function() {
        if (gameStopped) {
            gameStopped = false;
            drawGame();
            runGame();
        }
    };

    /**
     * Sets a custom configuration for the game
     * @param config
     */
    this.setConfiguration = function(config) {

        if (!config) return;

        // apply custom settings to the game
        if (config.isMultiplayer !== undefined) self.config.isMultiplayer = config.isMultiplayer;
        if (config.difficulty !== undefined) self.config.difficulty = config.difficulty;
        if (config.finalScore !== undefined) self.config.finalScore = config.finalScore;
        if (config.isTimedMode !== undefined) self.config.isTimedMode = config.isTimedMode;
        if (config.timeDuration !== undefined) self.config.timeDuration = config.timeDuration;

        if (config.names) {
            if (config.names.Player1) self.config.names.Player1 = config.names.Player1;
            if (config.names.Player2) self.config.names.Player2 = config.names.Player2;
        }

        if (config.colors) {
            if (config.colors.background) self.config.colors.background = config.colors.background;
            if (config.colors.bat) self.config.colors.bat = config.colors.bat;
            if (config.colors.ball) self.config.colors.ball = config.colors.ball;
            if (config.colors.scores) self.config.colors.scores = config.colors.scores;
        }

        if (config.controls) {
            if (config.controls.Player1) {
                if (config.controls.Player1.up) self.config.controls.Player1.up = config.controls.Player1.up;
                if (config.controls.Player1.down) self.config.controls.Player1.down = config.controls.Player1.down;
            }
            if (config.controls.Player2) {
                if (config.controls.Player2.up) self.config.controls.Player2.up = config.controls.Player2.up;
                if (config.controls.Player2.down) self.config.controls.Player2.down = config.controls.Player2.down;
            }
        }
    };

    /**
     * Resets the game objects to its original positions
     */
    var resetGameObjects = function() {
        Player1Bat = {
            x: batBorderSpacing + (batWidth / 2),
            y: canvasHeight / 2
        };
        Player2Bat = {
            x: canvasWidth - batBorderSpacing - (batWidth / 2),
            y: canvasHeight / 2
        };
        Ball = {
            x: canvasWidth / 2,
            y: canvasHeight / 2
        };

        // sets a random ball direction
        BallVelocity = {
            x: gameSpeed * (Math.random() > 0.5 ? 1 : -1),
            y: gameSpeed * (Math.random() > 0.5 ? 1 : -1)
        };
    };

    /**
     * Clears all drawings on the canvas
     */
    var drawClear = function() {
        canvasContext.fillStyle = self.config.colors.background;
        canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);
    };

    /**
     * Draws the current state of the game
     */
    var drawGame = function() {

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
            2 * Math.PI
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

        // draw the remaining time if timed mode is enabled
        if (self.config.isTimedMode) {
            canvasContext.fillText(
                'Time: ' + remainingTime,
                (canvasWidth / 2) - (canvasContext.measureText('Time: ' + remainingTime).width / 2),
                scoreFontSize
            );
        }
    };

    /**
     * Draws a centered title and a message
     */
    var drawCenteredText = function(title, message) {
        // clear all drawings from the canvas
        drawClear();

        // draw title
        canvasContext.fillStyle = self.config.colors.scores;
        canvasContext.font = 'bold ' + centeredMessageFontSize + 'px Courier New';
        canvasContext.fillText(
            title,
            (canvasWidth / 2) - (canvasContext.measureText(title).width / 2),
            (canvasHeight / 2) - centeredMessageFontSize
        );

        // draw message
        canvasContext.fillStyle = self.config.colors.bat;
        canvasContext.font = 'bold ' + scoreFontSize + 'px Courier New';
        canvasContext.fillText(
            message,
            (canvasWidth / 2) - (canvasContext.measureText(message).width / 2),
            (canvasHeight / 2)
        );
    };

    /**
     * Start the game loop and keeps track of the game state
     */
    var runGame = function() {
        if (gameStopped) return;

        moveBall();
        if (self.config.isMultiplayer) {
            moveBat(Player1Bat, self.keyboardIO.Player1Up, self.keyboardIO.Player1Down);
            moveBat(Player2Bat, self.keyboardIO.Player2Up, self.keyboardIO.Player2Down);
        } else {
            moveBat(Player1Bat, self.keyboardIO.Player1Up, self.keyboardIO.Player1Down);
            moveAIBat(Player2Bat);
        }

        drawGame();
        setTimeout(runGame, drawRate);
    };

    /**
     * Moves the AI's bat towards the ball
     * @param bat
     */
    var moveAIBat = function(bat) {
        var reactionSpeed = self.config.difficulty;

        // ball is moving towards the bat
        if (BallVelocity.x > 0) {
            if (Ball.y > bat.y) {
                bat.y += gameSpeed * reactionSpeed;
            } else {
                bat.y -= gameSpeed * reactionSpeed;
            }
        }

        // ball is moving away from the bat
        if (BallVelocity.x < 0) {
            if (bat.y > canvasHeight / 2) {
                bat.y -= gameSpeed * reactionSpeed;
            } else {
                bat.y += gameSpeed * reactionSpeed;
            }
        }

        // bat is out of bounds
        if (bat.y < batHeight / 2) {
            bat.y = batHeight / 2;
        }
        if (bat.y > canvasHeight - (batHeight / 2)) {
            bat.y = canvasHeight - (batHeight / 2);
        }
    };

    /**
     * Moves the player's bat up and down
     * @param bat
     * @param isMoveUp
     * @param isMoveDown
     */
    var moveBat = function(bat, isMoveUp, isMoveDown) {
        if (isMoveUp) {
            bat.y -= gameSpeed;
        } else if (isMoveDown) {
            bat.y += gameSpeed;
        }

        // bat is out of bounds
        if (bat.y < batHeight / 2) {
            bat.y = batHeight / 2;
        }
        if (bat.y > canvasHeight - (batHeight / 2)) {
            bat.y = canvasHeight - (batHeight / 2);
        }
    };

    /**
     * Moves the ball on the canvas
     */
    var moveBall = function() {

        // check ball collision with bats
        var bats = [Player1Bat, Player2Bat];
        for (var bat in bats) {
            if (isBallTouching(bats[bat])) {

                // calculate distance between ball and bat
                var diffY = Ball.y - bats[bat].y;
                BallVelocity.y = BallVelocity.y + diffY * gameBounceSmoothness;

                // ball hit left bat
                if (bat == 0) {
                    BallVelocity.x = -BallVelocity.x + gameSpeed * gameBounceSpeedRatio;
                    Ball.x = bats[bat].x + batWidth / 2 + ballRadius;
                }

                // ball hit right bat
                if (bat == 1) {
                    BallVelocity.x = -BallVelocity.x - gameSpeed * gameBounceSpeedRatio;
                    Ball.x = bats[bat].x - batWidth / 2 - ballRadius;
                }
            }
        }

        // check ball collision with canvas top and bottom
        if (Ball.y < ballRadius || Ball.y > canvasHeight - ballRadius) {
            BallVelocity.y = -BallVelocity.y;
        }

        // check if a player scored
        if (Ball.x < ballRadius) {
            scorePlayer2++;
            resetGameObjects();
        }
        if (Ball.x > canvasWidth - ballRadius) {
            scorePlayer1++;
            resetGameObjects();
        }

        // move ball
        Ball.x += BallVelocity.x;
        Ball.y += BallVelocity.y;

        // check if a player won
        if (scorePlayer1 == self.config.finalScore) {
            self.pause();
            drawCenteredText(
                'Game Over',
                self.config.names.Player1 + ' wins!'
            );
        }
        if (scorePlayer2 == self.config.finalScore) {
            self.pause();
            drawCenteredText(
                'Game Over',
                self.config.names.Player2 + ' wins!'
            );
        }

        // handle time limit if timed mode is enabled
        if (self.config.isTimedMode) {
            remainingTime--;
            if (remainingTime == 0) {
                self.pause();
                if (scorePlayer1 > scorePlayer2) {
                    drawCenteredText(
                        'Game Over',
                        self.config.names.Player1 + ' wins!'
                    );
                } else if (scorePlayer1 < scorePlayer2) {
                    drawCenteredText(
                        'Game Over',
                        self.config.names.Player2 + ' wins!'
                    );
                } else {
                    drawCenteredText(
                        'Game Over',
                        'It\'s a draw!'
                    );
                }
            }
        }
    };

    /**
     * Check if the ball is touching the bat
     * @param bat
     * @returns {boolean}
     */
    var isBallTouching = function(bat) {
        var ballBottom = Ball.y + ballRadius;
        var ballTop = Ball.y - ballRadius;
        var ballLeft = Ball.x - ballRadius;
        var ballRight = Ball.x + ballRadius;

        var batTop = bat.y - batHeight / 2;
        var batBottom = bat.y + batHeight / 2;
        var batLeft = bat.x - batWidth / 2;
        var batRight = bat.x + batWidth / 2;

        return ballBottom >= batTop &&
            ballTop <= batBottom &&
            ballLeft <= batRight &&
            ballRight >= batLeft;
    };
};
