# Multi-Company Model Implementation

This project has been upgraded to support a multi-company model, allowing users to:
1. Create their own account
2. Search and request to join multiple companies
3. View events from all joined companies in one place

## Deployment Setup

1. **Firebase Rules**: The Firestore security rules have been deployed to support the multi-company model.

2. **Database Setup**:
   - On Windows: Run `setup-database.ps1` PowerShell script
   - On macOS/Linux: First make the script executable with `chmod +x setup-database.sh`, then run `./setup-database.sh`

3. **Service Account Key**:
   - You'll need to get a service account key from Firebase
   - See `GET-SERVICE-ACCOUNT.md` for detailed instructions
   - Save the key as `service-account-key.json` in the project root

## New Components

The following components have been added to support the multi-company model:

- **CompanySignup**: For company owners to create a company account
- **Dashboard**: Shows all companies a user is associated with
- **CompanySearch**: Allows searching and requesting to join companies
- **CompanyManagement**: For owners to manage membership requests

## Database Schema

The database has been redesigned to include:

- `companies`: Company information
- `companyMembers`: User-company relationships (with status: active, pending, rejected)
- `events`: Company-specific events
- `trainingMaterials`: Training content (can be company-specific or global)

See `DATABASE-SETUP.md` for a detailed schema overview.

## Getting Started

After setup:

1. Deploy your application
2. Create the first user account 
3. Create a company or request to join existing companies
4. When a user creates a company, they automatically become the owner
5. Company owners can manage membership requests in the Company Management section

## Need Help?

If you encounter any issues with the setup, please refer to the detailed documentation:
- `DATABASE-SETUP.md`: Database schema and configuration
- `GET-SERVICE-ACCOUNT.md`: Instructions for obtaining the Firebase service account key 