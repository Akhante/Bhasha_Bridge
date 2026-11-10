let recorder, chunks = [];

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream);
  chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.start();
}

function stopRecording(languageCode) {
  return new Promise(resolve => {
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: recorder.mimeType });
      const fr = new FileReader();
      fr.onload = async () => {
        const r = await fetch('/api/stt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: fr.result.split(',')[1],
            mimeType: recorder.mimeType,
            languageCode
          })
        });
        resolve((await r.json()).transcript);
      };
      fr.readAsDataURL(blob);
    };
    recorder.stop();
  });
}

async function classifyAnswer(conceptId, answerText, misconceptions, correctDescription) {
  const labels = misconceptions.map(m => ({ id: m.id, description: m.description_en }));
  const r = await fetch('/api/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conceptId, answerText, labels, correctDescription })
  });
  return await r.json();
}