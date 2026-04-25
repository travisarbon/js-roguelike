/**
 * Created by Travis on 8/6/2016.
 */
$(document).ready(function(){
    (function(){
        var TILE_SIZE = 10;
        var GRID_COLS = 100;
        var GRID_ROWS = 60;

        function deepCloneMap(arr) {
            var result = [];
            for (var i = 0; i < arr.length; i++) {
                var tile = arr[i];
                result.push({
                    type: tile.type,
                    hp: tile.hp,
                    attack: tile.attack,
                    hidden: tile.hidden,
                    passable: tile.passable,
                    player: tile.player,
                    x: tile.x,
                    y: tile.y
                });
            }
            return result;
        }

        function makeTile(type, x, y, opts) {
            return {
                type: type,
                hp: (opts && opts.hp) || 0,
                attack: (opts && opts.attack) || 0,
                hidden: false,
                passable: (opts && opts.passable) || false,
                player: (opts && opts.player) || false,
                x: x,
                y: y
            };
        }

        function findPlayerIndex(arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].type === "player") return i;
            }
            return -1;
        }

        var Roguelike = React.createClass({

            getInitialState: function(){
                return {
                    fog: false,
                    beatBoss: false,
                    dead: false,
                    mapWidth: 1000,
                    mapHeight: 600,
                    mapContents: deepCloneMap(DEFAULT_MAP),
                    playerIndex: findPlayerIndex(DEFAULT_MAP),
                    depth: 1,
                    playerHP: 100,
                    playerAttack: 10,
                    playerLevel: 1,
                    playerNeededXP: 50,
                    tool: {
                        type: "wall",
                        hp: 0,
                        attack: 0,
                        hidden: false,
                        passable: false,
                        player: false
                    }
                };
            },

            componentDidMount: function(){
                this._handlePlayer = this.handlePlayer;
                window.addEventListener('keydown', this._handlePlayer, false);
                this.drawMap();
            },

            componentWillUnmount: function(){
                window.removeEventListener('keydown', this._handlePlayer, false);
            },

            buildMap: function(width, height){
                var cols = width / TILE_SIZE;
                var rows = height / TILE_SIZE;
                var arr = [];
                for (var row = 0; row < rows; row++) {
                    for (var col = 0; col < cols; col++) {
                        arr.push(makeTile("empty", col * TILE_SIZE, row * TILE_SIZE, {passable: true}));
                    }
                }
                return arr;
            },

            drawMap: function(){
                this.checkVisible();
                var canvas = document.getElementById("game-canvas");
                var ctx = canvas.getContext("2d");
                for (var i = 0; i < this.state.mapContents.length; i++) {
                    var gameObject = this.state.mapContents[i];

                    if (gameObject.hidden === true) {
                        ctx.fillStyle = "black";
                    } else if (gameObject.type === "empty") {
                        ctx.fillStyle = "#e9e9e9";
                    } else if (gameObject.type === "wall") {
                        ctx.fillStyle = "grey";
                    } else if (gameObject.type === "player") {
                        ctx.fillStyle = "blue";
                    } else if (gameObject.type === "enemy") {
                        ctx.fillStyle = "red";
                    } else if (gameObject.type === "weapon") {
                        ctx.fillStyle = "yellow";
                    } else if (gameObject.type === "health") {
                        ctx.fillStyle = "green";
                    } else if (gameObject.type === "boss") {
                        ctx.fillStyle = "purple";
                    } else if (gameObject.type === "stairs") {
                        ctx.fillStyle = "orange";
                    }
                    ctx.fillRect(gameObject.x, gameObject.y, TILE_SIZE, TILE_SIZE);
                }
            },

            mouseClick: function(event){
                var canvas = $('#game-canvas');
                var canvasPosition = {
                    x: canvas.offset().left,
                    y: canvas.offset().top
                };
                var mouse = {
                    x: event.pageX - canvasPosition.x,
                    y: event.pageY - canvasPosition.y
                };
                this.findMouseSquare(mouse);
            },

            findMouseSquare: function(mouse){
                var arr = deepCloneMap(this.state.mapContents);
                var tool = JSON.parse(JSON.stringify(this.state.tool));
                var newPlayerIndex = this.state.playerIndex;
                for (var i = 0; i < arr.length; i++) {
                    if (mouse.x >= arr[i].x && mouse.x < arr[i].x + TILE_SIZE &&
                        mouse.y >= arr[i].y && mouse.y < arr[i].y + TILE_SIZE) {
                        arr[i].type = tool.type;
                        arr[i].hp = tool.hp;
                        arr[i].attack = tool.attack;
                        arr[i].passable = tool.passable;
                        arr[i].hidden = tool.hidden;
                        arr[i].player = tool.player;
                        if (tool.type === "player") {
                            newPlayerIndex = i;
                            for (var j = 0; j < arr.length; j++) {
                                if (arr[j].type === "player" && j !== i) {
                                    arr[j] = makeTile("empty", arr[j].x, arr[j].y, {passable: true});
                                }
                            }
                        }
                    }
                }
                this.setState({mapContents: arr, playerIndex: newPlayerIndex});
                requestAnimationFrame(this.drawMap);
            },

            switchTool: function(event){
                if (event.target === this.refs.player) {
                    this.setState({tool: {
                        type: "player",
                        hp: this.state.playerHP,
                        attack: this.state.playerAttack,
                        hidden: false,
                        passable: false,
                        player: true
                    }});
                } else if (event.target === this.refs.enemy) {
                    this.setState({tool: {
                        type: "enemy",
                        hp: 100 * this.state.depth,
                        attack: 10 * this.state.depth,
                        hidden: false,
                        passable: false,
                        player: false
                    }});
                } else if (event.target === this.refs.weapon) {
                    this.setState({tool: {
                        type: "weapon",
                        hp: 0,
                        attack: 0,
                        hidden: false,
                        passable: true,
                        player: false
                    }});
                } else if (event.target === this.refs.health) {
                    this.setState({tool: {
                        type: "health",
                        hp: 0,
                        attack: 0,
                        hidden: false,
                        passable: true,
                        player: false
                    }});
                } else if (event.target === this.refs.wall) {
                    this.setState({tool: {
                        type: "wall",
                        hp: 0,
                        attack: 0,
                        hidden: false,
                        passable: false,
                        player: false
                    }});
                } else if (event.target === this.refs.boss) {
                    this.setState({tool: {
                        type: "boss",
                        hp: 1000,
                        attack: 250,
                        hidden: false,
                        passable: false,
                        player: false
                    }});
                } else if (event.target === this.refs.empty) {
                    this.setState({tool: {
                        type: "empty",
                        hp: 0,
                        attack: 0,
                        hidden: false,
                        passable: true,
                        player: false
                    }});
                } else if (event.target === this.refs.stairs) {
                    this.setState({tool: {
                        type: "stairs",
                        hp: 0,
                        attack: 0,
                        hidden: false,
                        passable: true,
                        player: false
                    }});
                }
            },

            handlePlayer: function(event){
                if (this.state.dead || this.state.beatBoss) return;

                var key = event.keyCode;
                var playerIndexes = this.getPlayerIndex(key);
                var newIndex = playerIndexes.new;
                var oldIndex = playerIndexes.old;
                var arr = deepCloneMap(this.state.mapContents);

                if (arr[newIndex].passable === true) {
                    if (arr[newIndex].type === "health") {
                        this.setState({playerHP: this.state.playerHP + 20});
                    } else if (arr[newIndex].type === "weapon") {
                        this.setState({playerAttack: this.state.playerAttack + 20});
                    } else if (arr[newIndex].type === "stairs") {
                        this.setState({depth: this.state.depth + 1});
                        this.handleStairs();
                        return;
                    }
                    arr[newIndex] = makeTile("player", arr[newIndex].x, arr[newIndex].y, {
                        hp: this.state.playerHP,
                        attack: this.state.playerAttack,
                        player: true
                    });
                    arr[oldIndex] = makeTile("empty", arr[oldIndex].x, arr[oldIndex].y, {passable: true});
                    this.setState({mapContents: arr, playerIndex: newIndex});
                } else if (arr[newIndex].type === "enemy" || arr[newIndex].type === "boss") {
                    var battleResults = this.handleEnemy(arr[newIndex], arr[oldIndex]);
                    arr[newIndex] = battleResults[0];
                    arr[oldIndex] = battleResults[1];
                    this.setState({mapContents: arr});
                }
                requestAnimationFrame(this.drawMap);
            },

            handleEnemy: function(enemy, player){
                var wasBoss = enemy.type === "boss";
                var damage = Math.floor(Math.random() * (this.state.playerAttack / 2 + 1)) + Math.floor(this.state.playerAttack / 2);
                enemy.hp = enemy.hp - damage;

                if (enemy.hp <= 0) {
                    enemy = makeTile("empty", enemy.x, enemy.y, {passable: true});
                    this.setState({playerNeededXP: this.state.playerNeededXP - 25});
                    this.didPlayerLevelUp();
                    if (wasBoss) {
                        this.handleVictory();
                    }
                } else {
                    var newHP = this.state.playerHP - enemy.attack;
                    this.setState({playerHP: newHP});
                    if (newHP <= 0) {
                        this.setState({dead: true});
                    }
                }
                return [enemy, player];
            },

            handleVictory: function(){
                this.setState({beatBoss: true});
            },

            handleStairs: function(){
                var newMap = this.buildMap(this.state.mapWidth, this.state.mapHeight);
                var depth = this.state.depth;
                var cols = this.state.mapWidth / TILE_SIZE;
                var rows = this.state.mapHeight / TILE_SIZE;

                var playerCol = Math.floor(Math.random() * (cols - 2)) + 1;
                var playerRow = Math.floor(Math.random() * (rows - 2)) + 1;
                var playerIdx = playerRow * cols + playerCol;
                newMap[playerIdx] = makeTile("player", playerCol * TILE_SIZE, playerRow * TILE_SIZE, {
                    hp: this.state.playerHP,
                    attack: this.state.playerAttack,
                    player: true
                });

                var numEnemies = 5 + depth * 2;
                for (var e = 0; e < numEnemies; e++) {
                    var ec = Math.floor(Math.random() * (cols - 2)) + 1;
                    var er = Math.floor(Math.random() * (rows - 2)) + 1;
                    var ei = er * cols + ec;
                    if (newMap[ei].type === "empty") {
                        newMap[ei] = makeTile("enemy", ec * TILE_SIZE, er * TILE_SIZE, {
                            hp: 100 * depth,
                            attack: 10 * depth
                        });
                    }
                }

                var numHealth = 3 + depth;
                for (var h = 0; h < numHealth; h++) {
                    var hc = Math.floor(Math.random() * (cols - 2)) + 1;
                    var hr = Math.floor(Math.random() * (rows - 2)) + 1;
                    var hi = hr * cols + hc;
                    if (newMap[hi].type === "empty") {
                        newMap[hi] = makeTile("health", hc * TILE_SIZE, hr * TILE_SIZE, {passable: true});
                    }
                }

                var numWeapons = 1 + Math.floor(depth / 2);
                for (var w = 0; w < numWeapons; w++) {
                    var wc = Math.floor(Math.random() * (cols - 2)) + 1;
                    var wr = Math.floor(Math.random() * (rows - 2)) + 1;
                    var wi = wr * cols + wc;
                    if (newMap[wi].type === "empty") {
                        newMap[wi] = makeTile("weapon", wc * TILE_SIZE, wr * TILE_SIZE, {passable: true});
                    }
                }

                var numWalls = Math.floor(cols * rows * 0.2);
                for (var wallIdx = 0; wallIdx < numWalls; wallIdx++) {
                    var wallC = Math.floor(Math.random() * (cols - 2)) + 1;
                    var wallR = Math.floor(Math.random() * (rows - 2)) + 1;
                    var wallI = wallR * cols + wallC;
                    if (newMap[wallI].type === "empty") {
                        newMap[wallI] = makeTile("wall", wallC * TILE_SIZE, wallR * TILE_SIZE);
                    }
                }

                if (depth >= 3) {
                    var bc = Math.floor(Math.random() * (cols - 2)) + 1;
                    var br = Math.floor(Math.random() * (rows - 2)) + 1;
                    var bi = br * cols + bc;
                    if (newMap[bi].type === "empty") {
                        newMap[bi] = makeTile("boss", bc * TILE_SIZE, br * TILE_SIZE, {
                            hp: 1000,
                            attack: 250
                        });
                    }
                }

                var sc = Math.floor(Math.random() * (cols - 2)) + 1;
                var sr = Math.floor(Math.random() * (rows - 2)) + 1;
                var si = sr * cols + sc;
                if (newMap[si].type === "empty") {
                    newMap[si] = makeTile("stairs", sc * TILE_SIZE, sr * TILE_SIZE, {passable: true});
                }

                this.setState({mapContents: newMap, playerIndex: playerIdx});
                requestAnimationFrame(this.drawMap);
            },

            resetGame: function(){
                this.setState({
                    fog: false,
                    beatBoss: false,
                    dead: false,
                    depth: 1,
                    playerHP: 100,
                    playerAttack: 10,
                    playerLevel: 1,
                    playerNeededXP: 50,
                    mapContents: deepCloneMap(DEFAULT_MAP),
                    playerIndex: findPlayerIndex(DEFAULT_MAP)
                });
                requestAnimationFrame(this.drawMap);
            },

            didPlayerLevelUp: function(){
                if (this.state.playerNeededXP <= 0) {
                    this.setState({
                        playerHP: this.state.playerHP + 100,
                        playerAttack: this.state.playerAttack + 20,
                        playerLevel: this.state.playerLevel + 1,
                        playerNeededXP: this.state.playerLevel * 50
                    });
                }
            },

            getPlayerIndex: function(key){
                var oldIndex = this.state.playerIndex;
                var newIndex = oldIndex;

                if (key === 38 && typeof(this.state.mapContents[oldIndex - GRID_COLS]) !== "undefined") {
                    newIndex = oldIndex - GRID_COLS;
                } else if (key === 40 && typeof(this.state.mapContents[oldIndex + GRID_COLS]) !== "undefined") {
                    newIndex = oldIndex + GRID_COLS;
                } else if (key === 37 && typeof(this.state.mapContents[oldIndex - 1]) !== "undefined" && (oldIndex % GRID_COLS) !== 0) {
                    newIndex = oldIndex - 1;
                } else if (key === 39 && typeof(this.state.mapContents[oldIndex + 1]) !== "undefined" && ((oldIndex - (GRID_COLS - 1)) % GRID_COLS) !== 0) {
                    newIndex = oldIndex + 1;
                }
                return {"new": newIndex, "old": oldIndex};
            },

            toggleFog: function(){
                this.setState({fog: !this.state.fog});
                requestAnimationFrame(this.drawMap);
            },

            checkVisible: function(){
                var arr = deepCloneMap(this.state.mapContents);
                if (this.state.fog === true) {
                    for (var k = 0; k < arr.length; k++) {
                        arr[k].hidden = true;
                    }
                    var playerIdx = this.state.playerIndex;
                    var visibilityArr = [0, -1, -2, -3, -4, 1, 2, 3, 4,
                        -99, -98, -97, 99, 98, 97,
                        -100, -101, -102, -103, 100, 101, 102, 103,
                        -199, -198, 199, 198,
                        -200, -201, -202, 200, 201, 202,
                        -299, 299, -300, -301, 300, 301,
                        -400, 400];
                    for (var j = 0; j < visibilityArr.length; j++) {
                        var idx = playerIdx + visibilityArr[j];
                        if (idx >= 0 && idx < arr.length) {
                            arr[idx].hidden = false;
                        }
                    }
                } else {
                    for (var l = 0; l < arr.length; l++) {
                        arr[l].hidden = false;
                    }
                }
                this.setState({mapContents: arr});
            },

            exportMap: function(){
                var data = JSON.stringify(this.state.mapContents);
                if (window.prompt) {
                    window.prompt("Copy map data (Ctrl+C):", data);
                }
            },

            render: function(){
                var overlay = null;
                if (this.state.dead) {
                    overlay = <div className="game-overlay"><h1>Game Over</h1><p>You have been slain on floor {this.state.depth}.</p><button onClick={this.resetGame}>Play Again</button></div>;
                } else if (this.state.beatBoss) {
                    overlay = <div className="game-overlay"><h1>Victory!</h1><p>You defeated the boss on floor {this.state.depth}!</p><button onClick={this.resetGame}>Play Again</button></div>;
                }
                return(
                    <div id="game">
                        <div className="status-menu">
                            <h3>Floor {this.state.depth}</h3>
                            <h3>Player Status</h3>
                            <ul>
                                <li>{"HP: " + this.state.playerHP}</li>
                                <li>{"Attack: " + this.state.playerAttack}</li>
                                <li>{"Level: " + this.state.playerLevel}</li>
                                <li>{"Next Level: " + this.state.playerNeededXP + "xp"}</li>
                            </ul>
                            <h3>Editor Status</h3>
                            <ul>
                                <li>{"Current Tool: " + this.state.tool.type}</li>
                                <li><button ref="player" onClick={this.switchTool}>Player</button></li>
                                <li><button ref="weapon" onClick={this.switchTool}>Weapon</button></li>
                                <li><button ref="health" onClick={this.switchTool}>Health</button></li>
                                <li><button ref="wall" onClick={this.switchTool}>Wall</button></li>
                                <li><button ref="stairs" onClick={this.switchTool}>Stairs</button></li>
                                <li><button ref="enemy" onClick={this.switchTool}>Enemy</button></li>
                                <li><button ref="boss" onClick={this.switchTool}>Boss</button></li>
                                <li><button ref="empty" onClick={this.switchTool}>Empty</button></li>
                            </ul>
                            <h3>Game Status</h3>
                            <ul>
                                <li><button onClick={this.toggleFog}>Toggle Fog</button></li>
                                <li><button onClick={this.resetGame}>Reset Game</button></li>
                                <li><button onClick={this.exportMap}>Export Map</button></li>
                            </ul>
                        </div>
                        <canvas id="game-canvas" width="1000" height="600" onClick={this.mouseClick}></canvas>
                        {overlay}
                    </div>
                );
            }
        });
        ReactDOM.render(<div><Roguelike/></div>, document.getElementById("content"));
    })();
});
