// filepath: /home/hayder/TikTask/insertCategory.js
const mongoose = require('mongoose');

// Replace with your MongoDB connection string
const mongoURI = 'mongodb://localhost:27017/TikTask';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Category = mongoose.model('Category', categorySchema);

const insertCategory = async () => {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

    const category = new Category({
      name: 'Fashion',
      description: 'Fashion campaigns',
    });

    const result = await category.save();
    console.log('Category inserted:', result);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error inserting category:', error);
    mongoose.connection.close();
  }
};

insertCategory();