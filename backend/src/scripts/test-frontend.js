import axios from 'axios';

const testFrontend = async () => {
  console.log('🔌 Testing Frontend server response at http://localhost:5173...');
  try {
    const response = await axios.get('http://localhost:5173');
    console.log('✅ Frontend Server check: SUCCESS');
    console.log(`   Status code: ${response.status}`);
    console.log(`   Content Type: ${response.headers['content-type']}`);
    console.log('   Response preview: HTML served successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Frontend Server check: FAILED');
    console.error(`   Error message: ${error.message}`);
    process.exit(1);
  }
};

testFrontend();
