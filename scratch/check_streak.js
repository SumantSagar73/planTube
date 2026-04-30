const mongoose = require('mongoose');
const Schedule = require('../server/models/Schedule');
const User = require('../server/models/User');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/plantube_db_name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
  }).catch(err => {
      // Trying the default if plantube_db_name is wrong
      return mongoose.connect('mongodb://localhost:27017/plantube', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
  });

  const user = await User.findOne({ email: '6073sumant@gmail.com' });
  if (!user) {
    console.log("User not found");
    process.exit(1);
  }

  console.log(`User: ${user.name} (${user._id})`);

  const completedSchedules = await Schedule.find({ userId: user._id, status: 'completed' });
  
  const completionDates = completedSchedules
        .map(s => new Date(s.updatedAt).toISOString().split('T')[0])
        .sort((a, b) => new Date(b) - new Date(a));

  const uniqueDates = [...new Set(completionDates)];
  
  console.log("Completion Dates (UTC):");
  console.log(uniqueDates);
  
  process.exit(0);
}

main().catch(console.error);
