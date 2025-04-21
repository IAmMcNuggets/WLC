# Netlify Deployment Guide

## Overview

This guide will help you correctly deploy your React application to Netlify, ensuring all environment variables and configuration are properly set up.

## Environment Variables

Since your application depends on environment variables (Current RMS and Firebase), you must configure these in Netlify:

1. **Go to your Netlify dashboard**
   - Log in to [Netlify](https://app.netlify.com/)
   - Select your site

2. **Set up environment variables**
   - Go to **Site Settings**
   - Click on **Environment variables**
   - Add the following variables with their corresponding values:

   ```
   REACT_APP_CURRENT_RMS_SUBDOMAIN=translucentdesigngroup
   REACT_APP_CURRENT_RMS_API_KEY=b93fz-Y-JbkGiyxNbScu
   REACT_APP_FIREBASE_API_KEY=AIzaSyBZt7OLIQO-DtLJSDMP8ZERRpIyHfCESkw
   REACT_APP_FIREBASE_AUTH_DOMAIN=gigfriend-9b3ea.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=gigfriend-9b3ea
   REACT_APP_FIREBASE_STORAGE_BUCKET=gigfriend-9b3ea.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=457762949335
   REACT_APP_FIREBASE_APP_ID=1:457762949335:web:b7023fd07a527bb6774892
   REACT_APP_FIREBASE_MEASUREMENT_ID=G-47QE5FT56P
   ```

## Build Settings

Make sure your build settings are correctly configured:

1. **Verify build settings**
   - Go to **Site Settings** > **Build & deploy**
   - Ensure the base directory is set correctly (typically `/` or point to your app's directory if it's not at the root)
   - Build command should be: `npm run build`
   - Publish directory should be: `build`

2. **Add a netlify.toml file** (if not already present)
   - This file should be in your project root (not just in the public folder)
   - It should include redirect rules for client-side routing:

   ```toml
   [build]
     command = "npm run build"
     publish = "build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

## CORS Configuration

For API requests to Current RMS:

1. **Add Netlify site URL to allowed origins**
   - If Current RMS has CORS restrictions, make sure to add your Netlify domain
   - This is especially important if you're using a custom domain

2. **Consider using Netlify functions for API requests**
   - If you continue to have CORS issues, you can create a Netlify function to proxy requests

## Troubleshooting

If you're still experiencing issues:

1. **Check build logs**
   - In Netlify dashboard, go to **Deploys** and click on the latest deployment
   - Look for any build errors or warnings

2. **Enable debugging**
   - Add this environment variable to show more verbose logs: `DEBUG=*`

3. **Test locally with production settings**
   - Run `npm run build` locally
   - Use the `serve` package to test your production build:
     ```
     npm install -g serve
     serve -s build
     ```

4. **Check browser console**
   - Open your deployed site
   - Press F12 to open developer tools
   - Check the console for any errors

## Additional Resources

- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
- [Netlify Environment Variables Documentation](https://docs.netlify.com/configure-builds/environment-variables/)
- [Create React App Deployment Guide](https://create-react-app.dev/docs/deployment/) 