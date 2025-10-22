'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, doc, getDoc, updateDoc, initializeFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize a Firebase app specifically for this server-side flow.
// This prevents the "calling client code from server" error.
const serverApp = !getApps().find(app => app.name === 'server') 
  ? initializeApp(firebaseConfig, 'server') 
  : getApp('server');

const firestore = initializeFirestore(serverApp);


const UpdateUserRoleInputSchema = z.object({
  editorId: z.string().describe('The UID of the user performing the role change.'),
  targetUserId: z.string().describe('The UID of the user whose role is being changed.'),
  newRole: z.enum(['user', 'admin']).describe('The new role to assign to the user.'),
});

type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleInputSchema>;

const UpdateUserRoleOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

type UpdateUserRoleOutput = z.infer<typeof UpdateUserRoleOutputSchema>;

const updateUserRoleFlow = ai.defineFlow(
  {
    name: 'updateUserRoleFlow',
    inputSchema: UpdateUserRoleInputSchema,
    outputSchema: UpdateUserRoleOutputSchema,
  },
  async (input) => {
    const { editorId, targetUserId, newRole } = input;

    if (editorId === targetUserId) {
      throw new Error('Administrators cannot change their own role.');
    }

    try {
      // Security Check: Verify that the user performing the edit is an admin.
      // This check is now performed using client SDK rules.
      // The actual security is enforced by Firestore Security Rules.
      const editorDocRef = doc(firestore, 'users', editorId);
      const editorDoc = await getDoc(editorDocRef);
      
      if (!editorDoc.exists() || editorDoc.data()?.role !== 'admin') {
        // This check will be enforced by security rules, but it's good to have it here
        // to provide a clearer error message to the client.
        throw new Error('Permission denied: Only administrators can change user roles.');
      }

      // Perform the update
      const targetUserRef = doc(firestore, 'users', targetUserId);
      await updateDoc(targetUserRef, { role: newRole });

      return {
        success: true,
        message: `Successfully updated role for user ${targetUserId} to ${newRole}.`,
      };
    } catch (error: any) {
      console.error('Error in updateUserRoleFlow:', error);
      // Re-throw the error to be caught by the client-side caller
      // The actual permission error will be caught and displayed on the client.
      throw new Error(error.message || 'An unexpected error occurred while updating user role.');
    }
  }
);

export async function updateUserRole(input: UpdateUserRoleInput): Promise<UpdateUserRoleOutput> {
  return updateUserRoleFlow(input);
}
