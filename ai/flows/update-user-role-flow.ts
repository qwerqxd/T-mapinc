'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

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
      const editorDoc = await db.collection('users').doc(editorId).get();
      if (!editorDoc.exists || editorDoc.data()?.role !== 'admin') {
        throw new Error('Permission denied: Only administrators can change user roles.');
      }

      // Perform the update
      const targetUserRef = db.collection('users').doc(targetUserId);
      await targetUserRef.update({ role: newRole });

      return {
        success: true,
        message: `Successfully updated role for user ${targetUserId} to ${newRole}.`,
      };
    } catch (error: any) {
      console.error('Error in updateUserRoleFlow:', error);
      // Re-throw the error to be caught by the client-side caller
      throw new Error(error.message || 'An unexpected error occurred while updating user role.');
    }
  }
);

export async function updateUserRole(input: UpdateUserRoleInput): Promise<UpdateUserRoleOutput> {
  return updateUserRoleFlow(input);
}
