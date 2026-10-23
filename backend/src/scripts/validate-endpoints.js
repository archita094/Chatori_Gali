import axios from 'axios';

const apiBaseUrl = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting Backend API validation...');

  try {
    // 1. Test Base Route
    console.log('Testing connection to server base route...');
    const baseRes = await axios.get('http://localhost:5000/');
    console.log('✅ Base Server check:', baseRes.status === 200 ? 'SUCCESS' : 'FAILED', `(${baseRes.data.message})`);

    // 2. Fetch Restaurants Directory
    console.log('\nTesting Restaurants Directory fetching...');
    const restaurantsRes = await axios.get(`${apiBaseUrl}/restaurants`);
    console.log('✅ Restaurants check: SUCCESS. Count:', restaurantsRes.data.length);
    if (restaurantsRes.data.length === 0) {
      throw new Error('No restaurants seeded in database.');
    }
    const targetRestaurant = restaurantsRes.data[0];
    console.log(`   Target restaurant: ${targetRestaurant.name} (${targetRestaurant.cuisine})`);

    // 3. Test login with seeded customer
    console.log('\nTesting Customer login...');
    const loginRes = await axios.post(`${apiBaseUrl}/auth/login`, {
      email: 'customer@hotel.com',
      password: 'customer123',
    });
    const token = loginRes.data.token;
    console.log('✅ Auth check: SUCCESS. Logged in user:', loginRes.data.name, `(${loginRes.data.role})`);

    // Setup headers for subsequent authenticated requests
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 4. Test Fetch Menu for Target Restaurant
    console.log('\nTesting Menu fetching for target restaurant...');
    const menuRes = await axios.get(`${apiBaseUrl}/menu?restaurantId=${targetRestaurant._id}`);
    console.log('✅ Menu check: SUCCESS. Menu count:', menuRes.data.length);
    if (menuRes.data.length === 0) {
      throw new Error(`No menu items found for restaurant ${targetRestaurant.name}`);
    }
    const firstMenuItem = menuRes.data[0];
    console.log(`   Sample item: ${firstMenuItem?.name} - $${firstMenuItem?.price}`);
    if (firstMenuItem.dietaryInfo) {
      console.log(`   Dietary details: isVeg=${firstMenuItem.dietaryInfo.isVeg}, calories=${firstMenuItem.dietaryInfo.calories} kcal, allergens=${firstMenuItem.dietaryInfo.allergens?.join(', ') || 'None'}`);
    } else {
      throw new Error('dietaryInfo is missing on fetched menu item!');
    }

    // 5. Test Busy Hours
    console.log('\nTesting Busy Hours...');
    const todayStr = new Date().toISOString().split('T')[0];
    const busyRes = await axios.get(`${apiBaseUrl}/reservations/busy-hours?date=${todayStr}&restaurantId=${targetRestaurant._id}`);
    console.log('✅ Busy Hours check: SUCCESS. Time Slots returned:', busyRes.data.length);

    // Find the slot with max occupancy
    const maxOccupancySlot = busyRes.data.reduce((max, slot) => slot.occupancy > max.occupancy ? slot : max, busyRes.data[0]);
    console.log(`   Peak slot for today: ${maxOccupancySlot.time} (${maxOccupancySlot.occupancy}% full)`);

    // 6. Test create reservation
    console.log('\nTesting create reservation...');
    const newReservationPayload = {
      restaurantId: targetRestaurant._id,
      guestName: 'John Doe Test',
      guestEmail: 'customer@hotel.com',
      guestsCount: 2,
      date: todayStr,
      timeSlot: '21:00',
      tableNumber: 3, // Valid table number (seeded 1-6)
      menuItems: [
        { menuItemId: firstMenuItem._id, quantity: 2 }
      ],
      paymentCardLast4: '9876'
    };

    const reservationRes = await axios.post(`${apiBaseUrl}/reservations`, newReservationPayload, authHeaders);
    console.log('✅ Create Reservation check: SUCCESS. Reservation ID:', reservationRes.data._id);
    console.log(`   Advance payment calculated (60%): $${reservationRes.data.advanceAmount}`);

    // 7. Test Fetch Customer bookings
    console.log('\nTesting customer bookings fetching...');
    const bookingsRes = await axios.get(`${apiBaseUrl}/reservations/my-bookings`, authHeaders);
    console.log('✅ Fetch Bookings check: SUCCESS. My bookings count:', bookingsRes.data.length);

    console.log('\n🎉 ALL BACKEND API VALIDATION TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    if (error.response) {
      console.error('   Details:', error.response.data);
    }
    process.exit(1);
  }
};

runTests();
