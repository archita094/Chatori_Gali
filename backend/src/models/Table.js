import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
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

// Enforce unique table numbers within each restaurant
tableSchema.index({ number: 1, restaurant: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);
export default Table;
