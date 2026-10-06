/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Request, Response, NextFunction } from 'express';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

if (projectId) {
  if (getApps().length === 0) {
    initializeApp({ projectId });
  }
} else {
  console.error('FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID environment variable is missing.');
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const currentProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!currentProjectId) {
    console.error('Server auth is not configured: Missing Firebase Project ID');
    return res.status(500).json({ error: 'Server auth is not configured' });
  }

  if (getApps().length === 0) {
    initializeApp({ projectId: currentProjectId });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    res.locals.uid = decodedToken.uid;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
}
