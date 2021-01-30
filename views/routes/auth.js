const router = require('express').Router();
const {UserModel, Game, Chat} = require('../../Users');
const { registrationValidation, loginValidation } = require('../../validation');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Register account
router.post('/register', async (req, res) => {
    // Data validation
    const { error } = registrationValidation(req.body);
    if (error) {
        return res.status(400).cookie('errorMessage',error.details[0].message, {maxAge: 1000}).redirect('/join');
    }

    // check if user already exists
    const { name, email, password } = req.body;
    const userExists = await UserModel.findOne({name: name});
    const emailExists = await UserModel.findOne({email: email});

    if (userExists){
        return res.status(400).cookie('errorMessage','Username already exists...', {maxAge: 1000}).redirect('/join');
    } else if (emailExists) {
        return res.status(400).cookie('errorMessage','Email already in use...', {maxAge: 1000}).redirect('/join');
    }

    // password hashing
    const hash = await bcrypt.hash(password, 10);

    // user creation
    const user = new UserModel ({name, email, password: hash, status: "online"});
    try {
        await user.save();
        req.session.userId = user._id;
        return res.redirect('../../login');
    } catch(err) {
        return res.status(400).cookie('errorMessage',err, {maxAge: 1000}).redirect('/join');
    }
});

// Login
router.post('/login',  async (req, res) => {
    // Data validation
    const { error } = loginValidation(req.body);
    if (error) {
        return res.status(400).cookie('errorMessage',error.details[0].message, {maxAge: 1000}).redirect('/login');
    }

    // check if user exists
    const { name, password } = req.body;
    const user = await UserModel.findOne({name: name});

    if(!user){
        return res.status(400).cookie('errorMessage','Username doesn\'t exist...', {maxAge: 1000}).redirect('/login');;
    } else {
        // check password
        const validPassword = await bcrypt.compare(password, user.password);

        if(!validPassword) {
            return res.status(400).cookie('errorMessage','Incorrect username/password', {maxAge: 1000}).redirect('/login');;
        }
    }

    req.session.userId = user._id;
    user.status = "online";
    await user.save();
    return res.redirect('/');
});

// checks if the request is valid
const validateUserRequest = async (req, res, next) => {
    const user = await UserModel.findOne({name: req.body.name});

    if (!user) {
        console.log(req.body.name + ' is not a registered user...');
        return res.status(400).redirect('/friends');
    } else {
        const mainUser = await UserModel.findOne({_id: req.session.userId});
        if(mainUser.name === user.name) {
            console.log('Cannot add yourself...');
            res.status(400).redirect('/friends');
        } else {
            let alreadyFriends = false;

            mainUser.friendsList.forEach(friend => {
                if (friend.name === user.name) alreadyFriends = true;
            });

            if (alreadyFriends) {
                console.log(name + ' is already in your friendslist!');
                return res.status(400).redirect('/friends');
            } else {
                user.incomingFriendRequests.push(mainUser.name);
                await user.save();
                next();
            }
        }
    }
}

// sends a friend request
router.post('/addFriend', validateUserRequest, async (req, res) => {
    console.log("Friend request sent to " + req.body.name);
    res.redirect('/friends');
});

// sends a game invite to a friend
router.post('/challengeFriend', async (req, res) => {
    let friend = await UserModel.findOne({name: req.body.name});
    let user = await UserModel.findOne({_id: req.session.userId});
    let players = [friend.name, user.name];

    let newGame = new Game({player1: friend.name, player2: user.name, whosTurn: players[Math.round(Math.random())], lobbyType: 'friends', privacyType: true});
    await newGame.save();

    friend.pendingGames.push(newGame._id);
    await friend.save();

    res.redirect('/');
});

// accepts a game invite from a friend
router.post('/acceptChallenge', async (req, res) => {
    let user = await UserModel.findOne({_id: req.session.userId});

    let game = await Game.findOne({_id: req.body.gameID});

    user.pendingGames.forEach(games => {
        if(games.toString() == game._id.toString()) {
            user.pendingGames.splice(user.pendingGames.indexOf(game._id), 1);
        }
    })
    await user.save();

    res.redirect('/play/' + game._id);
});

// resets the password of a user
router.post('/resetPassword', async (req, res) => {
    const user = await UserModel.findOne({email: req.body.email});

    if (user) {
        const password = Math.random().toString(36).substring(3);
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.isPasswordReset = true;
        await user.save();

        let transporter = nodemailer.createTransport({
           host: 'smtp.gmail.com',
            port: 465,
            service: 'gmail',
            secure: false,
            auth: {
               user: 'connecftw@gmail.com',
                pass: 'connectFTW12345'
            },
            debug: false,
            logger: true
        });

        let mail = {
            from:'connecftw@gmail.com',
            to: user.email,
            subject: 'Reset your ConnecFTW password',
            html:   '<h4><b>Reset Password</b></h4>' +
                    '<p>To reset your password, login with this temporary password:</p>' +
                    '<br><p>'+ password +'</p><br>' +
                    '<p>--ConnecFTW Team</p>'
        }

        transporter.sendMail(mail, function(err, info) {
            if (err) return res.cookie('errorMessage','Failed to sent email. Please try again.', {maxAge: 1000}).redirect('/resetPassword');
            else return res.cookie('errorMessage','Email sent! Please check your inbox/spam!', {maxAge: 1000}).redirect('/resetPassword');
        });

    } else return res.cookie('errorMessage','No user has that email...', {maxAge: 1000}).redirect('/resetPassword');
    return res.redirect('/login');
});

