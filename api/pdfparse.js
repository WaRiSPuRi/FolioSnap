export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pdfcoKey = process.env.PDFCO_API_KEY;
  if (!pdfcoKey) {
    return res.status(500).json({ error: 'PDFCO_API_KEY not configured in Vercel environment variables' });
  }

  const { action, fileBase64, fileName, fileUrl } = req.body;

  try {
    if (action === 'upload') {
      // Upload base64 file to pdf.co and get a URL back
      const uploadRes = await fetch('https://api.pdf.co/v1/file/upload/base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': pdfcoKey
        },
        body: JSON.stringify({
          file: fileBase64,
          name: fileName || 'resume.pdf'
        })
      });
      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(uploadData.message || 'Upload failed');
      return res.status(200).json({ url: uploadData.url });
    }

    if (action === 'extract') {
      // Extract text from a pdf.co hosted URL
      const extractRes = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': pdfcoKey
        },
        body: JSON.stringify({ url: fileUrl, async: false })
      });
      const extractData = await extractRes.json();
      if (extractData.error) throw new Error(extractData.message || 'Extraction failed');

      // Fetch the actual text content
      const textRes = await fetch(extractData.url);
      const text = await textRes.text();
      return res.status(200).json({ text });
    }

    return res.status(400).json({ error: 'Invalid action. Use "upload" or "extract".' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
