const axios = require('axios');

exports.handler = async function(event, context) {
  // Extract the path and query parameters from the incoming request
  const { path } = event;
  const { queryStringParameters } = event;

  try {
    // Make the request to Current RMS API
    const response = await axios({
      method: 'GET',
      url: `https://api.current-rms.com/api/v1${path}`,
      params: queryStringParameters,
      headers: {
        'X-SUBDOMAIN': process.env.REACT_APP_CURRENT_RMS_SUBDOMAIN,
        'X-AUTH-TOKEN': process.env.REACT_APP_CURRENT_RMS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Return the response from Current RMS
    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    // Handle any errors
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify(error.response?.data || { error: 'An error occurred' })
    };
  }
};
