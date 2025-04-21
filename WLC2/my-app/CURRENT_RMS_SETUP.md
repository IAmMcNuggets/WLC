# Current RMS API Configuration Guide

## Getting Your Current RMS API Key

To fix the 401 Unauthorized error, you need to set up your Current RMS API credentials correctly. Follow these steps:

1. **Log in to your Current RMS account**
   - Go to [https://app.current-rms.com/](https://app.current-rms.com/)
   - Sign in with your Current RMS credentials

2. **Access the API settings**
   - Click on your user icon in the top-right corner
   - Select "System Settings"
   - Navigate to "Integrations"
   - Select "API"

3. **Generate a new API Key**
   - If you don't already have an API key, click "Generate API Key"
   - If you have an existing key, you can use that one
   - Copy the API key

4. **Update your environment variables**
   - Open the `.env.local` file in your project
   - Replace `your-api-key` with the actual API key you copied:
   
   ```
   REACT_APP_CURRENT_RMS_SUBDOMAIN=translucentdesigngroup
   REACT_APP_CURRENT_RMS_API_KEY=your-actual-api-key-here
   ```

5. **Restart your application**
   - Stop your React development server
   - Run `npm start` to restart it
   - The error should now be resolved

## Troubleshooting

If you still see the 401 Unauthorized error after following these steps:

1. **Check the console logs**
   - Look for the "Current RMS API Configuration" log
   - Verify both subdomain and API key are defined

2. **Verify your API key**
   - Make sure the API key is correctly copied without any extra spaces
   - You can generate a new API key in Current RMS if needed

3. **Check your user permissions**
   - Ensure your Current RMS user has API access permissions

4. **Test with a direct API call**
   - Use a tool like Postman to test the API directly
   - Try a simple GET request to `https://api.current-rms.com/api/v1/activities`
   - Include the same headers:
     ```
     X-SUBDOMAIN: translucentdesigngroup
     X-AUTH-TOKEN: your-api-key
     Content-Type: application/json
     ```

Remember that the API key is sensitive information and should not be committed to version control or shared publicly. 