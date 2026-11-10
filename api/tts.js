module.exports = async function handler(req, res) {
  const { text } = req.body;
  try {
    const r = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: JSON.stringify({ text, target_language_code: 'ml-IN', model: process.env.SARVAM_TTS_MODEL })
    });
    const data = await r.json();
    if (!data.audios) {
      return res.status(200).json({ audioBase64: '', error: JSON.stringify(data) });
    }
    res.status(200).json({ audioBase64: data.audios[0] });
  } catch (e) {
    res.status(200).json({ audioBase64: '', error: String(e) });
  }
};