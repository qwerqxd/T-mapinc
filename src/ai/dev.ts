'use server';
// This file is used to import flows for their side effects in development.
import { config } from 'dotenv';

config();

// Import flows here for their side effects.
import './flows/get-location-from-coords-flow';
import './flows/update-user-role-flow';
