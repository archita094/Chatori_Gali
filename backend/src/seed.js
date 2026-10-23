import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import MenuItem from './models/MenuItem.js';
import Reservation from './models/Reservation.js';
import Table from './models/Table.js';
import Restaurant from './models/Restaurant.js';

dotenv.config();

const restaurantsData = [
  {
    name: 'Dilli 6 Royal Haveli',
    description: 'Timeless Old Delhi & Mughlai fine dining, renowned for 18-hour slow-simmered Dal Bukhara, smoky charcoal clay tandoori kebabs, and velvety Butter Chicken.',
    cuisine: 'North Indian & Mughlai',
    address: 'Chandni Chowk Heritage Lane, Old Delhi, Delhi NCR',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Pind Punjab Heritage Dhaba',
    description: 'Authentic rustic Punjabi culinary haven serving golden Amritsari kulchas, Sarson da Saag with churned white butter, and sizzling Bhatti da Murgh.',
    cuisine: 'Authentic Punjabi & Tandoor',
    address: 'Grand Trunk Road, Heritage Walk, Amritsar, Punjab',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Awadh Darbar & Dum Pukht',
    description: 'Royal Awadhi dining celebrating centuries-old royal recipes, handi-sealed aromatic Dum Biryanis, Kakori seekhs, and delicate saffron spices.',
    cuisine: 'Awadhi Nawabi & Dum Pukht',
    address: 'Hazratganj Palace Road, Lucknow, Uttar Pradesh',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Dakshin & Samudra Pavilion',
    description: 'Fresh coastal produce, wild kokum, crushed coconut, and Malabar spices kissed by wood-fired clay chulhas.',
    cuisine: 'Coastal Indian & Malabar',
    address: 'Vagator Cliff Promenade, Goa',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
];

const menuItemsData = [
  // 1. Dilli 6 Royal Haveli (North Indian & Mughlai)
  {
    name: 'Charcoal Bhatti Paneer Tikka',
    description: 'Artisanal malai paneer cubes marinated in hung curd, yellow mustard, and degi mirch, blistered over glowing clay tandoor coals.',
    price: 420.0,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 2, calories: 340, protein: 18, allergens: ['Dairy'] },
  },
  {
    name: 'Melt-in-Mouth Galouti Kebab',
    description: 'Velvety minced kebabs perfumed with 32 secret spices, smoked with clove butter, served atop delicate roomali mini rotis.',
    price: 540.0,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: false, spicyLevel: 1, calories: 390, protein: 26, allergens: ['Dairy', 'Gluten'] },
  },
  {
    name: 'Slow-Simmered Dal Bukhara',
    description: 'Whole black lentils slow-simmered over live charcoal embers for 18 hours with vine-ripened tomatoes and hand-churned white butter.',
    price: 480.0,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 1, calories: 420, protein: 16, allergens: ['Dairy'] },
  },
  {
    name: 'Purani Dilli Butter Chicken',
    description: 'Tandoor-charred chicken morsels simmered in a silky, satin tomato gravy laced with roasted kasuri methi and honey.',
    price: 590.0,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: false, spicyLevel: 1, calories: 610, protein: 42, allergens: ['Dairy'] },
  },
  {
    name: 'Kesariya Phirni with Silver Leaf',
    description: 'Fragrant ground basmati rice slow-cooked in sweetened milk, infused with Kashmiri saffron strands, green cardamom, and toasted pistachios.',
    price: 220.0,
    category: 'desserts',
    imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 0, calories: 280, protein: 6, allergens: ['Dairy', 'Nuts'] },
  },
  {
    name: 'Royal Shahi Kesar Thandai',
    description: 'Chilled rich milk infused with freshly crushed almonds, fennel seeds, watermelon seeds, saffron, and fragrant rose water.',
    price: 210.0,
    category: 'beverages',
    imageUrl: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 0, calories: 180, protein: 5, allergens: ['Dairy', 'Nuts'] },
  },

  // 2. Pind Punjab Heritage Dhaba (Authentic Punjabi & Amritsari)
  {
    name: 'Amritsari Aloo Kulcha & Pindi Chole',
    description: 'Crisp, flaky tandoori flatbread stuffed with spiced potatoes and pomegranate seeds, paired with dark, tangy Punjabi chickpeas.',
    price: 320.0,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 2, calories: 440, protein: 14, allergens: ['Gluten', 'Dairy'] },
  },
  {
    name: 'Bhatti da Murgh Sizzler',
    description: 'Whole chicken legs steeped in hung curd, malt vinegar, cracked black pepper, and roasted cumin, charred to perfection in the bhatti.',
    price: 490.0,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: false, spicyLevel: 2, calories: 480, protein: 46, allergens: ['Dairy'] },
  },
  {
    name: 'Sarson da Saag & Makki di Roti',
    description: 'Tender mustard greens and bathua simmered and churned with garlic, ginger, and green chilies, crowned with home-churned makhan.',
    price: 440.0,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 1, calories: 380, protein: 12, allergens: ['Dairy'] },
  },
  {
    name: 'Kadhai Paneer Angara',
    description: 'Fresh malai paneer cubes tossed in an iron wok with bell peppers, crushed coriander seeds, and a fiery tomato-onion masala.',
    price: 460.0,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 2, calories: 430, protein: 20, allergens: ['Dairy'] },
  },
  {
    name: 'Garam Malai Rabri Jalebi',
    description: 'Golden, crispy spiral jalebis soaked in warm saffron syrup, blanketed by thick, slow-reduced malai rabri.',
    price: 240.0,
    category: 'desserts',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 0, calories: 490, protein: 7, allergens: ['Dairy', 'Gluten'] },
  },
  {
    name: 'Patiala Kulhad Sweet Lassi',
    description: 'Thick, creamy yogurt hand-churned in an earthen pot, perfumed with cardamom and topped with a luscious layer of clotted malai.',
    price: 180.0,
    category: 'beverages',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 0, calories: 230, protein: 8, allergens: ['Dairy'] },
  },

  // 3. Awadh Darbar & Dum Pukht (Royal Awadhi & Nawabi)
  {
    name: 'Kakori Fragrant Seekh Kebab',
    description: 'Royally seasoned minced lamb infused with cloves, saffron, and rose petals, grilled on skewers until impossibly tender.',
    price: 520.0,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: false, spicyLevel: 1, calories: 370, protein: 32, allergens: ['Dairy'] },
  },
  {
    name: 'Dahi ke Shahi Kebab',
    description: 'Crispy pan-seared patties made from hung curd, roasted gram flour, finely minced green chilies, and fresh coriander.',
    price: 380.0,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 1, calories: 290, protein: 12, allergens: ['Dairy'] },
  },
  {
    name: 'Nawabi Awadhi Handi Dum Biryani',
    description: 'Aged long-grain basmati rice and tender spiced cuts layered with fried golden onions, saffron, and rose water, sealed in earthen handi.',
    price: 640.0,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: false, spicyLevel: 2, calories: 620, protein: 34, allergens: ['Dairy'] },
  },
  {
    name: 'Shahi Paneer Nawabi Korma',
    description: 'Cottage cheese triangles poached in a velvety cashew nut and melon seed gravy, subtly perfumed with mace and green cardamom.',
    price: 480.0,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 1, calories: 460, protein: 18, allergens: ['Dairy', 'Nuts'] },
  },
  {
    name: 'Shahi Tukda with Zafrani Rabri',
    description: 'Golden ghee-fried bread steeped in cardamom saffron syrup, blanketed with slow-simmered rabri and silver vark.',
    price: 250.0,
    category: 'desserts',
    imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 0, calories: 430, protein: 8, allergens: ['Dairy', 'Gluten', 'Nuts'] },
  },
  {
    name: 'Royal Aam Panna Cooler',
    description: 'Tangy roasted raw mango pulp muddled with roasted cumin, black salt, fresh mint sprigs, and chilled mineral water.',
    price: 190.0,
    category: 'beverages',
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 0, calories: 95, protein: 1, allergens: [] },
  },

  // 4. Dakshin & Samudra Pavilion (Coastal Malabar & Chettinad)
  {
    name: 'Clay Tandoor Charred Sea-Bass',
    description: 'Line-caught coastal sea-bass marinated in crushed Byadgi chilies, curry leaf oil, and charred over clay tandoor embers.',
    price: 620.0,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: false, spicyLevel: 2, calories: 340, protein: 36, allergens: ['Fish'] },
  },
  {
    name: 'Mangalorean Ghee Roast Paneer',
    description: 'Succulent paneer cubes tossed in a fiery, tangy paste of whole roasted spices and caramelized pure cow ghee.',
    price: 440.0,
    category: 'appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 3, calories: 450, protein: 19, allergens: ['Dairy'] },
  },
  {
    name: 'Malabar Coconut Prawn Curry',
    description: 'Plump prawns simmered in fresh pressed coconut milk, raw mango slices, shallots, and fragrant curry leaves.',
    price: 640.0,
    category: 'mains',
    imageUrl: 'https://images.unsplash.com/photo-1559742811-82428b5911b4?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: false, spicyLevel: 2, calories: 480, protein: 32, allergens: ['Shellfish'] },
  },
  {
    name: 'Elaneer Tender Coconut Payasam',
    description: 'Chilled dessert of tender coconut pulp and sweet coconut water cooked in condensed milk with cardamom.',
    price: 240.0,
    category: 'desserts',
    imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 0, calories: 260, protein: 4, allergens: ['Dairy'] },
  },
  {
    name: 'Kokum & Star Anise Fizz',
    description: 'Wild Konkan kokum extract, toasted star anise, and sparkling tonic water over hand-cut ice.',
    price: 180.0,
    category: 'beverages',
    imageUrl: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    dietaryInfo: { isVeg: true, spicyLevel: 0, calories: 85, protein: 0, allergens: [] },
  },
];

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hotel-reservation';
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing collections and stale indexes...');
    await User.deleteMany();
    await MenuItem.deleteMany();
    await Reservation.deleteMany();
    await Restaurant.deleteMany();

    try {
      await Table.collection.drop();
      console.log('Dropped Table collection to clear stale unique indexes.');
    } catch (err) {
      await Table.deleteMany();
    }

    console.log('Seeding restaurants...');
    const createdRestaurants = await Restaurant.insertMany(restaurantsData);
    const [dilliHaveli, pindPunjab, awadhDarbar, dakshinPavilion] = createdRestaurants;
    console.log(`Seeded ${createdRestaurants.length} restaurants.`);

    console.log('Seeding tables...');
    const tablesToInsert = [];
    const tableTypes = ['Royal Jharokha Window', 'Courtyard Garden View', 'Cozy Heritage Corner', 'Grand Family Baithak', 'Central Lounge', 'Bar High-top'];
    
    // Seed 6 tables for each restaurant
    createdRestaurants.forEach((rest) => {
      for (let num = 1; num <= 6; num++) {
        tablesToInsert.push({
          number: num,
          capacity: num % 2 === 0 ? 4 : 2,
          type: tableTypes[num - 1],
          isAvailable: true,
          restaurant: rest._id,
        });
      }
    });
    await Table.insertMany(tablesToInsert);
    console.log('Seeded tables for all restaurants.');

    console.log('Seeding menu items...');
    const menuPayloads = menuItemsData.map((item, index) => {
      let restaurantId;
      if (index < 6) {
        restaurantId = dilliHaveli._id;
      } else if (index < 12) {
        restaurantId = pindPunjab._id;
      } else if (index < 18) {
        restaurantId = awadhDarbar._id;
      } else {
        restaurantId = dakshinPavilion._id;
      }
      return { ...item, restaurant: restaurantId };
    });
    const createdMenuItems = await MenuItem.insertMany(menuPayloads);
    console.log(`Seeded ${createdMenuItems.length} menu items.`);

    console.log('Seeding users...');
    
    // Global customer
    const customer = await User.create({
      name: 'Aarav Mehta',
      email: 'customer@hotel.com',
      password: 'customer123',
      role: 'customer',
    });

    // Dilli 6 Admin & Staff (Keeping backwards compatible admin@hotel.com)
    await User.create({
      name: 'Dilli Haveli Manager',
      email: 'admin@hotel.com',
      password: 'admin123',
      role: 'admin',
      restaurant: dilliHaveli._id,
    });
    await User.create({
      name: 'Dilli Head Ustad',
      email: 'staff@hotel.com',
      password: 'staff123',
      role: 'staff',
      restaurant: dilliHaveli._id,
    });

    // Pind Punjab Admin & Staff
    await User.create({
      name: 'Pind Punjab Manager',
      email: 'admin_sakura@hotel.com',
      password: 'admin123',
      role: 'admin',
      restaurant: pindPunjab._id,
    });
    await User.create({
      name: 'Pind Head Bhatti Chef',
      email: 'staff_sakura@hotel.com',
      password: 'staff123',
      role: 'staff',
      restaurant: pindPunjab._id,
    });

    // Awadh Darbar Admin & Staff
    await User.create({
      name: 'Awadh Darbar Manager',
      email: 'admin_obsidian@hotel.com',
      password: 'admin123',
      role: 'admin',
      restaurant: awadhDarbar._id,
    });
    await User.create({
      name: 'Awadh Bawarchi',
      email: 'staff_obsidian@hotel.com',
      password: 'staff123',
      role: 'staff',
      restaurant: awadhDarbar._id,
    });

    // Dakshin Admin & Staff
    await User.create({
      name: 'Dakshin Pavilion Manager',
      email: 'admin_dakshin@hotel.com',
      password: 'admin123',
      role: 'admin',
      restaurant: dakshinPavilion._id,
    });

    console.log('Seeding reservations...');
    const todayStr = new Date().toISOString().split('T')[0];

    const reservationsToSeed = [
      {
        user: customer._id,
        restaurant: dilliHaveli._id,
        guestName: 'Aarav Mehta',
        guestEmail: 'customer@hotel.com',
        guestsCount: 2,
        date: todayStr,
        timeSlot: '19:30',
        tableNumber: 1,
        menuItems: [
          { menuItem: createdMenuItems[2]._id, quantity: 2, priceAtBooking: createdMenuItems[2].price }, // Dal Bukhara
          { menuItem: createdMenuItems[0]._id, quantity: 1, priceAtBooking: createdMenuItems[0].price }, // Paneer Tikka
        ],
        totalFoodAmount: createdMenuItems[2].price * 2 + createdMenuItems[0].price,
        paymentStatus: 'paid',
        paymentDetails: { cardLast4: '4242', transactionId: 'TXN-DILLI1', paidAt: new Date() },
        status: 'confirmed',
        prepStatus: 'in-prep',
      },
      {
        user: customer._id,
        restaurant: pindPunjab._id,
        guestName: 'Simran Kaur',
        guestEmail: 'simran@example.com',
        guestsCount: 4,
        date: todayStr,
        timeSlot: '20:00',
        tableNumber: 2,
        menuItems: [
          { menuItem: createdMenuItems[6]._id, quantity: 2, priceAtBooking: createdMenuItems[6].price }, // Kulcha & Chole
          { menuItem: createdMenuItems[9]._id, quantity: 2, priceAtBooking: createdMenuItems[9].price }, // Kadhai Paneer
        ],
        totalFoodAmount: createdMenuItems[6].price * 2 + createdMenuItems[9].price * 2,
        paymentStatus: 'paid',
        paymentDetails: { cardLast4: '5555', transactionId: 'TXN-PIND1', paidAt: new Date() },
        status: 'confirmed',
        prepStatus: 'not-started',
      },
    ];

    reservationsToSeed.forEach((r) => {
      r.advanceAmount = Math.round(r.totalFoodAmount * 0.6 * 100) / 100;
    });

    await Reservation.insertMany(reservationsToSeed);
    console.log('Seeded initial reservations.');

    console.log('\nDatabase seeded successfully with authentic Indian restaurants & menus!');
    console.log('Test Credentials:');
    console.log(' - Customer: customer@hotel.com (customer123)');
    console.log(' - Dilli 6 Haveli Admin: admin@hotel.com (admin123)');
    console.log(' - Pind Punjab Admin: admin_sakura@hotel.com (admin123)');
    console.log(' - Awadh Darbar Admin: admin_obsidian@hotel.com (admin123)');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed:', error);
    process.exit(1);
  }
};

seed();
