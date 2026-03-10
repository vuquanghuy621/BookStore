const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECT_URI);
        const User = mongoose.model('User', new mongoose.Schema({ viewedBooks: Array, favorites: Array }));
        const user = await User.findOne({ viewedBooks: { $exists: true, $not: { $size: 0 } } });
        console.log('User with history:', user ? user._id : 'None');

        if (user) {
            console.log('viewedBooks count:', user.viewedBooks.length);
        }

        const allUsers = await User.find().limit(5);
        console.log('Sample User IDs:', allUsers.map(u => u._id));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
