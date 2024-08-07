var PongGame = function(canvasId){
    var self = this;

    // Game configuration
    self.config = {
        names: {
            Player1: "Player 1",
            Player2: "Player 2"
        },
        colors: {
            background: "#000",
            bats: "#FFF",
            ball: "#F00",
            scores: "#FFF"
        },
        controls: {
            Player1: {
                up: "ArrowUp",
                down: "ArrowDown"
            },
            Player2: {
                up: "w",
                down: "s"
            }
        },
        batWidth: 10,
        batHeight: 100,
        ballRadius: 10,
        gameSpeed: 4,
        difficulty: 1,
        finalScore: 5,
        timer: 60, // default timer value in seconds
        overtime: true // enable overtime
    };

    var canvas = document.getElementById(canvasId);
    var canvasContext = canvas.getContext('2d');

    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;

    var Player1Bat = {
        x: 0,
        y: canvasHeight / 2 - self.config.batHeight / 2,
        width: self.config.batWidth,
        height: self.config.batHeight,
        color: self.config.colors.bats
    };
    
    var Player2Bat = {
        x: canvasWidth - self.config.batWidth,
        y: canvasHeight / 2 - self.config.batHeight / 2,
        width: self.config.batWidth,
        height: self.config.batHeight,
        color: self.config.colors.bats
    };

    var ball = {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        radius: self.config.ballRadius,
        velocityX: self.config.gameSpeed,
        velocityY: self.config.gameSpeed,
        color: self.config.colors.ball
    };

    var player1Score = 0;
    var player2Score = 0;

    var gameSpeed = self.config.gameSpeed;
    var scoreFontSize = 24;
    var gameStopped = false;

    var timer;
    var timerElement = document.getElementById('timer');

    // Initialize game
    self.initGame = function(){
        self.resetGame();
        self.startTimer();
    };

    // Start the game timer
    self.startTimer = function(){
        var timeRemaining = self.config.timer;
        timerElement.textContent = "Time: " + timeRemaining;

        timer = setInterval(function(){
            if(gameStopped) return;
            timeRemaining--;
            timerElement.textContent = "Time: " + timeRemaining;
            if(timeRemaining <= 0){
                if(self.config.overtime){
                    clearInterval(timer);
                    self.startOvertime();
                } else {
                    self.endGame();
                }
            }
        }, 1000);
    };

    // Start overtime if enabled
    self.startOvertime = function(){
        var overtimeDuration = 60; // 1 minute of overtime
        var timeRemaining = overtimeDuration;
        timerElement.textContent = "Overtime: " + timeRemaining;

        timer = setInterval(function(){
            if(gameStopped) return;
            timeRemaining--;
            timerElement.textContent = "Overtime: " + timeRemaining;
            if(timeRemaining <= 0){
                self.endGame();
            }
        }, 1000);
    };

    // Reset game state
    self.resetGame = function(){
        Player1Bat.y = canvasHeight / 2 - self.config.batHeight / 2;
        Player2Bat.y = canvasHeight / 2 - self.config.batHeight / 2;
        player1Score = 0;
        player2Score = 0;
        resetBall();
    };

    // End the game
    self.endGame = function(){
        clearInterval(timer);
        gameStopped = true;
        var winner = player1Score > player2Score ? self.config.names.Player1 : player2Score > player1Score ? self.config.names.Player2 : "No one";
        alert(winner + " wins!");
    };

    // Game loop
    self.gameLoop = function(){
        if(gameStopped) return;

        // Update positions
        updatePositions();

        // Draw game objects
        drawGameObjects();

        // Request next frame
        requestAnimationFrame(self.gameLoop);
    };

    // Update positions of game objects
    function updatePositions(){
        // Move player 1 bat
        if(player1Up && Player1Bat.y > 0){
            Player1Bat.y -= gameSpeed;
        }
        if(player1Down && Player1Bat.y < canvasHeight - Player1Bat.height){
            Player1Bat.y += gameSpeed;
        }

        // Move player 2 bat (AI or player 2 controls)
        if(self.config.isMultiplayer){
            if(player2Up && Player2Bat.y > 0){
                Player2Bat.y -= gameSpeed;
            }
            if(player2Down && Player2Bat.y < canvasHeight - Player2Bat.height){
                Player2Bat.y += gameSpeed;
            }
        } else {
            // AI movement
            if(ball.y < Player2Bat.y + Player2Bat.height / 2){
                Player2Bat.y -= gameSpeed * self.config.difficulty;
            } else {
                Player2Bat.y += gameSpeed * self.config.difficulty;
            }

            // Ensure AI bat does not go off-screen
            if(Player2Bat.y < 0) Player2Bat.y = 0;
            if(Player2Bat.y > canvasHeight - Player2Bat.height) Player2Bat.y = canvasHeight - Player2Bat.height;
        }

        // Ball movement
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        // Ball collision with top and bottom
        if(ball.y - ball.radius < 0 || ball.y + ball.radius > canvasHeight){
            ball.velocityY = -ball.velocityY;
        }

        // Ball collision with bats
        if(ball.x - ball.radius < Player1Bat.x + Player1Bat.width && ball.y > Player1Bat.y && ball.y < Player1Bat.y + Player1Bat.height){
            ball.velocityX = -ball.velocityX;
            ball.x = Player1Bat.x + Player1Bat.width + ball.radius;
        }
        if(ball.x + ball.radius > Player2Bat.x && ball.y > Player2Bat.y && ball.y < Player2Bat.y + Player2Bat.height){
            ball.velocityX = -ball.velocityX;
            ball.x = Player2Bat.x - ball.radius;
        }

        // Score update
        if(ball.x - ball.radius < 0){
            player2Score++;
            resetBall();
            checkForWinner();
        }
        if(ball.x + ball.radius > canvasWidth){
            player1Score++;
            resetBall();
            checkForWinner();
        }
    }

    // Reset the ball to the center
    function resetBall(){
        ball.x = canvasWidth / 2;
        ball.y = canvasHeight / 2;
        ball.velocityX = (Math.random() > 0.5 ? 1 : -1) * gameSpeed;
        ball.velocityY = (Math.random() - 0.5) * gameSpeed;
    }

    // Check if a player has won
    function checkForWinner(){
        if(player1Score >= self.config.finalScore || player2Score >= self.config.finalScore){
            gameStopped = true;
            var winner = player1Score > player2Score ? self.config.names.Player1 : self.config.names.Player2;
            alert(winner + " wins!");
        }
    }

    // Draw game objects
    function drawGameObjects(){
        // Draw bats
        canvasContext.fillStyle = Player1Bat.color;
        canvasContext.fillRect(Player1Bat.x, Player1Bat.y, Player1Bat.width, Player1Bat.height);

        canvasContext.fillStyle = Player2Bat.color;
        canvasContext.fillRect(Player2Bat.x, Player2Bat.y, Player2Bat.width, Player2Bat.height);

        // Draw ball
        canvasContext.fillStyle = ball.color;
        canvasContext.beginPath();
        canvasContext.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        canvasContext.fill();

        // Draw scores
        canvasContext.fillStyle = self.config.colors.scores;
        canvasContext.font = scoreFontSize + "px Arial";
        canvasContext.textAlign = "center";
        canvasContext.fillText(player1Score, canvasWidth / 4, scoreFontSize);
        canvasContext.fillText(player2Score, 3 * canvasWidth / 4, scoreFontSize);
    }

    // Public API
    self.run = function(config){
        if(config){
            for(var key in config){
                if(config.hasOwnProperty(key)){
                    self.config[key] = config[key];
                }
            }
        }

        self.initGame();
        requestAnimationFrame(self.gameLoop);
    };

    self.setConfiguration = function(newConfig){
        for(var key in newConfig){
            if(newConfig.hasOwnProperty(key)){
                self.config[key] = newConfig[key];
            }
        }
    };

    self.setMultiplayer = function(isMultiplayer){
        self.config.isMultiplayer = isMultiplayer;
    };

    self.setDifficulty = function(difficulty){
        self.config.difficulty = difficulty;
    };

    self.resume = function(){
        gameStopped = false;
        self.startTimer(); // Restart the timer if game is resumed
    };

    self.pause = function(){
        gameStopped = true;
        clearInterval(timer); // Stop the timer if game is paused
    };
};

// Utility functions to handle user input and game setup
document.addEventListener('keydown', function(event) {
    switch(event.key.toLowerCase()){
        case self.config.controls.Player1.up:
            player1Up = true;
            break;
        case self.config.controls.Player1.down:
            player1Down = true;
            break;
        case self.config.controls.Player2.up:
            player2Up = true;
            break;
        case self.config.controls.Player2.down:
            player2Down = true;
            break;
    }
});

document.addEventListener('keyup', function(event) {
    switch(event.key.toLowerCase()){
        case self.config.controls.Player1.up:
            player1Up = false;
            break;
        case self.config.controls.Player1.down:
            player1Down = false;
            break;
        case self.config.controls.Player2.up:
            player2Up = false;
            break;
        case self.config.controls.Player2.down:
            player2Down = false;
            break;
    }
});

