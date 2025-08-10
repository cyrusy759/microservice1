import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';

const PdfToCsvConverter = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    if (!isAuthenticated) {
      setError('Please login first');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/convert', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }

      const csvBlob = await response.blob();
      saveAs(csvBlob, file.name.replace('.pdf', '') + '.csv');
      
    } catch (err) {
      if (err.message === 'Authentication required' || 
          err.message === 'Invalid token') {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setError('Session expired. Please login again.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  return (
    <div className="converter-container">
      <h1>PDF to CSV Converter</h1>
      
      {!isAuthenticated ? (
        <div className="auth-message">
          <p>You need to login to use this service</p>
          <button onClick={handleLoginRedirect}>Go to Login</button>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default PdfToCsvConverter;