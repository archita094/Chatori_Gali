import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey123!@#', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password, role, restaurantId, restaurantData } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let userRestaurantId = null;

    if (role === 'admin' || role === 'staff') {
      if (restaurantData && role === 'admin') {
        // Create new restaurant first
        const newRestaurant = await Restaurant.create({
          name: restaurantData.name,
          description: restaurantData.description || 'Premium dining experience',
          cuisine: restaurantData.cuisine || 'Fine Dining',
          address: restaurantData.address || '123 Gourmet St',
          imageUrl: restaurantData.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
        });
        userRestaurantId = newRestaurant._id;
      } else if (restaurantId) {
        // Verify restaurant exists
        const restaurantExists = await Restaurant.findById(restaurantId);
        if (!restaurantExists) {
          return res.status(404).json({ message: 'Selected restaurant not found' });
        }
        userRestaurantId = restaurantId;
      } else {
        return res.status(400).json({ message: 'A restaurant must be created or selected for admin/staff accounts' });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      restaurant: userRestaurantId,
    });

    if (user) {
      const populatedUser = await User.findById(user._id).populate('restaurant');
      res.status(201).json({
        _id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        restaurant: populatedUser.restaurant,
        token: signToken(populatedUser._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('restaurant');

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurant: user.restaurant,
        token: signToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserProfile = async (req, res) => {
  if (req.user) {
    const populatedUser = await User.findById(req.user._id).populate('restaurant');
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      restaurant: populatedUser.restaurant,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
