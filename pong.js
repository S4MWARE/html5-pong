var Pong = function(canvasId) {
    var self = this;
    var canvas = document.getElementById(canvasId);
    var canvasContext = canvas.getContext('2d');

    // Default configuration
    self.config = {
        isMultiplayer: false,
        difficulty: 0.1,
        finalScore: 5,
        isTimedMode: false,
        timeDuration: 60,
        names: {
            Player1: 'Player 1',
            Player2: 'Player 2'
        },
        colors: {
            background: '#000',
            bat: '#FFF',
            ball: '#FFF',
            scores: '#FFF'
        },
        controls: {
            Player1: {
                up: 'ArrowUp',
                down: 'ArrowDown'
            },
            Player2: {
                up: 'w',
                down: 's'
            }
        }
    };

    var gameStopped = true;
    var canvasWidth = 800;
    var canvasHeight = 600;
    var batWidth = 10;
    var batHeight = 100;
    var ballRadius = 10;
    var gameSpeed = 4;
    var drawRate = 20;
    var scoreFontSize = 30;
    var remainingTime = self.config.timeDuration;
    var scorePlayer1 = 0;
    var scorePlayer2 = 0;
    var Ball = { x: canvasWidth / 2, y: canvasHeight / 2 };
    var BallVelocity = { x: gameSpeed, y: gameSpeed };
    var Player1Bat = { x: batWidth / 2, y: canvasHeight / 2 };
    var Player2Bat = { x: canvasWidth - batWidth / 2, y: canvasHeight / 2 };

    // Setup canvas
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            self.start();
        } else if (event.key === 'p') {
            self.pause();
        }
    });

    // Initialize keyboard input
    self.keyboardIO = {
        Player1Up: false,
        Player1Down: false,
        Player2Up: false,
        Player2Down: false
    };

    document.addEventListener('keydown', function(event) {
        if (event.key === self.config.controls.Player1.up) self.keyboardIO.Player1Up = true;
        if (event.key === self.config.controls.Player1.down) self.keyboardIO.Player1Down = true;
        if (event.key === self.config.controls.Player2.up) self.keyboardIO.Player2Up = true;
        if (event.key === self.config.controls.Player2.down) self.keyboardIO.Player2Down = true;
    });

    document.addEventListener('keyup', function(event) {
        if (event.key === self.config.controls.Player1.up) self.keyboardIO.Player1Up = false;
        if (event.key === self.config.controls.Player1.down) self.keyboardIO.Player1Down = false;
        if (event.key === self.config.controls.Player2.up) self.keyboardIO.Player2Up = false;
        if (event.key === self.config.controls.Player2.down) self.keyboardIO.Player2Down = false;
    });

    function resetBall() {
        Ball.x = canvasWidth / 2;
        Ball.y = canvasHeight / 2;
        BallVelocity.x = gameSpeed;
        BallVelocity.y = gameSpeed;
    }

    function updateGame() {
        // Move ball
        Ball.x += BallVelocity.x;
        Ball.y += BallVelocity.y;

        // Ball collision with top or bottom walls
        if (Ball.y - ballRadius < 0 || Ball.y + ballRadius > canvasHeight) {
            BallVelocity.y = -BallVelocity.y;
        }

        // Ball collision with player bats
        if (Ball.x - ballRadius < batWidth && Ball.y > Player1Bat.y - batHeight / 2 && Ball.y < Player1Bat.y + batHeight / 2) {
            BallVelocity.x = -BallVelocity.x;
        }
        if (Ball.x + ballRadius > canvasWidth - batWidth && Ball.y > Player2Bat.y - batHeight / 2 && Ball.y < Player2Bat.y + batHeight / 2) {
            BallVelocity.x = -BallVelocity.x;
        }

        // Player bat movement
        if (self.keyboardIO.Player1Up) Player1Bat.y -= gameSpeed;
        if (self.keyboardIO.Player1Down) Player1Bat.y += gameSpeed;
        if (self.keyboardIO.Player2Up) Player2Bat.y -= gameSpeed;
        if (self.keyboardIO.Player2Down) Player2Bat.y += gameSpeed;

        // Ensure bats don't go out of bounds
        if (Player1Bat.y - batHeight / 2 < 0) Player1Bat.y = batHeight / 2;
        if (Player1Bat.y + batHeight / 2 > canvasHeight) Player1Bat.y = canvasHeight - batHeight / 2;
        if (Player2Bat.y - batHeight / 2 < 0) Player2Bat.y = batHeight / 2;
        if (Player2Bat.y + batHeight / 2 > canvasHeight) Player2Bat.y = canvasHeight - batHeight / 2;

        // Update scores
        if (Ball.x - ballRadius < 0) {
            scorePlayer2++;
            resetBall();
        }
        if (Ball.x + ballRadius > canvasWidth) {
            scorePlayer1++;
            resetBall();
        }

        // Game over check
        if (scorePlayer1 >= self.config.finalScore || scorePlayer2 >= self.config.finalScore) {
            gameStopped = true;
            if (scorePlayer1 >= self.config.finalScore) alert(self.config.names.Player1 + ' wins!');
            else alert(self.config.names.Player2 + ' wins!');
            scorePlayer1 = 0;
            scorePlayer2 = 0;
            resetBall();
        }

        if (!gameStopped) setTimeout(updateGame, drawRate);
    }

    function drawGame() {
        canvasContext.fillStyle = self.config.colors.background;
        canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);

        canvasContext.fillStyle = self.config.colors.bat;
        canvasContext.fillRect(Player1Bat.x - batWidth / 2, Player1Bat.y - batHeight / 2, batWidth, batHeight);
        canvasContext.fillRect(Player2Bat.x - batWidth / 2, Player2Bat.y - batHeight / 2, batWidth, batHeight);

        canvasContext.fillStyle = self.config.colors.ball;
        canvasContext.beginPath();
        canvasContext.arc(Ball.x, Ball.y, ballRadius, 0, Math.PI * 2, true);
        canvasContext.closePath();
        canvasContext.fill();

        canvasContext.fillStyle = self.config.colors.scores;
        canvasContext.font = scoreFontSize + 'px Arial';
        canvasContext.fillText(scorePlayer1, 50, 50);
        canvasContext.fillText(scorePlayer2, canvasWidth - 50, 50);

        if (!gameStopped) requestAnimationFrame(drawGame);
    }

    self.start = function() {
        gameStopped = false;
        updateGame();
        drawGame();
    };

    self.pause = function() {
        gameStopped = true;
    };

    self.setConfiguration = function(config) {
        Object.assign(self.config, config);
    };
};
