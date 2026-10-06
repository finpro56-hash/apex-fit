/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const getProjectId = () => process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

const initialProjectId = getProjectId();
if (initialProjectId) {
  if (getApps().length === 0) {
    initializeApp({ projectId: initialProjectId });
  }
} else {
  console.error('FIREBASE_PROJECT_ID and VITE_FIREBASE_PROJECT_ID are missing from environment variables.');
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const projectId = getProjectId();
  if (!projectId) {
    console.error('Server auth is not configured: missing Firebase project ID.');
    return res.status(500).json({ error: 'Server auth is not configured' });
  }

  if (getApps().length === 0) {
    initializeApp({ projectId });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7).trim();
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
