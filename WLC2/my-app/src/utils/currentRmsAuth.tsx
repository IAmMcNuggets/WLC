const CLIENT_ID = process.env.REACT_APP_CURRENT_RMS_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_CURRENT_RMS_REDIRECT_URI;
const AUTH_URL = 'https://api.current-rms.com/oauth/authorize';
const TOKEN_URL = 'https://api.current-rms.com/oauth/token';

export const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    redirect_uri: REDIRECT_URI!,
    response_type: 'code',
    scope: 'public'
  });
  return `${AUTH_URL}?${params.toString()}`;
};

export const getAccessToken = async (code: string) => {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: process.env.REACT_APP_CURRENT_RMS_CLIENT_SECRET!,
      code: code,
      redirect_uri: REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  return response.json();
};
