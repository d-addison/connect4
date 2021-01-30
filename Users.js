const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema ({
    player1: {
        type: String,
        default: 'ConnecBot'
    },
    player2: {
        type: String,
        default: 'ConnecBot'
    },
    winner: {
        type: String,
        default: 'ConnecBot'
    },
    loser: {
        type: String,
        default: 'ConnecBot'
    },
    board: {
        type: Array,
        default: [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
    },
    active: {
        type: Boolean,
        default: false
    },
    forfeit: {
        type: Boolean,
        default: false
    },
    moves: {
        type: Array,
        default: []
    },
    lobbyType: {
        type: String,
        required: true
    },
    whosTurn: {
        type: String,
        default: 'ConnecBot'
    },
    privacyType: {
        type: String,
        default: 'public'
    },
    winningPieces: {
        type: Array,
        default: []
    },
    gameOver: {
        type: Boolean,
        default: false
    },
    chatLogs: {
        type: Array,
        default: []
    }
}, {timestamps: true});

const UserSchema = new Schema({
        name: {
            type: String,
            required: true,
            min: 3,
            max: 255,
            unique: true
        },
        email: {
            type: String,
            required: true,
            min: 6,
            max: 255,
            unique: true
        },
        password: {
            type: String,
            required: true,
            min: 6,
            max: 1024
        },
        profilePic: {
            type: String,
            default: '/imgs/blankSlate.png'
        },
        mColour: {
            type: String,
            default: 'red'
        },
        oColour: {
            type: String,
            default: 'yellow'
        },
        wins: {
            type: Number,
            default: 0
        },
        losses: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            default: 'online'
        },
        friendsList: {
            type: Array,
            default: []
        },
        incomingFriendRequests: {
            type: Array,
            default: []
        },
        player: {
            type: Number,
            default: 0
        },
        profileType: {
            type: String,
            default: 'public'
        },
        currentGames: {
            type: Array,
            default: []
        },
        pastTenGames: {
            type: Array,
            default: []
        },
        isPasswordReset: {
            type: Boolean,
            default: false
        },
        chats: {
            type: Array,
            default: []
        },
        pendingGames: {
            type: Array,
            default: []
        }
    }, {timestamps: true});

const ChatSchema = new Schema({
    members: {
        type: Array,
        default: []
    },
    chatLogs: {
        type: Array,
        default: []
    }

}, {timestamps: true});

const UserModel = mongoose.model('User', UserSchema);
const Game = mongoose.model('Game', GameSchema);
const Chat = mongoose.model('Chat', ChatSchema);

module.exports = { UserModel, Game, Chat };