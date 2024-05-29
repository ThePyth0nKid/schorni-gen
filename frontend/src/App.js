import React, { useState } from 'react';
import axios from 'axios';

const feuerungsanlageOptions = [
  "Kamin", "Ofen", "Heizkessel", "Gasheizung", "Holzofen", "Pelletheizung", "Ölheizung", "Gastherme", "Holzheizung", "Biogasanlage",
  "Elektroheizung", "Solarthermieanlage", "Wärmepumpe", "Blockheizkraftwerk", "Fernwärmeanlage", "Kaminofen", "Holzvergaser", "Brennstoffzellenheizung",
  "Pelletkaminofen", "Öl-Brennwertkessel", "Gas-Brennwerttherme", "Scheitholzkessel", "Gaskamin", "Kohleofen", "Warmwasserboiler", "Biogaskessel",
  "Elektrischer Durchlauferhitzer", "Gasherd", "Heizstrahler", "Holzpelletkessel", "Öl-Heizkessel"
];

const mangelOptions = [
  "Risse im Schornstein", "unzureichende Abgasabführung", "defektes Abgasrohr", "undichte Stellen", "Ascheablagerungen", "fehlender CO-Melder", 
  "unzureichende Brennstofflagerung", "fehlender Funkenschutz", "defekte Zündvorrichtung", "fehlende Wartung", "unzureichende Gasdichtigkeit",
  "Überlastung des Stromnetzes", "unzureichende Wärmeisolierung", "Lärmbelästigung durch Außeneinheit", "unzureichende Verbrennungsluftzufuhr",
  "unzureichende Temperaturregelung", "defekter Wasserstoffsensor", "verstopfte Förderschnecke", "verstopfter Kondensatablauf", "unzureichender Wasserdruck",
  "defekte Flammenüberwachung", "undichte Ofentür", "Kalkablagerungen", "defekte Sicherheitsventile", "defekte Thermostate"
];

const schwereOptions = ["gering", "mittel", "hoch", "schwerwiegend", "bedeutend", "erheblich", "kritisch"];

const aufstellortOptions = ["Wohnzimmer", "Küche", "Schlafzimmer", "Garage", "Keller", "Badezimmer", "Dachboden"];

const App = () => {
  const [formData, setFormData] = useState({
    feuerungsanlage: '',
    mangel: '',
    schwere: '',
    frist: '',
    bemerkungen: '',
    aufstellort: ''
  });
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Sending data to API:', formData);
    try {
      const res = await axios.post('http://localhost:3001/api/generate', formData);
      setResponse(res.data.completion);
      setShowFeedbackForm(true);
    } catch (error) {
      console.error('Error generating bescheid:', error);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/feedback', { feedback, response });
      alert('Feedback submitted successfully');
      setFeedback('');
      setShowFeedbackForm(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <select name="feuerungsanlage" value={formData.feuerungsanlage} onChange={handleChange}>
          {feuerungsanlageOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select name="mangel" value={formData.mangel} onChange={handleChange}>
          {mangelOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select name="schwere" value={formData.schwere} onChange={handleChange}>
          {schwereOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <input type="text" name="frist" value={formData.frist} onChange={handleChange} placeholder="Frist" />
        <input type="text" name="bemerkungen" value={formData.bemerkungen} onChange={handleChange} placeholder="Bemerkungen" />
        <select name="aufstellort" value={formData.aufstellort} onChange={handleChange}>
          {aufstellortOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button type="submit">Generate Bescheid</button>
      </form>
      <div>
        <h3>Generated Bescheid:</h3>
        <p>{response}</p>
      </div>
      {showFeedbackForm && (
        <form onSubmit={handleFeedbackSubmit}>
          <div>
            <label>War der Bescheid hilfreich?</label>
            <button type="button" onClick={() => setFeedback('thumbs-up')}>👍</button>
            <button type="button" onClick={() => setFeedback('thumbs-down')}>👎</button>
          </div>
          {feedback && (
            <div>
              <label>Zusätzliches Feedback:</label>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              <button type="submit">Submit Feedback</button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default App;
