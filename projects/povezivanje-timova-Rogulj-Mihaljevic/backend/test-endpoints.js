// Testni script za provjeru svih endpointa
console.log('🧪 TeamConnect API Test Script\n');

const BASE_URL = 'http://localhost:5000/api';

async function testEndpoint(name, url, method = 'GET', body = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(BASE_URL + url, options);
    const status = response.status;
    
    console.log(`${status === 200 || status === 201 ? '✅' : '❌'} ${name}: ${status}`);
    
    return response;
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('📡 Testing API Endpoints:\n');
  
  // Public endpoints
  await testEndpoint('Health Check', '/');
  
  // Auth endpoints
  console.log('\n🔐 Auth Endpoints:');
  await testEndpoint('Register', '/auth/register', 'POST', {
    username: 'testuser',
    email: 'test@test.com',
    password: '123456'
  });
  
  // Teams endpoints
  console.log('\n👥 Teams Endpoints:');
  await testEndpoint('Get All Teams', '/teams');
  
  // Add more tests here...
  
  console.log('\n✅ Tests complete!');
}

runTests();