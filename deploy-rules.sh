#!/bin/bash

# Script to deploy Firestore rules

echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo "Rules deployment complete!" 