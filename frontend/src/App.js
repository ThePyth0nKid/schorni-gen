import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

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

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Fieldset = styled.fieldset`
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Legend = styled.legend`
  padding: 0 10px;
  font-weight: bold;
`;

const Select = styled.select`
  padding: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Input = styled.input`
  padding: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 0.75rem;
  margin: 1rem 0;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const ResponseContainer = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background-color: #e9ecef;
  border-radius: 4px;
`;

const FeedbackForm = styled.form`
  margin-top: 1rem;
`;

const FeedbackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  margin: 0 0.5rem;

  &:hover {
    color: #0056b3;
  }
`;

const TextArea = styled.textarea`
  padding: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const App = () => {
  const [formData, setFormData] = useState({
    feuerungsanlage: '',
    mangel: '',
    schwere: '',
    frist: '',
    bemerkungen: '',
    aufstellort: '',
    name: '',
    behörde: '',
    behördenstrasse: '',
    behördenPLZ: '',
    datum: '',
    telefon: '',
    fax: '',
    bürgerstrasse: '',
    bürgerPLZ: '',
    gebäudeteil: '',
    verzeichnisNr: '',
    liegenschaftsNr: ''
  });
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(false);

  useEffect(() => {
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    setFormData((prevData) => ({
      ...prevData,
      datum: currentDate
    }));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Daten werden an die API gesendet:', formData);
    try {
      const res = await axios.post('http://localhost:3001/api/generate', formData);
      console.log('API-Antwort:', res.data);
      setResponse(res.data.completion);
      setShowFeedbackForm(true);
    } catch (error) {
      console.error('Fehler bei der Generierung des Bescheids:', error);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/feedback', { feedback, response });
      alert('Feedback erfolgreich übermittelt');
      setFeedback('');
      setShowFeedbackForm(false);
      setShowDownloadButton(true);
    } catch (error) {
      console.error('Fehler beim Übermitteln des Feedbacks:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/generate-pdf', { formData, completion: response }, {
        responseType: 'blob'
      });
      console.log('PDF-Generierung erfolgreich:', res);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Mängelbescheid.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Fehler bei der PDF-Generierung:', error);
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Fieldset>
          <Legend>Bescheid Kopf</Legend>
          <Input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
          <Input type="text" name="behörde" value={formData.behörde} onChange={handleChange} placeholder="Behörde" />
          <Input type="text" name="behördenstrasse" value={formData.behördenstrasse} onChange={handleChange} placeholder="Straße" />
          <Input type="text" name="behördenPLZ" value={formData.behördenPLZ} onChange={handleChange} placeholder="PLZ" />
          <Input type="text" name="telefon" value={formData.telefon} onChange={handleChange} placeholder="Telefon" />
          <Input type="text" name="fax" value={formData.fax} onChange={handleChange} placeholder="Fax" />
          <Input type="text" name="datum" value={formData.datum} onChange={handleChange} placeholder="Datum" disabled />
        </Fieldset>
        <Fieldset>
          <Legend>Im Gebäude</Legend>
          <Input type="text" name="bürgerstrasse" value={formData.bürgerstrasse} onChange={handleChange} placeholder="Straße" />
          <Input type="text" name="bürgerPLZ" value={formData.bürgerPLZ} onChange={handleChange} placeholder="PLZ" />
          <Input type="text" name="gebäudeteil" value={formData.gebäudeteil} onChange={handleChange} placeholder="Gebäudeteil" />
          <Input type="text" name="verzeichnisNr" value={formData.verzeichnisNr} onChange={handleChange} placeholder="Verzeichnis-Nr" />
          <Input type="text" name="liegenschaftsNr" value={formData.liegenschaftsNr} onChange={handleChange} placeholder="Liegenschafts-Nr" />
          <Input type="text" name="datum" value={formData.datum} onChange={handleChange} placeholder="Datum" disabled />
        </Fieldset>
        <Select name="feuerungsanlage" value={formData.feuerungsanlage} onChange={handleChange}>
          <option value="">Wählen Sie eine Feuerungsanlage</option>
          {feuerungsanlageOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
        <Select name="mangel" value={formData.mangel} onChange={handleChange}>
          <option value="">Wählen Sie einen Mangel</option>
          {mangelOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
        <Select name="schwere" value={formData.schwere} onChange={handleChange}>
          <option value="">Wählen Sie die Schwere</option>
          {schwereOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
        <Input type="text" name="frist" value={formData.frist} onChange={handleChange} placeholder="Frist" />
        <Input type="text" name="bemerkungen" value={formData.bemerkungen} onChange={handleChange} placeholder="Bemerkungen" />
        <Select name="aufstellort" value={formData.aufstellort} onChange={handleChange}>
          <option value="">Wählen Sie einen Aufstellort</option>
          {aufstellortOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
        <Button type="submit">Bescheid Generieren</Button>
      </Form>
      <ResponseContainer>
        <p>{response}</p>
      </ResponseContainer>
      {showFeedbackForm && (
        <FeedbackForm onSubmit={handleFeedbackSubmit}>
          <div>
            <label>War der Bescheid hilfreich?</label>
            <FeedbackButton type="button" onClick={() => setFeedback('thumbs-up')}>👍</FeedbackButton>
            <FeedbackButton type="button" onClick={() => setFeedback('thumbs-down')}>👎</FeedbackButton>
          </div>
          {feedback && (
            <div>
              <label>Zusätzliches Feedback:</label>
              <TextArea value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              <Button type="submit">Feedback Übermitteln</Button>
            </div>
          )}
        </FeedbackForm>
      )}
      {showDownloadButton && (
        <Button onClick={handleDownload}>PDF Herunterladen</Button>
      )}
    </Container>
  );
};

export default App;
