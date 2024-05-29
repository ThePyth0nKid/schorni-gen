const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OpenAI API-Key ist nicht definiert. Bitte setzen Sie die Umgebungsvariable OPENAI_API_KEY.');
}

// Funktion zur Generierung des Bescheids mit der OpenAI API (GPT-3.5 Turbo)
const generateBescheid = async (formData) => {
  const prompt = `Erstellen Sie einen Mängelbescheid mit den folgenden Details:
  Feuerungsanlage: ${formData.feuerungsanlage},
  Mangel: ${formData.mangel},
  Schwere: ${formData.schwere},
  Frist: ${formData.frist}`;

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.5
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    console.log('OpenAI API response:', response.data);
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Fehler bei der Abfrage der OpenAI API:', error.response ? error.response.data : error.message);
    throw new Error('Fehler bei der Generierung des Bescheids');
  }
};

// Funktion zum Ausfüllen des PDFs mit generiertem Text und Formulardaten
const fillPdf = async (formData, generatedText) => {
  const pdfPath = path.resolve(__dirname, 'Mängel-Meldung SchfHwG §5 LGS 287.000 vom 27.05.24.pdf');
  const existingPdfBytes = await fs.readFile(pdfPath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  const { width, height } = firstPage.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;

  // Generierten Text und Formulardaten an den richtigen Positionen einfügen
  firstPage.drawText(`Feuerungsanlage: ${formData.feuerungsanlage}`, {
    x: 50,
    y: height - 120,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`Mangel: ${formData.mangel}`, {
    x: 50,
    y: height - 140,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`Schwere: ${formData.schwere}`, {
    x: 50,
    y: height - 160,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`Frist: ${formData.frist}`, {
    x: 50,
    y: height - 180,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(generatedText, {
    x: 50,
    y: height - 250,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

app.post('/api/generate', async (req, res, next) => {
  try {
    const formData = req.body;
    const completion = await generateBescheid(formData);
    console.log('Generierter Text:', completion);
    res.json({ completion });
  } catch (error) {
    next(error);
  }
});

app.post('/api/generate-pdf', async (req, res, next) => {
  try {
    const { formData, completion } = req.body;
    const pdfBytes = await fillPdf(formData, completion);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Mängelbescheid.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    next(error);
  }
});

app.post('/api/feedback', (req, res) => {
  const { feedback, response } = req.body;
  console.log('Feedback erhalten:', { feedback, response });
  res.json({ message: 'Feedback erhalten' });
});

// Fehlerbehandlungsmiddleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
