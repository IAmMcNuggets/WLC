#!/bin/bash

# Database Setup Script for Multi-Company Model
echo "=========================================="
echo -e "\e[32mFirebase Database Setup for Multi-Company Model\e[0m"
echo "=========================================="
echo ""

# Check for Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "✓ \e[32mNode.js detected: $NODE_VERSION\e[0m"
else
    echo -e "✗ \e[31mNode.js is not installed. Please install Node.js and try again.\e[0m"
    exit 1
fi

# Check for Firebase CLI
if command -v firebase &> /dev/null; then
    FIREBASE_VERSION=$(firebase --version)
    echo -e "✓ \e[32mFirebase CLI detected: $FIREBASE_VERSION\e[0m"
else
    echo -e "! \e[33mFirebase CLI not detected. Installing Firebase CLI globally...\e[0m"
    npm install -g firebase-tools
fi

# Install dependencies
echo ""
echo -e "\e[36mInstalling dependencies for database setup...\e[0m"
npm install --prefix . firebase-admin --save

# Check for service account key
echo ""
echo -e "\e[36mChecking for service account key...\e[0m"
if [ -f "service-account-key.json" ]; then
    echo -e "✓ \e[32mService account key found\e[0m"
else
    echo -e "! \e[33mService account key not found\e[0m"
    echo ""
    echo -e "\e[33mTo complete the setup, you need to get a service account key from Firebase.\e[0m"
    echo -e "\e[33mPlease follow these steps:\e[0m"
    echo -e "1. Go to Firebase Console (https://console.firebase.google.com/)"
    echo -e "2. Select your project: gigfriendv2-3079b"
    echo -e "3. Click on Project Settings (gear icon)"
    echo -e "4. Go to Service accounts tab"
    echo -e "5. Click 'Generate new private key'"
    echo -e "6. Save the JSON file as 'service-account-key.json' in this directory"
    echo ""
    
    read -p "Have you downloaded and placed the service account key in this directory? (y/n) " CONFIRMATION
    if [ "$CONFIRMATION" != "y" ]; then
        echo -e "\e[33mPlease complete this step before continuing. See GET-SERVICE-ACCOUNT.md for detailed instructions.\e[0m"
        exit 1
    fi
fi

# Run the initialization script
echo ""
echo -e "\e[36mRunning database initialization script...\e[0m"
node firestore-init.js

echo ""
echo -e "\e[32mDatabase setup process complete!\e[0m"
echo -e "\e[32mPlease check the console output above for any errors or warnings.\e[0m"
echo ""
echo -e "\e[36mNext steps:\e[0m"
echo -e "1. Deploy your application to start using the multi-company model"
echo -e "2. When you sign up as the first user, update the company ownerId in Firestore"
echo -e "3. Review DATABASE-SETUP.md for more information about the database schema"
echo "" 