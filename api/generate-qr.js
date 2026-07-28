import QRCode from 'qrcode';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;

    if (!data || typeof data !== 'string') {
      return res.status(400).json({
        error: 'A valid data value is required.'
      });
    }

    const qrBuffer = await QRCode.toBuffer(data, {
      type: 'jpg',
      width: 1200,
      margin: 4,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const logoPath = path.join(process.cwd(), 'public', 'OIP.jpg');
    const logoFile = await fs.readFile(logoPath);

    const logoBuffer = await sharp(logoFile)
      .resize({
        width: 190,
        height: 190,
        fit: 'contain'
      })
      .extend({
        top: 18,
        bottom: 18,
        left: 18,
        right: 18,
        background: '#FFFFFF'
      })
      .jpg()
      .toBuffer();

    const finalQr = await sharp(qrBuffer)
      .composite([
        {
          input: logoBuffer,
          gravity: 'centre'
        }
      ])
      .jpg()
      .toBuffer();

    res.setHeader('Content-Type', 'image/jpg');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(finalQr);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'QR generation failed.',
      details: err.message
    });
  }
}
