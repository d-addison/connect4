const mongoose = require('mongoose');

// connects to the database
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_CONNECT, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });

        console.log(`MongoDB successfully connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

module.exports = connectDB;