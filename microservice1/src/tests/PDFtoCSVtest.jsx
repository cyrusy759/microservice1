import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import './Test.css';

const PdfConversionTest = () => {
  const [testResults, setTestResults] = useState({
    request: null,
    response: null,
    status: 'idle',
    error: null
  });
  const [testFile, setTestFile] = useState(null);

  const createTestPdf = () => {
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 200 200] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 50 150 Td (Test PDF Content) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000111 00000 n 
0000000198 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
297
%%EOF`;
    
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
    setTestFile(file);
    return file;
  };

  const testConversion = async () => {
    const file = createTestPdf();
    setTestResults({
      request: {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        timestamp: new Date().toISOString()
      },
      response: null,
      status: 'processing',
      error: null
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const startTime = performance.now();
      const response = await fetch('http://localhost:5000/convert', {
        method: 'POST',
        body: formData
      });
      const endTime = performance.now();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvBlob = await response.blob();
      const csvText = await csvBlob.text();

      setTestResults(prev => ({
        ...prev,
        response: {
          csvSize: `${(csvBlob.size / 1024).toFixed(2)} KB`,
          firstLine: csvText.split('\n')[0],
          processingTime: `${(endTime - startTime).toFixed(2)} ms`,
          timestamp: new Date().toISOString()
        },
        status: 'completed'
      }));

      saveAs(csvBlob, 'test_output.csv');

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));
    }
  };

  return (
    <div className="test-container">
      <h2>Microservice Test</h2>
      <button 
        onClick={testConversion}
        className="test-button"
      >
        Run Test
      </button>

      <div className="results-grid">
        <div className="result-column">
          <h3>Request Data</h3>
          <pre className="result-data">
            {testResults.request ? JSON.stringify(testResults.request, null, 2) : 'No request data'}
          </pre>
        </div>
        <div className="result-column">
          <h3>Response Data</h3>
          <pre className="result-data">
            {testResults.response ? JSON.stringify(testResults.response, null, 2) : 'No response data'}
          </pre>
        </div>
      </div>

      <div className="status-container">
        <h3>Test Status</h3>
        <p>
          <strong>Status:</strong> {testResults.status}
          {testResults.status === 'processing'}
        </p>
        {testResults.error && (
          <div className="error-message">
            <strong>Error:</strong> {testResults.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfConversionTest;