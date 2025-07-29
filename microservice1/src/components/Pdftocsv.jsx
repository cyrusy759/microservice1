import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import { GlobalWorkerOptions } from "pdfjs-dist";
import '../App.css';

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PdfToCsvConverter = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [csvData, setCsvData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [showDelimiterModal, setShowDelimiterModal] = useState(false);
  const [delimiterSettings, setDelimiterSettings] = useState({
    fieldDelimiter: ',',
    textDelimiter: '"',
    lineDelimiter: '\n',
    escapeCharacter: '"'
  });
  const fileInputRef = useRef(null);

  const tooltips = {
    upload: 'Select a PDF file to convert (max recommended: 5MB)',
    convert: 'Convert the uploaded PDF to CSV format',
    download: 'Download the converted CSV file',
    reset: 'Clear all and start over',
    settings: 'Customize CSV delimiters and formatting'
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvData('');
    setError('');
    setProgress(0);

    if (file.type && !file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    setPdfFile(file);
  };

  const convertPdfToCsv = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProgress(0);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');
        fullText += text + '\n';
        setProgress(Math.round((i / pdf.numPages) * 100));
      }

      const lines = fullText.split('\n').filter(line => line.trim() !== '');
      const csvContent = lines.map(line => {
        // Use the user-defined delimiters
        return `${delimiterSettings.textDelimiter}${line
          .replace(new RegExp(delimiterSettings.textDelimiter, 'g'), 
          delimiterSettings.escapeCharacter + delimiterSettings.textDelimiter)
          .replace(/\r?\n|\r/g, ' ')}${delimiterSettings.textDelimiter}`;
      }).join(delimiterSettings.lineDelimiter);

      setCsvData(csvContent);
      setProgress(100);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert PDF. The file may be corrupted, protected, or too large.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCsv = () => {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, pdfFile.name.replace('.pdf', '') + '.csv');
  };

  const resetAll = () => {
    setPdfFile(null);
    setCsvData('');
    setError('');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelimiterChange = (e) => {
    const { name, value } = e.target;
    setDelimiterSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="pdf-csv-container">
      <h1 className="pdf-csv-title">PDF to CSV Converter</h1>
      
      {error && <div className="pdf-csv-error">{error}</div>}
      
      <div className="pdf-csv-upload-container">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="pdf-csv-hidden-upload"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="pdf-csv-upload-button"
          onMouseEnter={() => setHoveredButton('upload')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {pdfFile ? pdfFile.name : 'Select PDF File'}
          {hoveredButton === 'upload' && (
            <div className="pdf-csv-tooltip">{tooltips.upload}</div>
          )}
        </label>
        
        <button
          onClick={() => setShowDelimiterModal(true)}
          className="pdf-csv-settings-button"
          onMouseEnter={() => setHoveredButton('settings')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          ⚙️ Settings
          {hoveredButton === 'settings' && (
            <div className="pdf-csv-tooltip">{tooltips.settings}</div>
          )}
        </button>
      </div>

      <p className="pdf-csv-note">Works best with files under 5MB. Larger files may take longer.</p>

      {pdfFile && (
        <div className="pdf-csv-button-container">
          <button
            onClick={convertPdfToCsv}
            disabled={isProcessing}
            className={`pdf-csv-action-button ${isProcessing ? 'disabled' : ''}`}
            onMouseEnter={() => setHoveredButton('convert')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            {isProcessing ? 'Converting...' : 'Convert to CSV'}
            {hoveredButton === 'convert' && (
              <div className="pdf-csv-tooltip">{tooltips.convert}</div>
            )}
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="pdf-csv-progress-container">
          <div className="pdf-csv-progress-bar">
            <div 
              className="pdf-csv-progress-fill"
              style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#4CAF50' : '#2196F3'
              }}
            ></div>
          </div>
          <div className="pdf-csv-progress-text">
            {progress}% complete ({progress === 100 ? 'Processing complete!' : 'Processing...'})
          </div>
        </div>
      )}

      {csvData && (
        <div className="pdf-csv-result-container">
          <h3>CSV Output Preview (first 200 chars):</h3>
          <div className="pdf-csv-preview">
            {csvData.substring(0, 200)}...
          </div>
          <div className="pdf-csv-download-group">
            <button
              onClick={downloadCsv}
              className="pdf-csv-download-button"
              onMouseEnter={() => setHoveredButton('download')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Download CSV
              {hoveredButton === 'download' && (
                <div className="pdf-csv-tooltip">{tooltips.download}</div>
              )}
            </button>
          </div>
        </div>
      )}

      {(pdfFile || csvData) && (
        <button
          onClick={resetAll}
          className="pdf-csv-reset-button"
          onMouseEnter={() => setHoveredButton('reset')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Start Over
          {hoveredButton === 'reset' && (
            <div className="pdf-csv-tooltip">{tooltips.reset}</div>
          )}
        </button>
      )}

      {/* Delimiter Settings Modal */}
      {showDelimiterModal && (
        <div className="pdf-csv-modal-overlay">
          <div className="pdf-csv-modal">
            <h3>CSV Format Settings</h3>
            <div className="pdf-csv-modal-content">
              <div className="pdf-csv-setting">
                <label>Field Delimiter:</label>
                <input
                  type="text"
                  name="fieldDelimiter"
                  value={delimiterSettings.fieldDelimiter}
                  onChange={handleDelimiterChange}
                  maxLength="1"
                />
              </div>
              <div className="pdf-csv-setting">
                <label>Text Delimiter:</label>
                <input
                  type="text"
                  name="textDelimiter"
                  value={delimiterSettings.textDelimiter}
                  onChange={handleDelimiterChange}
                  maxLength="1"
                />
              </div>
              <div className="pdf-csv-setting">
                <label>Line Delimiter:</label>
                <select
                  name="lineDelimiter"
                  value={delimiterSettings.lineDelimiter}
                  onChange={handleDelimiterChange}
                >
                  <option value="\n">LF (\\n)</option>
                  <option value="\r\n">CRLF (\\r\\n)</option>
                </select>
              </div>
              <div className="pdf-csv-setting">
                <label>Escape Character:</label>
                <input
                  type="text"
                  name="escapeCharacter"
                  value={delimiterSettings.escapeCharacter}
                  onChange={handleDelimiterChange}
                  maxLength="1"
                />
              </div>
            </div>
            <div className="pdf-csv-modal-buttons">
              <button
                onClick={() => setShowDelimiterModal(false)}
                className="pdf-csv-modal-close"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDelimiterModal(false);
                  if (csvData) convertPdfToCsv(); // Re-convert if we already have data
                }}
                className="pdf-csv-modal-apply"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToCsvConverter;