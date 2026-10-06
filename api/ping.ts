export default async function handler(req: any, res: any) {
  const result: any = {
    ok: true,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  };

  try {
    const mod = await import('../server/app.js');
    mod.createApp();
    result.appLoads = true;
  } catch (e: any) {
    result.appLoads = false;
    result.error = String(e?.message || e).slice(0, 500);
  }

  res.status(200).json(result);
}