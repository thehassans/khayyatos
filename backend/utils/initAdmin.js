const Admin = require('../models/Admin');

const initializeAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const admin = new Admin({
        email: process.env.ADMIN_EMAIL || 'admin@tailorshop.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        name: 'Super Admin'
      });
      
      await admin.save();
      console.log('Admin account created successfully');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

module.exports = { initializeAdmin };
