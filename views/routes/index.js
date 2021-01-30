const express = require('express');
const router = express.Router();
const script = [{script: '/script.js'}];
const {UserModel, Game, Chat} = require('../../Users');
const ObjectId = require('mongoose').Types.ObjectId;

// Landing page
// Get '/'
// checks if the user has a valid session, redirects to login if not
const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/login');
    } else {
        next();
    }
}

// checks if user has valid session, redirects to home screen if they do
const redirectHome = (req, res, next) => {
    if (req.session.userId) {
        res.redirect('/');
    } else {
        next();
    }
}

// little compare function to sort by online status
function compare(a, b) {
    if(a.status === "online" && b.status === "online") return 0;
    else if (a.status === "online" && b.status === "away") return 1;
    else if (a.status === "away" && b.status === "away") return 0;
    else if (a.status === "away" && b.status === "offline") return 1;
    else return -1;
}

// updates the status and session age
const updateStatus = async (req, res, next) => {
    const user = await UserModel.findOne({_id: req.session.userId});

    if (user) {
        req.session.maxAge = 1000 * 60 * 60 * 2;

        let fList = [];
        for (let User of user.friendsList) {
            let temp = await UserModel.findOne({name: User}).lean();
            fList.push(temp);
        }
        res.locals.username = user.name;
        res.locals.friendsList = fList.sort(compare).reverse();

        let rList = [];
        for (let User of user.incomingFriendRequests) {
            let temp = await UserModel.findOne({name: User}).lean();
            rList.push(temp);
        }
        res.locals.friendRequests = rList.sort(compare).reverse();

        if(user.isPasswordReset) res.locals.needsNewPassword = true;
    }

    next();
}

var user;

// gets a user's profile
const getUserProfile = async (req, res, next) => {
    user = await UserModel.findOne({_id: req.session.userId});
    next();
}

// gets a friend
const getFriend = async (req, res, next) => {
    user = await UserModel.findOne({name: req.params.user}).lean()
    let mainUser = await UserModel.findOne({_id: req.session.userId}).lean();

    if (mainUser) {
        res.locals.isFriend = !mainUser.friendsList.includes(user.name);
    }

    if (user) {
        res.locals.friend = user;
        next();
    } else {
        console.log("User doesn't exist...");
        res.redirect("/friends");
    }
}

// gets a game id
const getGameID = async (req, res, next) => {
    let cUser = await UserModel.findOne({_id: req.session.userId}).lean();
    let game = false;
    if(req.body.gameID && ObjectId.isValid(req.body.gameID)) {
        game = await Game.findOne({_id: req.body.gameID}).lean();
    } else if(req.params.gameID && ObjectId.isValid(req.params.gameID)) {
        game = await Game.findOne({_id: req.params.gameID}).lean();
    }

    if(game) {
        res.locals.game = game;
        res.locals.gameID = game._id;
        res.locals.currentUser = cUser.name;
        res.locals.gameExists = true;
        next();
    } else {
        res.locals.currentUser = cUser.name;
        res.locals.gameExists = false;
        next();
    }
}

// gets a chat id
const getChatID = async (req, res, next) => {
    let chat = await Chat.findOne({_id: req.params.chatID}).lean();
    let cUser = await UserModel.findOne({_id: req.session.userId}).lean();
    if(chat) {
        res.locals.chatID = chat._id;
        res.locals.currentUser = cUser.name;
        next();
    } else {
        res.cookie('errorMessage', 'You have no friends to chat with!\nTry searching for some!', {maxAge: 1000}).redirect("/friends");
    }
}

// gets a list of current games
const getGames = async(req, res, next) => {
    let currentUser = await UserModel.findOne({_id: req.session.userId}).lean();
    let userGames = currentUser.currentGames;
    let games = [];

    for (const gameID of userGames) {
        games.push(await Game.findOne({_id: gameID}).lean());
    }

    res.locals.username = currentUser.name;
    res.locals.myGames = games.reverse();
    res.locals.currentUserHere = currentUser;
    next();
}

