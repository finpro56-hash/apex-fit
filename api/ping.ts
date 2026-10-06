/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasFirebaseProjectId: !!(process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID),
    nodeEnv: process.env.NODE_ENV,
  });
}
