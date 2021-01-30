const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const exphbs = require('express-handlebars');
const PORT = 3000;
const users = require('./Users');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userDisconnect, getUsersInRoom} = require('./utils/users');
const botName = 'ConnecBot';
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const multer = require('multer');
const upload = multer();
const connectDB = require('./db');
// Import route
const authRoute = require('./views/routes/auth');
const dotenv = require('dotenv');
const session = require('express-session');
const {UserModel, Game} = require('./Users');

dotenv.config({path: './config.env'});
connectDB(); // connect to server

const SESSION_AGE = 1000 * 60 * 60 * 2; // 2 hrs

// express session
app.use(session({
    name: 'test',
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: SESSION_AGE}
}));

// Body Parser MW
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// public css/imgs
app.use(upload.array());
app.use(express.static('public'));

// Route middlewares
app.use('/api/user', authRoute);

// Handlebars MW
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',

    // functions for handlebars
    helpers: {
        divideAndRound: function(num1, num2) {
            if(num1 === 0 && num2 === 0) return 0
            else if(num1 > 0 && num2 === 0) return num1.toFixed(2).toString()
            return (num1 / num2).toFixed(2).toString();
        },

        formatDate: function(date) {
            let dateVar = new Date(date);
            return dateVar.toDateString();
        },

        accountCreated: function(dateCreated) {
            let date = new Date(dateCreated);
            return date.toDateString();
        },

        findColour: function(piece, mColour, oColour) {
            if (piece === 0) return "white";
            else if (piece === 1) return mColour;
            else return oColour;
        },

        checkStatus: function(friendname, user) {
            if(user.friendsList.includes(friendname) || user.name === friendname) return true;
            else return false;
        },
        checkPrivacy: function(profileType) {
            if(profileType.toLowerCase() === "private") return true;
            else return false;
        },
        whichColor: function(player1, player2, currentUser, value, c1, c2) {
            if(value == 0) return 'white';
            if(player1 == currentUser) {
                if(value == 1) {
                    return c1;
                } else {
                    return c2;
                }
            } else if (player2 == currentUser) {
                if(value == 2) {
                    return c1;
                } else {
                    return c2;
                }
            } else {
                if(value === 1) return 'red';
                else if(value === 2) return 'black';
            }
        },
        whosTurnColor: function(whosTurn, player1, player2, user) {
            if(whosTurn == user) return '`{{currentUser.mColour}}`';
            else if (user == player1 || user == player2) return '`{{currentUser.oColour}}`';
            else return 'black';
        },
        winnerColor: function(winner, loser, user) {
            if(user == winner) {
                return '{{currentUser.mColour}}';
            } else if (user == loser) {
                return '{{currentUser.oColour}}';
            } else return 'black';
        },
        isWinner: function(user, winner) {
            if(user == winner) return '#B0FFB0';
            else return '#FFB0B0';
        },
        whosTurnToPlay: function(currentUser, whosTurn) {
            if(currentUser == whosTurn) return 'Your turn!';
            else return whosTurn + ' turn!';

        },
        whatColour: function(whosTurn, user, player1, player2, col1, col2) {
            if(user == player1 || user == player2) {
                if(whosTurn == user) return col1;
                else return col2;
            } else return 'black';
        },
        whosTurn: function(whosTurn, user) {
            if(user == whosTurn) return 'Your';
            else return whosTurn + "'s";
        },
        highlightPiece: function(x, y, array) {
            let x1 = array[0], y1 = array[1];
            let x2 = array[2], y2 = array[3];
            let x3 = array[4], y3 = array[5];
            let x4 = array[6], y4 = array[7];
            if((x === x1 && y === y1) || (x === x2 && y === y2) || (x === x3 && y === y3) || (x === x4 && y === y4)) {
                return 'box-shadow: 0px 0px 2px 4px white;'
            } else return '';
        },
        getChatID: function(user, friend) {
            let chatID;
            user.chats.forEach(chat => {
                if(chat[1].includes(friend)) chatID = chat[0];
            });
            return chatID.toString();
        },
        isAFriend: function(friend, user) {
            if(user.friendsList.includes(friend)) return true;
            else return false;
        },
        inChatroom: function(room, roomToCheck) {
            if(room.toString() === roomToCheck.toString()) return true;
            return false;
        }
    }
});

app.engine('.hbs', hbs.engine); // template engine
app.set('view engine', '.hbs');

// Routes
app.use('/', require('./views/routes/index')); // handles switching pages

// set static folder
app.use('/', express.static(path.join(__dirname, 'public')));

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}\nYou can visit the site locally at http://localhost:9999`));