// changes the password of a user who reset their password
router.post('/changePassword', async (req, res) => {
    const { password, passwordRetyped } = req.body;
    const user = await UserModel.findOne({_id: req.session.userId});

    if(!user){
        console.log('Username doesn\'t exist...');
        return res.status(400).redirect('/login');;
    } else {

        if (password === passwordRetyped && await bcrypt.compare(password, user.password)) {
            user.password = await bcrypt.hash(password, 10);
        } else {
            console.log('Passwords don\'t match...');
            return res.status(400).redirect('/account');;
        }
    }

    await user.save();
    return res.redirect('/account');
});

// accepts a friend request from a user
router.post('/acceptFriendRequest', async (req, res) => {
    const user = await UserModel.findOne({name: req.body.name});
    const mainUser = await UserModel.findOne({_id: req.session.userId});

    if (user && mainUser) {
        const chat = new Chat();
        chat.members.push(user.name);
        chat.members.push(mainUser.name);
        await chat.save();

        user.friendsList.push(mainUser.name);
        user.chats.push([chat._id, mainUser.name]);
        await user.save();

        mainUser.friendsList.push(user.name);
        mainUser.incomingFriendRequests.splice(mainUser.incomingFriendRequests.indexOf(user.name), 1);
        mainUser.chats.push([chat._id, user.name]);
        await mainUser.save();
    }
    return res.redirect('/friends');
});

// denies a friend request
router.post('/denyFriendRequest', async (req, res) => {
    const user = await UserModel.findOne({name: req.body.name});
    const mainUser = await UserModel.findOne({_id: req.session.userId});

    if (user && mainUser) {
        mainUser.incomingFriendRequests.splice(mainUser.incomingFriendRequests.indexOf(user.name), 1);
        await mainUser.save();
    }
    return res.redirect('/friends');
});

// gets all users
router.get('/getFriends', async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});

    if (!user) {
        console.log(name + ' is not a registered user...');
        return res.status(400).redirect('/friends');
    } else {
        res.send(user.friendsList);
    }
});

// gets all friend requests
router.get('/getFriendRequests', async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});

    if (!user) {
        console.log(name + ' is not a registered user...');
        return res.status(400).redirect('/friends');
    } else {
        res.send(user.incomingFriendRequests);
    }
});

// get main user (not used)
router.post('/getUser', async (req, res) => {
    const user = await UserModel.findOne({name: req.body.name});

    if (!user) {
        return res.status(400);
    } else {
        res.send(user);
    }
});

// Login
router.post('/changeAccountInfo',  async (req, res) => {
    // check if user exists
    const { mColour, pic, profileType, oColour, tempPassword, newPassword} = req.body;

    const user = await UserModel.findOne({_id: req.session.userId});

    if(!user){
        console.log('Username doesn\'t exist...');
        return res.status(400).render('/account');
    } else {
        if (mColour !== undefined) user.mColour = mColour;
        if (oColour !== undefined) user.oColour = oColour;
        if (pic !== undefined) user.profilePic = pic;
        if (profileType !== undefined) user.profileType = profileType;
        if(user.isPasswordReset) {
            if(await bcrypt.compare(tempPassword, user.password)) {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                user.password = hashedPassword;
                user.isPasswordReset = false;
            } else {
                confirm('Incorrect password!');
            }
        }
        await user.save();
    }

    return res.redirect('/account');
});

// removes a user from their friends list and their friends friend list
router.post('/removeFriend', async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});
    const friendRemove = await UserModel.findOne({name: req.body.user});

    if (user && friendRemove) {
        user.chats.forEach(chat => {
            if(chat[1] === friendRemove.name) {
                chatID = chat[0];
                user.chats.splice(user.chats.indexOf(chat), 1);
            }
        })

        friendRemove.chats.forEach(chat => {
            if(chat[1] === user.name) {
                chatID = chat[0];
                friendRemove.chats.splice(friendRemove.chats.indexOf(chat), 1);
            }
        })
        await Chat.deleteOne({_id: chatID});

        user.friendsList.splice(user.friendsList.indexOf(friendRemove), 1);
        friendRemove.friendsList.splice(friendRemove.friendsList.indexOf(user), 1);
        await user.save();
        await friendRemove.save();
    }
    return res.redirect('/friends');
});

// handles user changing status
router.post('/changeStatus', async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});
    if (user) {
        user.status = req.body.status;
        await user.save();
    }
    return res.status(300).redirect('/account');
});

// handles logging out
router.get('/logout', async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});
    if (user) {
        user.status = "offline";
        await user.save();
    }

    req.session.destroy(err => {
        if (err) reject(err);
        res.clearCookie('test');
        return res.redirect('/logout');
    });
});

module.exports = router;