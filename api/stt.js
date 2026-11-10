module.exports = async function handler(req, res) {
  const { audioBase64, mimeType, languageCode } = req.body;
  try {
    // Remove the ";codecs=opus" part, e.g. "audio/webm;codecs=opus" becomes "audio/webm"
    const cleanType = (mimeType || 'audio/webm').split(';')[0];
    const ext = cleanType.includes('mp4') ? 'mp4' : cleanType.includes('ogg') ? 'ogg' : 'webm';

    const buf = Buffer.from(audioBase64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([buf], { type: cleanType }), 'answer.' + ext);
    form.append('language_code', languageCode || 'ml-IN');
    form.append('model', process.env.SARVAM_STT_MODEL);

    const r = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: form
    });
    const data = await r.json();
    res.status(200).json({ transcript: data.transcript || '' });
  } catch (e) {
    res.status(200).json({ transcript: '', error: String(e) });
  }
};