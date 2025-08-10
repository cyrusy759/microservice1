import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import * as Tesseract from 'tesseract.js';

const ImageToCsvConverter = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please select a JPG or PNG image file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const extractTextFromImage = async (imageFile) => {
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      return text;
    } catch (err) {
      throw new Error('Failed to extract text from image');
    }
  };

  const convertTextToCsv = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => `"${line.replace(/"/g, '""')}"`).join('\n');
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select an image file');
      return;
    }

    if (!isAuthenticated) {
      setError('Please login first');
      return;
    }

    setIsLoading(true);
    setError('');
    setProgress(0);

    try {
      const extractedText = await extractTextFromImage(file);
      
      const csvContent = convertTextToCsv(extractedText);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, file.name.replace(/\.[^/.]+$/, '') + '.csv');
      
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
      setProgress(0);
    }
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  return (
    <div className="converter-container">
      <h1>Image to CSV Converter</h1>
      
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
            accept="image/jpeg,image/png,image/jpg" 
          />
          
          {isLoading && (
            <div className="progress-bar">
              <progress value={progress} max="100" />
              <span>{progress}%</span>
            </div>
          )}
          
          <button 
            onClick={handleConvert} 
            disabled={!file || isLoading}
          >
            {isLoading ? 'Converting...' : 'Convert to CSV'}
          </button>
          
          {error && <div className="error">{error}</div>}
          
          {file && (
            <div className="file-info">
              <p>Selected: {file.name}</p>
              <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
              <img 
                src={URL.createObjectURL(file)} 
                alt="Preview" 
                style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '10px' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageToCsvConverter;