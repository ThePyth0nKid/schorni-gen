const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Ausgabe des API-Schlüssels für Debugging-Zwecke
console.log('Verwendeter OpenAI API-Schlüssel:', OPENAI_API_KEY);

if (!OPENAI_API_KEY) {
  throw new Error('OpenAI API-Key ist nicht definiert. Bitte setzen Sie die Umgebungsvariable OPENAI_API_KEY.');
}

const generateBescheid = async (formData) => {
  const prompt = `Feuerungsanlage: ${formData.feuerungsanlage}, Mangel: ${formData.mangel}, Schwere: ${formData.schwere}, Frist: ${formData.frist}`;
  try {
    const response = await axios.post('https://api.openai.com/v1/completions', {
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 100,
      temperature: 0.5
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error fetching data from OpenAI API:', error.response ? error.response.data : error.message);
    throw new Error('Fehler bei der Generierung des Bescheids');
  }
};

app.post('/api/generate', async (req, res) => {
  try {
    const formData = req.body;
    const completion = await generateBescheid(formData);
    res.json({ completion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/feedback', (req, res) => {
  const { feedback, response } = req.body;
  console.log('Feedback erhalten:', { feedback, response });
  res.json({ message: 'Feedback erhalten' });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
