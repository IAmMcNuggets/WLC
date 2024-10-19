const axios = require('axios');

exports.handler = async function(event, context) {
  const { path, httpMethod, headers, body } = event;

  try {
    const response = await axios({
      url: `https://api.current-rms.com/api/v1${path.replace(/^\/\.netlify\/functions\/current-rms-proxy/, '')}`,
      method: httpMethod,
      headers: {
        'X-SUBDOMAIN': process.env.REACT_APP_CURRENT_RMS_SUBDOMAIN,
        'X-AUTH-TOKEN': process.env.REACT_APP_CURRENT_RMS_API_KEY,
        'Content-Type': 'application/json',
        ...headers,
      },
      data: body ? JSON.parse(body) : undefined,
    });

    return {
      statusCode: response.status,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: error.response ? error.response.status : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
