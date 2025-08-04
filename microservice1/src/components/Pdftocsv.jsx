import React, { useState } from 'react';
import { saveAs } from 'file-saver';

const PdfToCsvConverter = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }

      const csvBlob = await response.blob();
      saveAs(csvBlob, file.name.replace('.pdf', '') + '.csv');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="converter-container">
      <h1>PDF to CSV Converter</h1>
      
      <input 
        type="file" 
        onChange={handleFileChange} 
        accept=".pdf" 
      />
      
      <button 
        onClick={handleConvert} 
        disabled={!file || isLoading}
      >
        {isLoading ? 'Converting...' : 'Convert to CSV'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {file && (
        <div className="file-info">
          Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </div>
      )}
    </div>
  );
};

export default PdfToCsvConverter;