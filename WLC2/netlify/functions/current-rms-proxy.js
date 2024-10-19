const axios = require('axios');

exports.handler = async function(event, context) {
  const { path, queryStringParameters } = event;

  try {
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

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify(error.response?.data || { error: 'An error occurred' })
    };
  }
};

