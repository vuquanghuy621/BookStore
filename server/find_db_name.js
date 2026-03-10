require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECT_URI);
        console.log('Database name:', mongoose.connection.name);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
