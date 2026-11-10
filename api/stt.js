module.exports = async function handler(req, res) {
  const { audioBase64, mimeType, languageCode } = req.body;
  try {
    const buf = Buffer.from(audioBase64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([buf], { type: mimeType }), 'answer.webm');
    form.append('language_code', languageCode || 'ml-IN');
    form.append('model', process.env.SARVAM_STT_MODEL);
    const r = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: form
    });
    const data = await r.json();
    res.status(200).json({ transcript: data.transcript || '', raw: data });
  } catch (e) {
    res.status(200).json({ transcript: '', error: String(e) });
  }
};