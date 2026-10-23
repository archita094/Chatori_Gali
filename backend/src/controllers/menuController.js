import MenuItem from '../models/MenuItem.js';

export const getMenuItems = async (req, res) => {
  try {
    const { category, restaurantId } = req.query;
    const filter = {};
    if (category) {
      filter.category = category;
    }
    if (restaurantId) {
      filter.restaurant = restaurantId;
    }
    const items = await MenuItem.find(filter);
    res.json(items);
  } catch (error) {
    console.error('Fetch menu items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createMenuItem = async (req, res) => {
  const { name, description, price, category, imageUrl, dietaryInfo } = req.body;

  try {
    if (!req.user.restaurant) {
      return res.status(400).json({ message: 'Admin user is not associated with any restaurant' });
    }

    const item = new MenuItem({
      name,
      description,
      price,
      category,
      imageUrl,
      dietaryInfo,
      restaurant: req.user.restaurant,
    });

    const createdItem = await item.save();
    res.status(201).json(createdItem);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMenuItem = async (req, res) => {
  const { name, description, price, category, imageUrl, isAvailable, dietaryInfo } = req.body;

  try {
    const item = await MenuItem.findById(req.params.id);

    if (item) {
      // Scoping check
      if (!req.user.restaurant || item.restaurant.toString() !== req.user.restaurant.toString()) {
        return res.status(403).json({ message: 'Unauthorized access to this menu item' });
      }

      item.name = name || item.name;
      item.description = description || item.description;
      item.price = price !== undefined ? price : item.price;
      item.category = category || item.category;
      item.imageUrl = imageUrl || item.imageUrl;
      item.isAvailable = isAvailable !== undefined ? isAvailable : item.isAvailable;
      item.dietaryInfo = dietaryInfo || item.dietaryInfo;

      const updatedItem = await item.save();
      res.json(updatedItem);
    } else {
      res.status(404).json({ message: 'Menu item not found' });
    }
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (item) {
      // Scoping check
      if (!req.user.restaurant || item.restaurant.toString() !== req.user.restaurant.toString()) {
        return res.status(403).json({ message: 'Unauthorized access to this menu item' });
      }

      await item.deleteOne();
      res.json({ message: 'Menu item removed' });
    } else {
      res.status(404).json({ message: 'Menu item not found' });
    }
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// AI Dietary Assistant: recommendations based on user constraints
export const getDietaryAssistantRecommendations = async (req, res) => {
  try {
    const { isVeg, maxCalories, minProtein, maxPrice, maxSpiceLevel, allergies } = req.query;

    const filter = { isAvailable: true };

    if (isVeg === 'true') {
      filter['dietaryInfo.isVeg'] = true;
    }

    if (maxCalories) {
      filter['dietaryInfo.calories'] = { $lte: Number(maxCalories) };
    }

    if (minProtein) {
      filter['dietaryInfo.protein'] = { $gte: Number(minProtein) };
    }

    if (maxPrice) {
      filter['price'] = { $lte: Number(maxPrice) };
    }

    if (maxSpiceLevel) {
      filter['dietaryInfo.spicyLevel'] = { $lte: Number(maxSpiceLevel) };
    }

    if (allergies) {
      const allergenList = allergies.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
      if (allergenList.length > 0) {
        filter['dietaryInfo.allergens'] = { $nin: allergenList.map(a => new RegExp(`^${a}$`, 'i')) };
      }
    }

    const items = await MenuItem.find(filter).populate('restaurant', 'name cuisine address rating imageUrl');

    const apiKey = process.env.GEMINI_API_KEY;
    const hasApiKey = apiKey && apiKey !== 'your_gemini_api_key_here';

    let recommendations = [];

    if (hasApiKey && items.length > 0) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const dishesSummary = items.slice(0, 15).map(item => (
          `ID: ${item._id}, Name: ${item.name}, Price: $${item.price}, Category: ${item.category}, Calories: ${item.dietaryInfo.calories}kcal, Protein: ${item.dietaryInfo.protein}g, Spice: ${item.dietaryInfo.spicyLevel}, Allergens: ${item.dietaryInfo.allergens.join(', ') || 'none'}`
        )).join('\n');

        const prompt = `
          You are a professional restaurant dietary AI advisor. A customer has requested food matching:
          - Veg Only: ${isVeg === 'true' ? 'Yes' : 'No'}
          - Max Calories: ${maxCalories || 'Any'}
          - Min Protein: ${minProtein || 'Any'}
          - Max Price: ${maxPrice || 'Any'}
          - Max Spice Level (0-3): ${maxSpiceLevel || 'Any'}
          - Excluded Allergens: ${allergies || 'None'}

          Here are the matching dishes from the menu:
          ${dishesSummary}

          For each dish, generate a short 1-2 sentence "insight" explaining why this dish is a great match for their specified dietary preferences and fitness goals. Be appetizing and encouraging.
          Return the output ONLY as a valid JSON object mapping the ID of the dish to the insight text. Do not write any markdown wrappers (like \`\`\`json), just raw JSON text. Example:
          {
            "id_here": "This is a great high-protein dish that fits perfectly under your calorie budget..."
          }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        const insights = JSON.parse(cleanJson);

        recommendations = items.map(item => ({
          ...item.toObject(),
          aiInsight: insights[item._id.toString()] || `Excellent choice! Matches your requested criteria perfectly with ${item.dietaryInfo.calories} calories and ${item.dietaryInfo.protein}g protein.`
        }));

      } catch (err) {
        console.error('Gemini API execution failed, falling back to template insights:', err);
        recommendations = items.map(item => ({
          ...item.toObject(),
          aiInsight: generateTemplateInsight(item)
        }));
      }
    } else {
      recommendations = items.map(item => ({
        ...item.toObject(),
        aiInsight: generateTemplateInsight(item)
      }));
    }

    res.json(recommendations);
  } catch (error) {
    console.error('Dietary assistant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

function generateTemplateInsight(item) {
  const { calories, protein, isVeg, spicyLevel } = item.dietaryInfo;
  const parts = [];
  
  if (isVeg) {
    parts.push('a delicious vegetarian option');
  } else {
    parts.push('a satisfying protein-rich meal');
  }

  if (protein > 15) {
    parts.push(`packing a solid ${protein}g of clean protein to support your muscle goals`);
  } else if (calories > 0 && calories < 400) {
    parts.push(`keeping things exceptionally light at just ${calories} calories`);
  } else if (calories > 0) {
    parts.push(`well-balanced at ${calories} calories`);
  }

  const spiceText = ['mildly seasoned', 'with a pleasant mild kick', 'with medium spice warmth', 'hot and fiery!'][spicyLevel] || 'perfectly balanced';
  parts.push(`and is ${spiceText}`);

  let sentence = parts.join(' ');
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
  return `AI Recommendation: ${sentence} Matches all your selected dietary constraints safely.`;
}
