module.exports = {
  onPreBuild: ({ utils }) => {
    // Check if Firebase API key is available
    if (!process.env.REACT_APP_FIREBASE_API_KEY) {
      utils.build.failBuild('Required environment variable REACT_APP_FIREBASE_API_KEY is missing');
    }
    
    // Log what environment variables are available (masking sensitive values)
    console.log('Available environment variables for Firebase:');
    console.log('REACT_APP_FIREBASE_API_KEY:', process.env.REACT_APP_FIREBASE_API_KEY ? 'Set ✅' : 'Not set ❌');
    console.log('REACT_APP_FIREBASE_AUTH_DOMAIN:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? 'Set ✅' : 'Not set ❌');
    console.log('REACT_APP_FIREBASE_PROJECT_ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'Set ✅' : 'Not set ❌');
    
    // Check Current RMS API credentials
    console.log('Current RMS API credentials:');
    console.log('REACT_APP_CURRENT_RMS_SUBDOMAIN:', process.env.REACT_APP_CURRENT_RMS_SUBDOMAIN ? 'Set ✅' : 'Not set ❌');
    console.log('REACT_APP_CURRENT_RMS_API_KEY:', process.env.REACT_APP_CURRENT_RMS_API_KEY ? 'Set ✅' : 'Not set ❌');
  }
}; 