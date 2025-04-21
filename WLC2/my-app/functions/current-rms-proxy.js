const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Allow': 'POST',
        'Content-Type': 'application/json'
      }
    };
  }

  try {
    // Parse the request body
    const requestData = JSON.parse(event.body);
    const { endpoint, method = 'GET', params = {}, data = null } = requestData;

    // Validate required fields
    if (!endpoint) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: endpoint' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Construct the API URL
    const apiUrl = `https://api.current-rms.com/api/v1${endpoint}`;

    // Make the request to Current RMS
    const response = await axios({
      method: method,
      url: apiUrl,
      params: params,
      data: data,
      headers: {
        'X-SUBDOMAIN': process.env.REACT_APP_CURRENT_RMS_SUBDOMAIN,
        'X-AUTH-TOKEN': process.env.REACT_APP_CURRENT_RMS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Return the response from Current RMS
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Current RMS Proxy Error:', error);
    
    // Return a structured error response
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: 'Error calling Current RMS API',
        details: error.response?.data || error.message
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 