async function createGame(gameType, privacyType) {
    // Generate a new game (that gets saved to the DB)
    let board = new users.Game({lobbyType: gameType, privacyType: privacyType});
    await board.save();
    return board;
}

// Queues for games
var playerQueueRanked = [];
var playerQueueCasual = [];

var pendingGames =[];
var activeGames = [];
getActiveGames();

async function getActiveGames() {
    let arr = await users.Game.find({active: true});
    for(const games in arr) {
        activeGames.push(games._id);
    }
}

// Socket stuff
io.on('connection', socket => {
    // join a chat room
    socket.on('join-room', async(room, username) => {
        let gameRoom  = await users.Game.findOne({_id: room});
        if(gameRoom.player1 != username && gameRoom.player2 != username) username = "[Spectator] " + username;
        let player = userJoin(socket.id, username, room);
        socket.nickname = username;
        socket.room = room;
        await socket.join(room);

        // welcome
        let currentUsers = getUsersInRoom(player.room);
        let s = "";
        let i = 0;
        currentUsers.forEach(u => {
            s += u.name;
            if(i < currentUsers.length-1) {
                s += ", ";
            }
            i++;
        });

        socket.emit('message', formatMessage(botName,username + ', welcome to ConnecFTW!\n Currently connected: ' + s)); // to client

        // user connect
        socket.to(player.room).emit('message', formatMessage(botName, `${player.name} has joined the game!`)); // to everyone but client
        if(gameRoom.gameOver) {
            socket.emit('highlight-winner', gameRoom.winner, gameRoom.winningPieces);
            socket.emit('game-over', gameRoom.winner);
        }
    });

    socket.on('join-lobby', async (username) => {
        userJoin(socket.id, username, 'lobby');
        await socket.join('lobby');
    });

    // join a chat room
    socket.on('join-chat', async(room, username) => {
        let chatRoom = await users.Chat.findOne({_id: room});
        let isMember = false;
        if(chatRoom) {
            chatRoom.members.forEach(member => {
                if(member == username) {
                    isMember = true;
                }
            });
        }

        if(isMember) {
            let player = userJoin(socket.id, username, room);
            socket.nickname = username;
            socket.room = room;
            await socket.join(room);

            // welcome
            let currentUsers = getUsersInRoom(player.room);
            let s = "";
            let i = 0;
            currentUsers.forEach(u => {
                s += u.name;
                if(i < currentUsers.length-1) {
                    s += ", ";
                }
                i++;
            });

            socket.emit('message', formatMessage(botName,'Currently connected: ' + s)); // to client

            // user connect
            socket.to(player.room).emit('message', formatMessage(botName, `${player.name} has joined the game!`)); // to everyone but client
        } else {
            socket.emit('not-a-member'); // to client
        }
    });

    // listen for chat message
    socket.on('chat-message', async(msg, user, room) => {
        let gameRoom  = await users.Game.findOne({_id: room});
        if(gameRoom) {
            if(gameRoom.player1 != user && gameRoom.player2 != user) user = "[Spectator] " + user;
            gameRoom.chatLogs.push(formatMessage(user, msg));
            await gameRoom.save();
        } else {
            let chatRoom  = await users.Chat.findOne({_id: room});
            chatRoom.chatLogs.push(formatMessage(user, msg));
            await chatRoom.save();
        }

        io.to(room).emit('message', formatMessage(user, msg)) // emit to everybody
    });

    // feed game chat logs to user
    socket.on('get-messages', async(room, type) => {
        if(type) {
            let gameRoom  = await users.Game.findOne({_id: room});
            socket.emit('recieve-messages', gameRoom.chatLogs);
        } else {
            let chatRoom  = await users.Chat.findOne({_id: room});
            socket.emit('recieve-messages', chatRoom.chatLogs);
        }
    });

    // user disconnect
    socket.on('disconnect', () => {
        let player = userDisconnect(socket.id);
        if(player) leaveQueue(player.name);
        if(player) {
            io.to(player.room).emit('message', formatMessage(botName, `${player.name} has left the game.`));
        }
    });

    // user leaves a queue
    socket.on('leave-queue', (name) => {
        userDisconnect(socket.id);
        leaveQueue(name);
    });

    function leaveQueue(name) {
        if(playerQueueRanked.indexOf(name) >= 0) playerQueueRanked.splice(playerQueueRanked.indexOf(name), 1);
        else if(playerQueueCasual.indexOf(name) >= 0) playerQueueCasual.splice(playerQueueCasual.indexOf(name), 1);
    }

    // user is searching for a game
    socket.on('searching', async (gameType, user) => {
        socket.name = user;
        if(gameType === 'ranked') {
            playerQueueRanked.push(socket.name);
            if(playerQueueRanked.length === 1) {
                let newGame = await createGame(gameType, false);
                pendingGames.push(newGame._id);
                await socket.join(newGame._id);
                socket.room = newGame._id;
            } else if(playerQueueRanked.length >= 2) {
                let id = pendingGames[pendingGames.length-1];
                await socket.join(id);
                socket.room = id;
                io.to(socket.room).emit('game-found', id);
                playerQueueRanked.splice(0, 2);
            }
        } else if (gameType === 'casual') {
            playerQueueCasual.push(socket.name);
            if(playerQueueCasual.length === 1) {
                let newGame = await createGame(gameType, false);
                pendingGames.push(newGame._id);
                await socket.join(newGame._id);
                socket.room = newGame._id;
            } else if(playerQueueCasual.length >= 2) {
                let id = pendingGames[pendingGames.length-1];
                await socket.join(id);
                socket.room = id;
                io.to(socket.room).emit('game-found', id);
                playerQueueCasual.splice(0, 2);
            }
        }
    });

    // game has been found, is getting activated
    socket.on('activate-game', async(gameID, user) => {
        let alreadyActivated = 1;
        let curUser = await users.UserModel.findOne({name: user});
        let isValidGame = 0;
        for (const game of pendingGames) {
            if(game == gameID) {
                activeGames.push(game);
                pendingGames.splice(pendingGames.indexOf(game), 1);
                let newGame = await users.Game.findOne({_id: gameID});
                if(newGame.player1 === "ConnecBot") newGame.player1 = user;
                await newGame.save();
                alreadyActivated = 0;
                isValidGame = 1;
                break;
            }
        }

        await sleep(500); // sleep for half a second in order to make sure that the game has been updated from the first user

        if(alreadyActivated) {
            let newGame = await users.Game.findOne({_id: gameID});
            if (newGame.player2 === "ConnecBot") {
                newGame.active = true;
                newGame.player2 = user;
                let players = [newGame.player1, user];
                let turn = players[Math.round(Math.random())];
                newGame.whosTurn = turn;
                await newGame.save();
            }
            io.to(socket.room).emit('game-ready');
        }

        if(isValidGame || alreadyActivated) {
            curUser.currentGames.push(gameID);
            await curUser.save();
        }
    });

    // Game is accepted
    socket.on('accept-game', async(gameID) => {
        let game = await users.Game.findOne({_id: gameID});

        await sleep(300);

        let p1 = await users.UserModel.findOne({name: game.player1});
        let p2 = await users.UserModel.findOne({name: game.player2});
        game.active = true;
        await game.save();

        p1.currentGames.push(game._id);
        p2.currentGames.push(game._id);

        await p1.save();
        await p2.save();

        socket.emit('game-ready');
    });

    // user places a piece on the gameboard
    socket.on('place-piece', async(x,y,user, room) => {
        let gameboard = await users.Game.findOne({_id: room});
        if(gameboard.active === false) {
            socket.emit('message', formatMessage(botName,user + ', this game is not active. You cannot place a piece.'));
        } else if(gameboard.whosTurn == user) {
            // if it is the user's turn
            // confirm placement
            let tempBoard = gameboard.board;
            let isValidSpot = findEmptySpot(y, tempBoard);
            let player;
            if(isValidSpot !== -1) {
                if(gameboard.player1 == user) {
                    tempBoard[isValidSpot][y] = 1;
                    await users.Game.findOneAndUpdate(
                        {_id: room},
                        {$set: {board: tempBoard}}
                        );

                    gameboard.board[isValidSpot][y] = 1;
                    player = 1;
                    user = gameboard.player1;
                    gameboard.whosTurn = gameboard.player2;
                } else {
                    tempBoard[isValidSpot][y] = 2;
                    await users.Game.findOneAndUpdate(
                        {_id: room},
                        {$set: {board: tempBoard}}
                    );

                    player = 2;
                    gameboard.whosTurn = gameboard.player1;
                }
                gameboard.moves.push([isValidSpot, y, player]);
                await gameboard.save();

                let gameStatus = isGameOver(gameboard.board, player);
                // if the game is over
                if (gameStatus.length > 0) {
                    activeGames.splice(activeGames.indexOf(gameboard._id), 1);
                    gameboard.active = false;
                    await users.Game.findOneAndUpdate(
                        {_id: gameboard._id},
                        {$set: {winningPieces: gameStatus}}
                    );
                    if(player === 1) {
                        gameboard.winner = gameboard.player1;
                        gameboard.loser = gameboard.player2;
                    } else {
                        gameboard.winner = gameboard.player2;
                        gameboard.loser = gameboard.player1;
                    }
                    gameboard.gameOver = true;
                    await gameboard.save();
                    let uName;
                    if(user == gameboard.player1) uName = gameboard.player2;
                    else uName = gameboard.player1;
                    let curUser = await users.UserModel.findOne({name: user});
                    let opponent = await users.UserModel.findOne({name: uName});
                    // if the game is ranked
                    if(gameboard.lobbyType === 'ranked' && gameboard.privacyType == 'false') {
                        // for user 1
                        curUser.pastTenGames.push(gameboard._id);
                        curUser.currentGames.splice(curUser.currentGames.indexOf(gameboard._id), 1);
                        await curUser.save();

                        if(curUser.pastTenGames.length > 10) curUser.pastTenGames.splice(0, 1);
                        if(user == gameboard.winner) curUser.wins += 1;
                        else curUser.losses += 1;
                        // for user 2
                        opponent.pastTenGames.push(gameboard._id);
                        opponent.currentGames.splice(opponent.currentGames.indexOf(gameboard._id), 1);
                        await opponent.save();
                        if(opponent.pastTenGames.length > 10) opponent.pastTenGames.splice(0, 1);
                        if(uName == gameboard.winner) opponent.wins += 1;
                        else opponent.losses += 1;
                    } else {
                        //user 1
                        curUser.currentGames.splice(curUser.currentGames.indexOf(gameboard._id), 1);
                        //user 2
                        opponent.currentGames.splice(opponent.currentGames.indexOf(gameboard._id), 1);
                    }
                    await curUser.save();
                    await opponent.save();
                    io.to(room).emit('message', formatMessage(botName, gameboard.winner + ' has won the game!'));
                } else io.to(room).emit('message', formatMessage(botName,user + ' placed a piece @ (' + (y+1) + ', ' + (6-isValidSpot) + ').'));
                io.to(room).emit('update-board', isValidSpot, y, user);
                if(gameboard.winner !== "ConnecBot") {
                    io.to(room).emit('game-over', gameboard.winner);
                    io.to(room).emit('highlight-winner', gameboard.winner, gameStatus);
                }
            } else {
                socket.emit('message', formatMessage(botName,user + ', this column is full!'));
            }
        } else if (gameboard.player1 == user || gameboard.player2 == user) {
            socket.emit('message', formatMessage(botName, user + ', it is not your turn to play!'));
        } else {
            socket.emit('message', formatMessage(botName,user + ', you cannot place a piece as a spectator'));
        }

    });

    // retrieve the gameboard in its currents state
    socket.on('retrieve-gameboard', async(room) => {
        let game = await users.Game.findOne({_id: room});
        socket.emit('recieve-gameboard', game);
        socket.emit('message', formatMessage(botName, 'Replaying the game...'));
    });

    socket.on('place-piece-fake', async(x,y,user, room, moveNumber) => {
        try {
            let gameboard = await users.Game.findOne({_id: room});
            if(gameboard.moves[moveNumber][2] === 1) { // when replay is done for the 2nd (and onwards) time, it spouts an error that isn't an error..?
                socket.emit('message', formatMessage(botName,gameboard.player1 + ' placed a piece @ (' + (y+1) + ', ' + (6-x) + ').'));
                socket.emit('update-board', x,y,gameboard.player1);
            } else {
                socket.emit('message', formatMessage(botName,gameboard.player2 + ' placed a piece @ (' + (y+1) + ', ' + (6-x) + ').'));
                socket.emit('update-board', x,y,gameboard.player2);
            }
        } catch(e) {
            console.log(e);
        }
    });

    // handles game over
    socket.on('finished', async(room) => {
        let gameboard = await users.Game.findOne({_id: room});
        let player;
        if(gameboard.player1 === gameboard.winner) player = 1;
        else player = 2;
        let gameStatus = isGameOver(gameboard.board, player);
        if(gameboard.forfeit) socket.emit('message', formatMessage(botName,gameboard.loser + ' forfeit the match.'));
        socket.emit('message', formatMessage(botName,gameboard.winner + ' won the match.'));
        socket.emit('game-over', gameboard.winner);
        socket.emit('highlight-winner', gameboard.winner, gameStatus);
    })

    // handles a game that is forfeit
    socket.on('forfeit', async(user, room) => {
        let gameboard = await users.Game.findOne({_id: room});

        if(user !== gameboard.player1 && user !== gameboard.player2) { // if the user is a spectator
            socket.emit('message', formatMessage(botName, user + ', nice try!'));
        } else if(gameboard.active) { // if the game is currently active
            //game over logic
            activeGames.splice(activeGames.indexOf(gameboard._id), 1);
            gameboard.active = false;
            gameboard.forfeit = true;
            gameboard.gameOver = true;
            let uName;
            if(user == gameboard.player1) {
                gameboard.winner = gameboard.player2;
                gameboard.loser = gameboard.player1;
                uName = gameboard.player2;
            } else {
                gameboard.winner = gameboard.player1;
                gameboard.loser = gameboard.player2;
                uName = gameboard.player1;
            }
            await gameboard.save();
            let curUser = await users.UserModel.findOne({name: user});
            let opponent = await users.UserModel.findOne({name: uName});
            // if the game is ranked, update W/L etc
            if(gameboard.privacyType === 'false' && gameboard.lobbyType =='ranked') {
                // for user 1
                 curUser.pastTenGames.push(gameboard._id);
                curUser.currentGames.splice(curUser.currentGames.indexOf(gameboard._id), 1);
                await curUser.save();
                if(curUser.pastTenGames.length > 10) curUser.pastTenGames.splice(0, 1);
                if(curUser.name == gameboard.winner) curUser.wins += 1;
                else curUser.losses += 1;
                // for user 2
                opponent.pastTenGames.push(gameboard._id);
                opponent.currentGames.splice(opponent.currentGames.indexOf(gameboard._id), 1);
                await opponent.save();
                if(opponent.pastTenGames.length > 10) opponent.pastTenGames.splice(0, 1);
                if(opponent.name == gameboard.winner) opponent.wins += 1;
                else opponent.losses += 1;
            } else {
                //user 1
                curUser.currentGames.splice(curUser.currentGames.indexOf(gameboard._id), 1);
                //user 2
                opponent.currentGames.splice(opponent.currentGames.indexOf(gameboard._id), 1);
            }
            await curUser.save();
            await opponent.save();

            // emits
            io.to(room).emit('message', formatMessage(botName, user + ' has forfeit the game!\n' + gameboard.winner + ' is the winner!'));
            io.to(room).emit('game-over', gameboard.winner);
        } else {
            socket.emit('message', formatMessage(botName, user + ', you cannot forfeit because the game is not active.'));
        }
    });
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// finds an empty spot vertically, depending on the x position
function findEmptySpot(y, board) {
    for (let i = 5; i >= 0; i--) {
        if(board[i][y] === 0) {
            return i;
        }
    }

    return -1;
}

// checks if the game is over
function isGameOver(gameBoard, currentPlayer) {
    let MAX_HEIGHT = 6;
    let MAX_WIDTH = 7;
    for (let i = MAX_HEIGHT-1; i >= 0; i--) {
        for (let j = 0; j < MAX_WIDTH-3; j++) {
            if (gameBoard[i][j] === currentPlayer && gameBoard[i][j+1] === currentPlayer && gameBoard[i][j+2] === currentPlayer && gameBoard[i][j+3] === currentPlayer) {
                return [i, j, i, j+1, i, j+2, i, j+3];
            }
        }
    }

    // vertical check
    for (let i = MAX_HEIGHT-1; i > 2 ; i--) {
        for (let j = 0; j < MAX_WIDTH; j++) {
            if (gameBoard[i][j] == currentPlayer && gameBoard[i-1][j] == currentPlayer && gameBoard[i-2][j] == currentPlayer && gameBoard[i-3][j] == currentPlayer) {
                return [i, j, i-1, j, i-2, j, i-3, j];
            }
        }
    }

    // right diagonal check
    for (let i = MAX_HEIGHT-1; i > 2; i--) {
        for (let j = 0; j < MAX_WIDTH-3; j++) {
            if (gameBoard[i][j] == currentPlayer && gameBoard[i-1][j+1] == currentPlayer && gameBoard[i-2][j+2] == currentPlayer && gameBoard[i-3][j+3] == currentPlayer) {
                return [i, j, i-1, j+1, i-2, j+2, i-3, j+3];
            }
        }
    }

    // left diagonal check
    for (let i = MAX_HEIGHT-1; i > 2; i--) {
        for (let j = 3; j < MAX_WIDTH; j++) {
            if (gameBoard[i][j] == currentPlayer && gameBoard[i-1][j-1] == currentPlayer && gameBoard[i-2][j-2] == currentPlayer && gameBoard[i-3][j-3] == currentPlayer) {
                return [i, j, i-1, j-1, i-2, j-2, i-3, j-3];
            }
        }
    }
    return [];
}