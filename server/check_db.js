require('dotenv').config();
const mongoose = require('mongoose');
const Group = require('./models/Group');

const checkGroups = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const ids = ['69e8b28cc066e988526faf23', '69e8b367b21fd62d513cfd99'];
        for (const id of ids) {
            const group = await Group.findById(id);
            console.log(`Group ${id}: ${group ? 'FOUND' : 'NOT FOUND'}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkGroups();
