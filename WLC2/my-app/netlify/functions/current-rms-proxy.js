const axios = require('axios');

exports.handler = async function(event, context) {
  console.log('Function invoked with event:', JSON.stringify(event));
  
  // Extract the path and query parameters from the incoming request
  const { path } = event;
  const { queryStringParameters } = event;

  try {
    console.log('Making request to Current RMS API');
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

    console.log('Received response from Current RMS API');
    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error in Netlify function:', error);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify(error.response?.data || { error: 'An error occurred' })
    };
  }
};
