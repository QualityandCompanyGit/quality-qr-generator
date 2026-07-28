import QRCode from 'qrcode';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function POST(request) {
  try {
    const body = await request.json();
    const data = body?.data;

    if (!data || typeof data !== 'string') {
      return Response.json(
        { error: 'A valid data value is required.' },
        { status: 400 }
      );
    }

    // Generate a reliable black-and-white QR code.
    const qrBuffer = await QRCode.toBuffer(data, {
      type: 'png',
      width: 1200,
      margin: 4,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const logoPath = path.join(
      process.cwd(),
      'public',
      'company-logo.png'
    );

    const logoFile = await fs.readFile(logoPath);

    // White backing protects the QR modules underneath the logo.
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
      .png()
      .toBuffer();

    const finalQr = await sharp(qrBuffer)
      .composite([
        {
          input: logoBuffer,
          gravity: 'centre'
        }
      ])
      .png()
      .toBuffer();

    return new Response(finalQr, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="employee-qr.png"',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: 'QR generation failed.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
