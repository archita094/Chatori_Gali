import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: ['appetizers', 'mains', 'desserts', 'beverages'],
    default: 'mains',
  },
  imageUrl: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  dietaryInfo: {
    isVeg: { type: Boolean, default: false },
    spicyLevel: { type: Number, default: 0, min: 0, max: 3 }, // 0: None, 1: Mild, 2: Medium, 3: Hot
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    allergens: { type: [String], default: [] },
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
