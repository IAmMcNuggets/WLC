const axios = require('axios');

exports.handler = async function(event, context) {
  const { path, httpMethod, headers, queryStringParameters, body } = event;

  console.log('Received request:', { path, method: httpMethod, headers, queryStringParameters });

  try {
    const url = `https://api.current-rms.com/api/v1${path.replace(/^\/\.netlify\/functions\/current-rms-proxy/, '')}`;
    console.log('Forwarding request to:', url);

    const response = await axios({
      url,
      method: httpMethod,
      headers: {
        'X-SUBDOMAIN': process.env.REACT_APP_CURRENT_RMS_SUBDOMAIN,
        'X-AUTH-TOKEN': process.env.REACT_APP_CURRENT_RMS_API_KEY,
        'Content-Type': 'application/json',
        ...headers,
      },
      params: queryStringParameters,
      data: body ? JSON.parse(body) : undefined,
    });

    console.log('Received response:', { status: response.status, data: response.data });

    return {
      statusCode: response.status,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Error in serverless function:', error);
    return {
      statusCode: error.response ? error.response.status : 500,
      body: JSON.stringify({ 
        error: error.message,
        details: error.response ? error.response.data : 'No additional details'
      }),
    };
  }
};
