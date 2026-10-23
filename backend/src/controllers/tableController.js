import Table from '../models/Table.js';

// Get all tables scoped to a restaurant
export const getTables = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const filter = {};
    
    if (restaurantId) {
      filter.restaurant = restaurantId;
    } else if (req.user && req.user.restaurant) {
      filter.restaurant = req.user.restaurant;
    } else {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    const tables = await Table.find(filter).sort({ number: 1 });
    res.json(tables);
  } catch (error) {
    console.error('Fetch tables error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new table scoped to the admin's restaurant
export const createTable = async (req, res) => {
  const { number, capacity, type, isAvailable } = req.body;

  try {
    if (!req.user.restaurant) {
      return res.status(400).json({ message: 'Admin user is not associated with any restaurant' });
    }

    // Check if table number already exists inside this restaurant
    const tableExists = await Table.findOne({ number, restaurant: req.user.restaurant });
    if (tableExists) {
      return res.status(400).json({ message: `Table number ${number} already exists in your restaurant` });
    }

    const table = new Table({
      number,
      capacity,
      type,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      restaurant: req.user.restaurant,
    });

    const createdTable = await table.save();
    res.status(201).json(createdTable);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an existing table details
export const updateTable = async (req, res) => {
  const { number, capacity, type, isAvailable } = req.body;

  try {
    const table = await Table.findById(req.params.id);

    if (table) {
      // Scoping check
      if (!req.user.restaurant || table.restaurant.toString() !== req.user.restaurant.toString()) {
        return res.status(403).json({ message: 'Unauthorized access to this table' });
      }

      // If table number is changed, ensure it's not taken by another table in the same restaurant
      if (number !== undefined && Number(number) !== table.number) {
        const tableExists = await Table.findOne({ number, restaurant: req.user.restaurant });
        if (tableExists) {
          return res.status(400).json({ message: `Table number ${number} is already in use in your restaurant` });
        }
        table.number = number;
      }

      table.capacity = capacity !== undefined ? capacity : table.capacity;
      table.type = type || table.type;
      table.isAvailable = isAvailable !== undefined ? isAvailable : table.isAvailable;

      const updatedTable = await table.save();
      res.json(updatedTable);
    } else {
      res.status(404).json({ message: 'Table not found' });
    }
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a table scoped to the admin's restaurant
export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (table) {
      // Scoping check
      if (!req.user.restaurant || table.restaurant.toString() !== req.user.restaurant.toString()) {
        return res.status(403).json({ message: 'Unauthorized access to this table' });
      }

      await table.deleteOne();
      res.json({ message: 'Table removed successfully' });
    } else {
      res.status(404).json({ message: 'Table not found' });
    }
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
