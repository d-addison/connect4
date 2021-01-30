const moment = require('moment');

// formats the message to a maleable object
function formatMessage(name, message) {
    return {
        name,
        message,
        time: moment().format('h:mm a')
    }
}

module.exports = formatMessage;