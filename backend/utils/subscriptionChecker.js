const User = require('../models/User');

const checkSubscriptions = async () => {
  try {
    const now = new Date();
    
    const expiredUsers = await User.updateMany(
      {
        subscriptionType: { $ne: 'lifetime' },
        subscriptionEndDate: { $lt: now },
        isActive: true
      },
      {
        $set: { isActive: false }
      }
    );
    
    console.log(`Subscription check complete. ${expiredUsers.modifiedCount} users deactivated.`);
  } catch (error) {
    console.error('Error checking subscriptions:', error);
  }
};

const calculateEndDate = (subscriptionType) => {
  const now = new Date();
  switch (subscriptionType) {
    case 'trial':
      return new Date(now.setDate(now.getDate() + 7));
    case 'yearly':
      return new Date(now.setFullYear(now.getFullYear() + 1));
    case 'lifetime':
      return new Date(now.setFullYear(now.getFullYear() + 100));
    default:
      return new Date(now.setDate(now.getDate() + 7));
  }
};

module.exports = { checkSubscriptions, calculateEndDate };
