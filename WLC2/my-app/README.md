# Gigfriend App

A React application for event management, time tracking, team chat, and training resources.

## Features

- Firebase Authentication with Google Sign-In
- Real-time Chat with Firestore
- Event Management via Current RMS Integration
- Time Clock for logging work hours
- Training Resource Management
- Profile Management

## Tech Stack

- **Frontend**: React with TypeScript
- **Styling**: Styled Components
- **State Management**:
  - React Context API
  - React Query for data fetching
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Routing**: React Router
- **API Integration**: Axios
- **Icons**: React Icons
- **Date Handling**: date-fns

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React Contexts for state management
├── hooks/           # Custom React hooks
├── Pages/           # Main application views
├── services/        # API and Firebase services
├── types/           # TypeScript type definitions
├── Utils/           # Utility functions
├── Background/      # Background images
├── Logos/           # Application logos
├── App.tsx          # Main App component
├── index.tsx        # Application entry point
└── firebase.ts      # Firebase configuration
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase Account
- Current RMS Account (for event management)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd WLC2/my-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with the following environment variables:
   ```
   REACT_APP_FIREBASE_API_KEY=<your-firebase-api-key>
   REACT_APP_FIREBASE_AUTH_DOMAIN=<your-firebase-auth-domain>
   REACT_APP_FIREBASE_PROJECT_ID=<your-firebase-project-id>
   REACT_APP_FIREBASE_STORAGE_BUCKET=<your-firebase-storage-bucket>
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<your-firebase-messaging-sender-id>
   REACT_APP_FIREBASE_APP_ID=<your-firebase-app-id>
   REACT_APP_FIREBASE_MEASUREMENT_ID=<your-firebase-measurement-id>
   
   REACT_APP_CURRENT_RMS_TOKEN=<your-current-rms-api-token>
   REACT_APP_CURRENT_RMS_SUBDOMAIN=<your-current-rms-subdomain>
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

2. The application will be available at `http://localhost:3000`

### Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

### Deployment

This project is set up for deployment to Netlify. The configuration is located in the `netlify.toml` file.

To deploy:
1. Set up the environment variables in Netlify
2. Connect your repository to Netlify
3. Configure the build command as `npm run build` or `yarn build`
4. Set the publish directory to `build`

## Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable Authentication with Google provider
3. Create a Firestore database with the following collections:
   - `messages` - for chat messages
   - `timeEntries` - for time clock entries
   - `userProfiles` - for user profile information
   - `trainingMaterials` - for training resources
4. Set up Firebase Storage for file uploads

## Firebase Security Rules

The Firestore security rules for this application are located in `firestore.rules`. They include:

- Authentication checks for all operations
- User-based access controls for personal data
- Admin-only privileges for certain operations

## Current RMS Integration

The application integrates with Current RMS API for event management. To set up:

1. Obtain an API token from your Current RMS account
2. Set the API token and subdomain in the `.env` file
3. The application uses a proxy to avoid CORS issues, configure this in `package.json`

## Project Improvements

### Code Structure
- Components are organized into features and shared components
- Common styles are extracted to `CommonStyles.tsx`
- Form handling is abstracted through custom hooks

### Performance Optimizations
- React memo for pure components
- Lazy loading of routes
- Optimized image assets
- Caching with React Query

### UI/UX Enhancements
- Responsive design for mobile and desktop
- Consistent styling with styled-components
- Accessibility improvements
- Toast notifications for user feedback

## License

[MIT License](LICENSE)
