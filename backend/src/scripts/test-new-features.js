import axios from 'axios';

const apiBaseUrl = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting validation tests for newly implemented features...');

  try {
    // 1. Get Base Server check
    console.log('\n--- 1. Testing server connection ---');
    const baseRes = await axios.get('http://localhost:5000/');
    console.log('✅ Connection status:', baseRes.status === 200 ? 'SUCCESS' : 'FAILED');

    // 2. Fetch Restaurants
    const restaurantsRes = await axios.get(`${apiBaseUrl}/restaurants`);
    if (restaurantsRes.data.length === 0) {
      throw new Error('No restaurants seeded in database.');
    }
    const targetRestaurant = restaurantsRes.data[0];
    console.log(`✅ Found restaurant: ${targetRestaurant.name} (${targetRestaurant.cuisine})`);

    // 3. Customer login
    console.log('\n--- 2. Authenticating as Customer ---');
    const loginRes = await axios.post(`${apiBaseUrl}/auth/login`, {
      email: 'customer@hotel.com',
      password: 'customer123',
    });
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Logged in user:', loginRes.data.name, `(${loginRes.data.role})`);

    // 4. Test AI Dietary Assistant
    console.log('\n--- 3. Testing AI Dietary Assistant API ---');
    // Fetch dishes matching Veg, Protein >= 10g, Calories <= 700kcal, Price <= $35, No Peanuts
    const assistantUrl = `${apiBaseUrl}/menu/dietary-assistant?isVeg=true&maxCalories=700&minProtein=10&maxPrice=35&allergies=peanuts`;
    console.log(`Querying: ${assistantUrl}`);
    const assistantRes = await axios.get(assistantUrl);
    console.log(`✅ Assistant response: SUCCESS. Matches found: ${assistantRes.data.length}`);
    
    if (assistantRes.data.length > 0) {
      const match = assistantRes.data[0];
      console.log(`   Sample matching dish: ${match.name}`);
      console.log(`   Calories: ${match.dietaryInfo?.calories} kcal, Protein: ${match.dietaryInfo?.protein}g`);
      console.log(`   Price: $${match.price}, Veg: ${match.dietaryInfo?.isVeg}`);
      console.log(`   AI Insight: "${match.aiInsight}"`);

      // Asserts
      if (match.dietaryInfo?.calories > 700) throw new Error('Calorie filter failed: got item above 700 kcal');
      if (match.dietaryInfo?.protein < 10) throw new Error('Protein filter failed: got item below 10g protein');
      if (match.price > 35) throw new Error('Price filter failed: got item above $35');
      if (!match.dietaryInfo?.isVeg) throw new Error('Veg filter failed: got non-veg item');
      if (match.dietaryInfo?.allergens?.includes('peanuts')) throw new Error('Allergen filter failed: peanut item returned');
      if (!match.aiInsight) throw new Error('AI Insight was not generated!');
    } else {
      console.log('   ⚠️ No items matched the strict constraints, skipping match detail assertion.');
    }

    // 5. Fetch all menu items for the restaurant to use for reservations
    const menuRes = await axios.get(`${apiBaseUrl}/menu?restaurantId=${targetRestaurant._id}`);
    const menuItems = menuRes.data;
    if (menuItems.length === 0) {
      throw new Error('No menu items found for target restaurant to perform pre-order tests.');
    }
    const sampleMain = menuItems.find(m => m.category === 'mains') || menuItems[0];
    const sampleDessert = menuItems.find(m => m.category === 'desserts');

    console.log(`\nSelected pre-order items:`);
    console.log(`   Main: ${sampleMain.name} ($${sampleMain.price})`);
    if (sampleDessert) {
      console.log(`   Dessert: ${sampleDessert.name} ($${sampleDessert.price})`);
    }

    // 6. Test Razorpay Order Creation
    console.log('\n--- 4. Testing Razorpay Order Creation API ---');
    const razorpayOrderPayload = { amount: 25.50 };
    const orderRes = await axios.post(`${apiBaseUrl}/reservations/razorpay-order`, razorpayOrderPayload, authHeaders);
    console.log('✅ Razorpay order status: SUCCESS');
    console.log(`   Order ID: ${orderRes.data.id}, Amount (paise): ${orderRes.data.amount}, Simulated Mode: ${orderRes.data.isSimulated}`);

    // 7. Test Pre-order Reservation with PREORDER10 Discount
    console.log('\n--- 5. Testing PREORDER10 Promo Discount Reservation ---');
    const todayStr = new Date().toISOString().split('T')[0];
    const reservationItems = [{ menuItemId: sampleMain._id, quantity: 2 }];
    
    // Total cost before discount: price * 2
    const totalCost = sampleMain.price * 2;
    const expectedDiscount = Math.round(totalCost * 0.1 * 100) / 100;
    const expectedTotal = Math.round((totalCost - expectedDiscount) * 100) / 100;
    const expectedDeposit = Math.round(expectedTotal * 0.6 * 100) / 100;

    const discountReservationPayload = {
      restaurantId: targetRestaurant._id,
      guestName: 'Discount Tester',
      guestEmail: 'customer@hotel.com',
      guestsCount: 2,
      date: todayStr,
      timeSlot: '18:00',
      tableNumber: 2,
      menuItems: reservationItems,
      discountCode: 'PREORDER10',
      razorpayOrderId: orderRes.data.id,
      razorpayPaymentId: 'pay_SIMPAY' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      razorpaySignature: 'sim_signature_val',
      isSimulatedPayment: true
    };

    const discountRes = await axios.post(`${apiBaseUrl}/reservations`, discountReservationPayload, authHeaders);
    console.log('✅ PREORDER10 Booking status: SUCCESS. Reservation ID:', discountRes.data._id);
    console.log(`   Original Total: $${totalCost}`);
    console.log(`   Discount Code: ${discountRes.data.discountCode}, Amount: $${discountRes.data.discountAmount}`);
    console.log(`   Net Food Total: $${discountRes.data.totalFoodAmount}, 60% Deposit Paid: $${discountRes.data.advanceAmount}`);

    if (discountRes.data.discountAmount !== expectedDiscount) {
      throw new Error(`Discount amount calculation mismatch: expected ${expectedDiscount}, got ${discountRes.data.discountAmount}`);
    }
    if (discountRes.data.advanceAmount !== expectedDeposit) {
      throw new Error(`Deposit calculation mismatch: expected ${expectedDeposit}, got ${discountRes.data.advanceAmount}`);
    }

    // 8. Test Pre-order Reservation with FREEDESSERT Discount
    if (sampleDessert) {
      console.log('\n--- 6. Testing FREEDESSERT Promo Discount Reservation ---');
      const foodItems = [
        { menuItemId: sampleMain._id, quantity: 1 },
        { menuItemId: sampleDessert._id, quantity: 1 }
      ];
      
      const dessertTotalCost = sampleMain.price + sampleDessert.price;
      const dessertExpectedDiscount = sampleDessert.price; // Cheapest dessert becomes free
      const dessertExpectedTotal = sampleMain.price;
      const dessertExpectedDeposit = Math.round(dessertExpectedTotal * 0.6 * 100) / 100;

      const dessertReservationPayload = {
        restaurantId: targetRestaurant._id,
        guestName: 'Dessert Tester',
        guestEmail: 'customer@hotel.com',
        guestsCount: 3,
        date: todayStr,
        timeSlot: '20:00',
        tableNumber: 4,
        menuItems: foodItems,
        discountCode: 'FREEDESSERT',
        razorpayOrderId: 'order_DESSERT_SIM',
        razorpayPaymentId: 'pay_SIMPAY' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        razorpaySignature: 'sim_signature_val_dessert',
        isSimulatedPayment: true
      };

      const dessertRes = await axios.post(`${apiBaseUrl}/reservations`, dessertReservationPayload, authHeaders);
      console.log('✅ FREEDESSERT Booking status: SUCCESS. Reservation ID:', dessertRes.data._id);
      console.log(`   Original Total: $${dessertTotalCost}`);
      console.log(`   Discount Code: ${dessertRes.data.discountCode}, Amount: $${dessertRes.data.discountAmount}`);
      console.log(`   Net Food Total: $${dessertRes.data.totalFoodAmount}, 60% Deposit Paid: $${dessertRes.data.advanceAmount}`);

      if (dessertRes.data.discountAmount !== dessertExpectedDiscount) {
        throw new Error(`Discount amount mismatch: expected ${dessertExpectedDiscount}, got ${dessertRes.data.discountAmount}`);
      }
      if (dessertRes.data.advanceAmount !== dessertExpectedDeposit) {
        throw new Error(`Deposit calculation mismatch: expected ${dessertExpectedDeposit}, got ${dessertRes.data.advanceAmount}`);
      }
    }

    console.log('\n🎉 ALL NEW FEATURE ENDPOINT VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Feature verification failed with error:', error.message);
    if (error.response) {
      console.error('   Details:', error.response.data);
    }
    process.exit(1);
  }
};

runTests();
