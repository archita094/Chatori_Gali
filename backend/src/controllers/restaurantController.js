import Restaurant from '../models/Restaurant.js';

// Get all restaurants
export const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({});
    res.json(restaurants);
  } catch (error) {
    console.error('Fetch restaurants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get specific restaurant by ID
export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (restaurant) {
      res.json(restaurant);
    } else {
      res.status(404).json({ message: 'Restaurant not found' });
    }
  } catch (error) {
    console.error('Fetch restaurant details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
