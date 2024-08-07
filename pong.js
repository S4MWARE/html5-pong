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
        timer: 300, // default 5 minutes in seconds
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
    var ball;
    var player1Score;
    var player2Score;
    var player1Up;
    var player1Down;
    var player2Up;
    var player2Down;

    // game clock & fps tracking
    var frames;
    var scorePauseTime = 0;

    // timer variables
    var gameTime;
    var timerDisplay;

    // initializes a new game
    self.initGame = function(){
        gameStopped = false;
        frames = 0;

        player1Score = 0;
        player2Score = 0;

        Player1Bat = new Bat(batBorderSpacing, canvasHeight/2 - batHeight/2, batWidth, batHeight, self.config.colors.bat);
        Player2Bat = new Bat(canvasWidth - batWidth - batBorderSpacing, canvasHeight/2 - batHeight/2, batWidth, batHeight, self.config.colors.bat);
        ball = new Ball(canvasWidth/2, canvasHeight/2, ballRadius, self.config.colors.ball);

        player1Up = player1Down = player2Up = player2Down = false;

        gameTime = self.config.timer;
        timerDisplay = document.getElementById('timerDisplay');
    };

    // bat constructor
    function Bat(x, y, width, height, color){
        var self = this;
        self.x = x;
        self.y = y;
        self.width = width;
        self.height = height;
        self.color = color;
    }

    // ball constructor
    function Ball(x, y, radius, color){
        var self = this;
        self.x = x;
        self.y = y;
        self.radius = radius;
        self.color = color;
        self.velocityX = 0;
        self.velocityY = 0;
    }

    // main game loop
    self.gameLoop = function(){
        if(gameStopped){
            return;
        }

        frames++;

        // update game objects
        updateGameObjects();

        // clear the canvas
        canvasContext.fillStyle = self.config.colors.background;
        canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);

        // draw game objects
        drawGameObjects();

        // timer update
        if (frames % 60 == 0) { // roughly every second
            gameTime--;
            var minutes = Math.floor(gameTime / 60);
            var seconds = gameTime % 60;
            timerDisplay.innerHTML = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');

            // check for end of timer
            if (gameTime <= 0) {
                if (player1Score == player2Score) {
                    gameTime = 60; // overtime: add 1 more minute
                } else {
                    gameStopped = true;
                    alert("Time's up! " + (player1Score > player2Score ? self.config.names.Player1 : self.config.names.Player2) + " wins!");
                }
            }
        }

        requestAnimationFrame(self.gameLoop);
    };

    // update game objects
    function updateGameObjects(){
        // bat movement
        if(player1Up && Player1Bat.y > 0){
            Player1Bat.y -= gameSpeed;
        }
        if(player1Down && Player1Bat.y < canvasHeight - batHeight){
            Player1Bat.y += gameSpeed;
        }
        if(self.config.isMultiplayer){
            if(player2Up && Player2Bat.y > 0){
                Player2Bat.y -= gameSpeed;
            }
            if(player2Down && Player2Bat.y < canvasHeight - batHeight){
                Player2Bat.y += gameSpeed;
            }
        } else {
            // single player AI
            if(ball.y < Player2Bat.y + batHeight/2){
                Player2Bat.y -= gameSpeed * self.config.difficulty;
            } else {
                Player2Bat.y += gameSpeed * self.config.difficulty;
            }
        }

        // ball movement
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        // collision with top and bottom walls
        if(ball.y - ball.radius < 0 || ball.y + ball.radius > canvasHeight){
            ball.velocityY = -ball.velocityY;
        }

        // collision with bats
        if(ball.x - ball.radius < Player1Bat.x + batWidth && ball.x + ball.radius > Player1Bat.x &&
           ball.y - ball.radius < Player1Bat.y + batHeight && ball.y + ball.radius > Player1Bat.y){
            ball.velocityX = -ball.velocityX;
        }
        if(ball.x - ball.radius < Player2Bat.x + batWidth && ball.x + ball.radius > Player2Bat.x &&
           ball.y - ball.radius < Player2Bat.y + batHeight && ball.y + ball.radius > Player2Bat.y){
            ball.velocityX = -ball.velocityX;
        }

        // check for scoring
        if(ball.x < 0){
            player2Score++;
            resetBall();
        } else if(ball.x > canvasWidth){
            player1Score++;
            resetBall();
        }
    }

    // draw game objects
    function drawGameObjects(){
        // draw bats
        canvasContext.fillStyle = Player1Bat.color;
        canvasContext.fillRect(Player1Bat.x, Player1Bat.y, Player1Bat.width, Player1Bat.height);

        canvasContext.fillStyle = Player2Bat.color;
        canvasContext.fillRect(Player2Bat.x, Player2Bat.y, Player2Bat.width, Player2Bat.height);

        // draw ball
        canvasContext.beginPath();
        canvasContext.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI, false);
        canvasContext.fillStyle = ball.color;
        canvasContext.fill();

        // draw scores
        canvasContext.fillStyle = self.config.colors.scores;
        canvasContext.font = scoreFontSize + 'px Arial';
        canvasContext.fillText(player1Score, canvasWidth * 0.25, canvasHeight * 0.1);
        canvasContext.fillText(player2Score, canvasWidth * 0.75, canvasHeight * 0.1);
    }

    // reset ball to the center
    function resetBall(){
        ball.x = canvasWidth / 2;
        ball.y = canvasHeight / 2;
        ball.velocityX = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * gameBounceSpeedRatio + gameBounceSmoothness);
        ball.velocityY = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * gameBounceSpeedRatio + gameBounceSmoothness);
        scorePauseTime = frames + scorePauseTimer / drawRate;
    }

    // start the game
    self.run = function(config){
        self.config = Object.assign(self.config, config);
        self.initGame();
        self.gameLoop();
    };

    // pause the game
    self.pause = function(){
        gameStopped = true;
    };

    // resume the game
    self.resume = function(){
        if(gameStopped){
            gameStopped = false;
            self.gameLoop();
        }
    };

    // set multiplayer mode
    self.setMultiplayer = function(isMultiplayer){
        self.config.isMultiplayer = isMultiplayer;
    };

    // set difficulty
    self.setDifficulty = function(difficulty){
        self.config.difficulty = difficulty;
    };

    // set colors configuration
    self.setConfiguration = function(config){
        self.config = Object.assign(self.config, config);
    };

    // key event handlers
    window.addEventListener('keydown', function(event){
        if(event.key === self.config.controls.Player1.up){
            player1Up = true;
        }
        if(event.key === self.config.controls.Player1.down){
            player1Down = true;
        }
        if(event.key === self.config.controls.Player2.up){
            player2Up = true;
        }
        if(event.key === self.config.controls.Player2.down){
            player2Down = true;
        }
    });

    window.addEventListener('keyup', function(event){
        if(event.key === self.config.controls.Player1.up){
            player1Up = false;
        }
        if(event.key === self.config.controls.Player1.down){
            player1Down = false;
        }
        if(event.key === self.config.controls.Player2.up){
            player2Up = false;
        }
        if(event.key === self.config.controls.Player2.down){
            player2Down = false;
        }
    });

    // pause game if window loses focus
    window.addEventListener('blur', self.pause);

    // resume game if window gains focus
    window.addEventListener('focus', self.resume);
};

