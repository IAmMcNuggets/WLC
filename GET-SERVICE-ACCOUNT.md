# How to Get Your Firebase Service Account Key

Follow these steps to obtain your Firebase service account key, which is needed for the database initialization script.

## Steps

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Select your project: `gigfriendv2-3079b`

2. **Navigate to Project Settings**
   - Click on the ⚙️ gear icon in the top left
   - Select "Project settings" from the menu

3. **Go to Service Accounts Tab**
   - In the Project Settings page, click on the "Service accounts" tab

4. **Generate New Private Key**
   - Scroll down to the "Firebase Admin SDK" section
   - Click the "Generate new private key" button
   - Confirm by clicking "Generate key" in the dialog

5. **Save the Key File**
   - Your browser will download a JSON file
   - Rename this file to `service-account-key.json`
   - Move it to the root directory of your project

6. **Security Warning**
   - IMPORTANT: This key grants admin access to your Firebase project
   - Do NOT commit this file to version control
   - Add `service-account-key.json` to your `.gitignore` file
   - Keep this key secure and do not share it

## Using the Key

Once you have saved the service account key file, you can run the database initialization script:

```bash
node firestore-init.js
```

## Troubleshooting

If you encounter an error like "Failed to initialize app", check that:
1. The service account key file is named exactly `service-account-key.json`
2. The file is in the same directory where you're running the script
3. The JSON content in the file is valid and not corrupted 