// gets a list of past games
getPastGames = async(req, res, next) => {
    let currentUser = await UserModel.findOne({_id: req.session.userId}).lean();
    let userPastGames = currentUser.pastTenGames;
    let pastGames = [];
    for (const gameIDT of userPastGames) {
        pastGames.push(await Game.findOne({_id: gameIDT}).lean());
    }
    res.locals.pastGames = pastGames.reverse();
    res.locals.friend = await UserModel.findOne({name: req.params.user}).lean();
    next();
}

// home page
router.get('/',  redirectLogin, updateStatus, getGames, async(req, res) => {
    let pendingGames = [];
    let u = await UserModel.findOne({name: res.locals.username}).lean();
    for (const game of u.pendingGames) {
       pendingGames.push(await Game.findOne({_id: game}).lean());
    }

    if(res.locals.needsNewPassword) return res.redirect('/account/profileSettings');
    else return res.render('./layouts/index', {active: {Index: true, LoggedIn: true}, scripts: script, myGames: res.locals.myGames, username: res.locals.username, currentUserPlayer: res.locals.currentUserHere, pendingGames: pendingGames});
});

// parses error message in cookies
function parseCookies (rc) {
    let list = {};

    rc && rc.split(';').forEach(function( cookie ) {
        let parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

// Login page
router.get('/login',  redirectHome, updateStatus, (req, res) => {
    let errMsg = req.headers.cookie;
    errMsg = parseCookies(errMsg).errorMessage;
    if(errMsg === undefined) errMsg = '';
    res.render('./layouts/login', {active: {Login: true, LoggedIn: false}, scripts: script, message: errMsg});
});

// gets the lobby page
router.post('/lobby',  redirectLogin, updateStatus, getGames,(req, res) => {
    let gameType = req.body.gamemode;
    res.render('./layouts/lobby', {active: {Index: true, LoggedIn: true}, currentUserPlayer: res.locals.currentUserHere, scripts: script, myGames: res.locals.myGames, username: res.locals.username, gameType: gameType});
});

// Account page
router.get('/account', redirectLogin, updateStatus, getUserProfile, getGames, getPastGames, (req, res) => {
    let colour;
    if (user.status === "online") colour = "lightgreen";
    else if (user.status === "away") colour = "yellow";
    else colour = "grey";
    res.render('./layouts/account', {active: {Account: true, LoggedIn: true}, currentUserPlayer: res.locals.currentUserHere, scripts: script, profilePic: user.profilePic, status: user.status.charAt(0).toUpperCase() + user.status.slice(1), username: user.name, colour: colour, mColour: user.mColour, myGames: res.locals.myGames, pastGames: res.locals.pastGames});
});

// profile page settings
router.get('/account/profileSettings', redirectLogin, updateStatus, getUserProfile, getGames, (req, res) => {
    let colour;
    if (user.status === "online") colour = "lightgreen";
    else if (user.status === "away") colour = "yellow";
    else colour = "grey";
    res.render('./layouts/profileSettings', {active: {Account: true, LoggedIn: true}, currentUserPlayer: res.locals.currentUserHere, scripts: script, profilePic: user.profilePic, status: user.status.charAt(0).toUpperCase() + user.status.slice(1), username: user.name, colour: colour, mColour: user.mColour, myGames: res.locals.myGames});
});

// profile of a user
router.get('/profile/:user', getFriend, getGames, getPastGames, async(req, res) => {
    let colour;
    if (res.locals.friend.status === "online") colour = "lightgreen";
    else if (res.locals.friend.status === "away") colour = "yellow";
    else colour = "grey";
    let onlineStatus;
    if (res.locals.friend.status === "away" || res.locals.friend.status === "offline") onlineStatus = true;
    else onlineStatus = false;
    let cUser;
    let uPG = cUser = await UserModel.findOne({name: res.locals.friend.name}).lean();
    let privacy = uPG.profileType;
    if(privacy == 'public') privacy = true;
    else privacy = false;
    uPG = uPG.pastTenGames;
    let pG = [];
    for (const gameIDT of uPG) {
        pG.push(await Game.findOne({_id: gameIDT}).lean());
    }

    let currentGamesPlayed = [];
    for (const gameIDT of cUser.currentGames) {
        currentGamesPlayed.push(await Game.findOne({_id: gameIDT}).lean());
    }
    currentGamesPlayed = currentGamesPlayed.reverse();
    pG = pG.reverse();

    res.render('./layouts/profile', {active: {Friends: true, LoggedIn: true}, currentUserPlayer: res.locals.currentUserHere, scripts: script, colour: colour, friend: res.locals.friend, status: res.locals.friend.status.charAt(0).toUpperCase() + res.locals.friend.status.slice(1), notFriends: res.locals.isFriend, online: onlineStatus, myGames: res.locals.myGames, pastGames: pG, notPrivate: privacy, currentGames: currentGamesPlayed});
});

// gets a specific game
router.get('/play/:gameID?', redirectLogin, updateStatus, getGameID, getGames, async(req, res) => {
    if(res.locals.gameExists) {
        let game = await Game.findOne({_id: res.locals.gameID}).lean();
        let currentUser = await UserModel.findOne({name: res.locals.currentUser}).lean();

        if(currentUser.friendsList.includes(game.player1) || currentUser.friendsList.includes(game.player2) || currentUser.name === game.player1 || currentUser.name === game.player2) {
            if(game.gameOver) res.redirect('/view/'+game._id);
            else res.render('./layouts/play/play',{active: {Index: true, LoggedIn: true}, currentUserPlayer: currentUser, scripts: script, game: game, username: res.locals.username, currentUser: currentUser, gameID: res.locals.gameID, myGames: res.locals.myGames});
        } else {
            let pendingGames = [];
            let u = await UserModel.findOne({name: res.locals.username}).lean();
            for (const game of u.pendingGames) {
                pendingGames.push(await Game.findOne({_id: game}).lean());
            }
            res.render('./layouts/index', {active: {Index: true, LoggedIn: true}, scripts: script, myGames: res.locals.myGames, username: res.locals.username, currentUserPlayer: res.locals.currentUserHere, pendingGames: pendingGames, message: 'You do not have access to this game!'});
        }
    } else {
        let pendingGames = [];
        let u = await UserModel.findOne({name: res.locals.username}).lean();
        for (const game of u.pendingGames) {
            pendingGames.push(await Game.findOne({_id: game}).lean());
        }
        res.render('./layouts/index', {active: {Index: true, LoggedIn: true}, scripts: script, myGames: res.locals.myGames, username: res.locals.username, currentUserPlayer: res.locals.currentUserHere, pendingGames: pendingGames, message: 'That game doesn\'t exist!'});
    }
});

// gets a finished game
router.get('/view/:gameID?', redirectLogin, updateStatus, getGameID, getGames, async(req, res) => {
    let game = await Game.findOne({_id: res.locals.gameID}).lean();
    let currentUser = await UserModel.findOne({name: res.locals.currentUser}).lean();
    if(game.active) {
        res.redirect('/play/' + game._id);
    } else res.render('./layouts/play/view',{active: {Index: true, LoggedIn: true}, currentUserPlayer: currentUser, scripts: script, game: game, username: res.locals.username, currentUser: currentUser, gameID: res.locals.gameID, myGames: res.locals.myGames});
});

router.post('/play/:gameID?', redirectLogin, updateStatus, async(req, res) => {
    res.redirect('/play/' + req.body.gameID);
});

router.post('/view/:gameID?', redirectLogin, updateStatus, async(req, res) => {
    res.redirect('/play/' + req.body.gameID);
});

// gets a certain chat room
router.get('/chatroom/:chatID?', redirectLogin, updateStatus, getChatID, getGames, async(req, res) => {
    let currentUser = await UserModel.findOne({name: res.locals.currentUser}).lean();
    res.render('./layouts/chatroom',{active: {Chatroom: true, LoggedIn: true}, currentUserPlayer: currentUser, scripts: script, chatID: res.locals.chatID, myGames: res.locals.myGames, chatrooms: currentUser.chats});
});

// gets users or user being searched for
router.get('/friends/users', redirectLogin, updateStatus, async (req, res) => {
    let curUser = await UserModel.findOne({name: res.locals.username}).lean();
    res.locals.searching = true;
    res.locals.searchList = [];
    if(req.query.user) {
        let searchingFor = req.query.user;
        await UserModel.find({}, function(err, users) {
            let userList = [];
            users.forEach(function(user) {
                if(user.name.length >= searchingFor.length && user.name.toLowerCase().includes(searchingFor.toLowerCase())) {
                    userList.push(user);
                }

            });
            userList.sort(compare).reverse();

            res.locals.searchList = userList;
        }).lean();

    } else {
        await UserModel.find({}, function(err, users) {
            let userList = [];
            users.forEach(function(user) {
                userList.push(user);
            });
            userList.sort(compare).reverse();

            res.locals.searchList = userList;
        }).lean();

    }

    await sleep(100);
    if(res.locals.searchList.length > 0) res.render('./layouts/friends', {active: {Friends: true, LoggedIn: true}, scripts: script, friends: res.locals.friendsList, requests: res.locals.friendRequests, myGames: res.locals.myGames, searching: res.locals.searching, search: res.locals.searchList, message: '', userFL: curUser});
    else res.render('./layouts/friends', {active: {Friends: true, LoggedIn: true}, scripts: script, friends: res.locals.friendsList, requests: res.locals.friendRequests, myGames: res.locals.myGames, searching: res.locals.searching, search: res.locals.searchList, message: "No users were matched with '" + req.query.user + "'."});
});

// Friends page
router.get('/friends', redirectLogin, updateStatus, getGames, (req, res) => {
    let errMsg = req.headers.cookie;
    errMsg = parseCookies(errMsg).errorMessage;
    res.render('./layouts/friends', {active: {Friends: true, LoggedIn: true}, currentUserPlayer: res.locals.currentUserHere, scripts: script, friends: res.locals.friendsList, requests: res.locals.friendRequests, myGames: res.locals.myGames, searching: res.locals.searching, search: res.locals.searchList, message: errMsg});
});

// Join page
router.get('/join', redirectHome, updateStatus,  (req, res) => {
    let errMsg = req.headers.cookie;
    errMsg = parseCookies(errMsg).errorMessage;
    if(errMsg === undefined) errMsg = '';
    res.render('./layouts/login/join', {active: {Login: true, LoggedIn: false}, scripts: script, message: errMsg});
});

// Reset Password page
router.get('/resetPassword', redirectHome, updateStatus, (req, res) => {
    let errMsg = req.headers.cookie;
    errMsg = parseCookies(errMsg).errorMessage;
    if(errMsg === undefined) errMsg = '';
    res.render('./layouts/login/resetPassword', {active: {Login: true, False: true, LoggedIn: false}, scripts: script, message: errMsg});
});

// logs user out
router.get('/logout', redirectLogin, updateStatus,  (req, res) => {
    res.render('./layouts/login', {active: {Login: true, LoggedIn: false}, scripts: script});
});

//JSON API for '/users'
router.get('/users', async (req, res) => {
    res.locals.searchList = [];
    if(req.query.user) {
        let searchingFor = req.query.user;
        await UserModel.find({}, function(err, users) {
            let userList = [];
            users.forEach(function(user) {
                if(user.name.length >= searchingFor.length && user.name.toLowerCase().includes(searchingFor.toLowerCase())) {
                    userList.push(user);
                }

            });
            userList.sort(compare).reverse();

            res.locals.searchList = userList;
        }).lean();

    } else {
        await UserModel.find({}, function(err, users) {
            let userList = [];
            users.forEach(function(user) {
                userList.push(user);
            });
            userList.sort(compare).reverse();

            res.locals.searchList = userList;
        }).lean();

    }

    await sleep(100);

    let jsonUser;
    let users = [];
    for(let user of res.locals.searchList) {
        let pastTen = [];
        let currentGames = [];

        for(let game of user.currentGames) {
            currentGames.push(await Game.findOne({_id: game}));
        }

        for(let game of user.pastTenGames) {
            pastTen.push(await Game.findOne({_id: game._id}));
        }

        jsonUser = {
            "username":user.name,
            "myColour":user.mColour,
            "opponentsColour":user.oColour,
            "wins":user.wins,
            "losses":user.losses,
            "onlineStatus":user.status,
            "friendsList":user.friendsList,
            "accountType":user.profileType,
            "currentGames":currentGames,
            "pastTenGames":pastTen
        }
        users.push(jsonUser);
    }

    res.json(users);
});

//JSON API for '/games'
router.get('/games', async (req, res) => {
    let player = req.query.player;
    let active = req.query.active;
    let detail = req.query.detail;

    let games = [];
    let temp = [];

    if(player !== undefined && (active === true || active ==='true')) {
        temp = await Game.find({player1: player, active: true});
        if(temp.length > 0) games = temp;
        temp = await Game.find({player2: player, active: true});
        if(temp.length > 0) games.concat(temp);
    } else if (player !== undefined && (active === false || active ==='false')) {
        temp = await Game.find({player1: player, active: false});
        if(temp.length > 0) games = temp;
        temp = await Game.find({player2: player, active: false});
        if(temp.length > 0 && games.length > 0) games.concat(temp);
        else if(games.length < 1) games = temp;
    } else if(active === true || active === 'true') {
        temp = await Game.find({active: true});
        if(temp.length > 0) games = temp;
        temp = await Game.find({active: true});
        if(temp.length > 0 && games.length > 0) games.concat(temp);
        else if(games.length < 1) games = temp;
    } else if (active === false || active ==='false') {
        temp = await Game.find({active: false});
        if(temp.length > 0) games = temp;
        temp = await Game.find({active: false});
        if(temp.length > 0 && games.length > 0) games.concat(temp);
        else if(games.length < 1) games = temp;
    } else {
        games = await Game.find();
    }

    let filteredGames = [];
    let jsonGame;
    if(detail === 'full') {
        games.forEach(game => {
            if(game.active) {
                jsonGame = {
                    "players":[
                        {"player1":game.player1},
                        {"player2":game.player2}
                    ],
                    "status": [
                        {"isActive":game.active}
                    ]
                }
            } else {
                jsonGame = {
                    "players":[
                        {"player1":game.player1},
                        {"player2":game.player2}
                    ],
                    "status": [
                        {"isActive":game.active}
                    ],
                    "outcome": [
                        {"winner":game.winner},
                        {"loser":game.loser}
                    ],
                    "playByPlay": [
                        {"numMoves":game.moves.length},
                        {"moves":game.moves}
                    ],
                    "wasForfeit":game.forfeit
                }
            }
            filteredGames.push(jsonGame);
        });
    } else if (detail === 'summary' || detail === undefined) {
        games.forEach(game => {
            if(game.active) {
                jsonGame = {
                    "players":[
                        {"player1":game.player1},
                        {"player2":game.player2}
                    ],
                    "status": [
                        {"isActive":game.active}
                    ]
                }
            } else {
                jsonGame = {
                    "players":[
                        {"player1":game.player1},
                        {"player2":game.player2}
                    ],
                    "status": [
                        {"isActive":game.active}
                    ],
                    "outcome": [
                        {"winner":game.winner},
                        {"loser":game.loser}
                    ],
                    "numMoves":game.moves.length,
                    "wasForfeit":game.forfeit
                }
            }
            filteredGames.push(jsonGame);
        });

    }

    res.json(filteredGames);
});

// denies a game request
router.get('/denyGameInvite/:gameID', async(req, res) => {
    if(req.params.gameID !== undefined) {
        let game = await Game.findOne({_id: req.params.gameID});
        if(game) {
            let player1 = await UserModel.findOne({name: game.player1});
            let player2 = await UserModel.findOne({name: game.player2});
            //remove from pending games
            if(player1.pendingGames.length > 0) player1.pendingGames.splice(player1.pendingGames.indexOf(game._id), 1);
            if(player2.pendingGames.length > 0) player2.pendingGames.splice(player1.pendingGames.indexOf(game._id), 1);

            Game.deleteOne({_id: game._id});
            await player1.save();
            await player2.save();
        }
    }
    return res.redirect('/');
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = router;