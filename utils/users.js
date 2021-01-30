const users = [];

// connect user to chat
function userJoin(id, name, room) {
    const user = {id, name, room};

    users.push(user);
    return user;
}

// get current user
function getCurrentUser(id) {
    return users.find(user => user.id === id);
}

// user disconnect
function userDisconnect(id) {
    const index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

// get users in room
function getUsersInRoom(room) {
    return users.filter(user => user.room === room);
}

module.exports = {
    userJoin,
    getCurrentUser,
    userDisconnect,
    getUsersInRoom
}