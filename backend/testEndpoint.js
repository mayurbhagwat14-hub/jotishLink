import axios from 'axios';

async function testEndpoint() {
  try {
    const res = await axios.post('http://localhost:5000/api/payment/create-order', {
      amount: 50
    }, {
      headers: {
        // Need a valid auth token to test the endpoint. Let's create a token.
        'Content-Type': 'application/json'
      }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

testEndpoint();
