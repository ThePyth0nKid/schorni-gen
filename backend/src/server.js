const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OpenAI API-Key ist nicht definiert. Bitte setzen Sie die Umgebungsvariable OPENAI_API_KEY.');
}

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

// Funktion zur Generierung des Mangeltexts mit der OpenAI API (GPT-3.5 Turbo)
const generateMangelText = async (formData) => {
  const prompt = `Schreiben Sie einen Mangeltext basierend auf folgenden Details:
  Feuerungsanlage: ${formData.feuerungsanlage}
  Mangel: ${formData.mangel}
  Schwere: ${formData.schwere}
  Frist: ${formData.frist}
  Der Mangeltext soll ohne direkte Anrede und Gruß geschrieben werden und folgende Anweisung enthalten:
  "Ich bitte Sie, die Mängel bis spätestens zum ${formData.frist} zu beseitigen und die Zweitschrift an den zuständigen Bevollmächtigten Bezirksschornsteinfeger zurückzusenden. Wenn der Bevollmächtigte Bezirksschornsteinfeger bis zum angegebenen Termin von Ihnen keine Rückmeldung hat, ist er dazu verpflichtet, eine Kopie dieser Mängelmitteilung an die zuständige Behörde weiterzuleiten."`;

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
    throw new Error('Fehler bei der Generierung des Mangeltexts');
  }
};

// Funktion zum Erstellen eines neuen PDFs mit generiertem Mangeltext und Formulardaten
const createPdf = async (formData, generatedText) => {
  // Pfad zur PDF-Vorlage
  const pdfPath = path.join(__dirname, 'bescheid-form.pdf');
  const existingPdfBytes = fs.readFileSync(pdfPath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0]; // Annahme: Nur eine Seite wird verwendet

  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const fontSizeAdresse = 12;
  const fontSizeTelNumber = 8;
  const fontSizeImGebäude = 10;

  // Formulardaten für den Kopfbereich und Gebäudedaten einfügen
  page.drawText(formData.name, {
    x: 50,
    y: height - 50,
    size: fontSizeAdresse,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formData.behörde, {
    x: 50,
    y: height - 64,
    size: fontSizeAdresse,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formData.behördenstrasse, {
    x: 50,
    y: height - 78,
    size: fontSizeAdresse,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formData.behördenPLZ, {
    x: 50,
    y: height - 92,
    size: fontSizeAdresse,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Tel.: ${formData.telefon}`, {
    x: 50,
    y: height - 110,
    size: fontSizeTelNumber,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Fax: ${formData.fax}`, {
    x: 50,
    y: height - 120,
    size: fontSizeTelNumber,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Im Gebäude:`, {
    x: 343,
    y: height - 42,
    size: fontSizeImGebäude,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formData.bürgerstrasse, {
    x: 343,
    y: height - 59,
    size: fontSizeImGebäude,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(formData.bürgerPLZ, {
    x: 343,
    y: height - 70,
    size: fontSizeImGebäude,
    font: font,
    color: rgb(0, 0, 0),
  });

    // Zeichne den Label-Text "Gebäudeteil:"
  page.drawText('Gebäudeteil:', {
    x: 343,
    y: height - 87,
    size: fontSizeImGebäude,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Zeichne die Benutzereingabe unter dem Label-Text
  page.drawText(`${formData.gebäudeteil}`, {
    x: 343,
    y: height - 98, // Passe die Y-Koordinate an, um den Text darunter zu platzieren
    size: fontSizeImGebäude,
    font: font,
    color: rgb(0, 0, 0),
  });


  page.drawText(`Datum: ${formData.datum}`, {
    x: 344,
    y: height - 130,
    size: fontSizeImGebäude,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Verzeichnis-Nr.: ${formData.verzeichnisNr}`, {
    x: 344,
    y: height - 150,
    size: fontSizeImGebäude,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Liegenschafts-Nr.: ${formData.liegenschaftsNr}`, {
    x: 344,
    y: height - 170,
    size: fontSizeImGebäude,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Mängelfeststellung`, {
    x: 50,
    y: height - 258,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`- Mitteilung an den Eigentümer - entsprechend § 5 Schornsteinfeger-Handwerksgesetz`, {
    x: 50,
    y: height - 274,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Im o.g. Gebäude wurden folgende Mängel vorgefunden:`, {
    x: 50,
    y: height - 300,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Generierter Mangeltext einfügen
  page.drawText(generatedText, {
    x: 50,
    y: height - 320,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Ich bitte Sie, die Mängel bis spätestens zum ${formData.frist} zu beseitigen und die Zweitschrift an den zuständigen Bevollmächtigten Bezirksschornsteinfeger zurückzusenden.`, {
    x: 50,
    y: height - 420,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Wenn der Bevollmächtigte Bezirksschornsteinfeger bis zum angegebenen Termin von Ihnen keine`, {
    x: 50,
    y: height - 440,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Rückmeldung hat, ist er dazu verpflichtet, eine Kopie dieser Mängelmitteilung an die zuständige Behörde`, {
    x: 50,
    y: height - 460,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`weiterzuleiten.`, {
    x: 50,
    y: height - 480,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Mit freundlichen Grüßen`, {
    x: 50,
    y: height - 520,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Berlin, ${formData.datum}`, {
    x: 50,
    y: height - 540,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Ort, Datum`, {
    x: 50,
    y: height - 580,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Unterschrift des Bevollmächtigten Bezirksschornsteinfegers`, {
    x: 250,
    y: height - 580,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Die Mängelfeststellung erfolgt zu Ihrer Sicherheit! Bitte haben Sie deshalb Verständnis dafür, dass die festgesetzte Frist eingehalten werden muss.`, {
    x: 50,
    y: height - 640,
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
    const completion = await generateMangelText(formData);
    console.log('Generierter Text:', completion);
    res.json({ completion });
  } catch (error) {
    next(error);
  }
});

app.post('/api/generate-pdf', async (req, res, next) => {
  try {
    const { formData, completion } = req.body;
    const pdfBytes = await createPdf(formData, completion);

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
