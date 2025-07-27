import React, { useState, useRef } from 'react';
import axios from 'axios';

const FileUploadOCR = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setFile(selectedFile);
    setText('');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle file upload and OCR processing
  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('http://localhost:3000/api/ocr', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      setText(response.data.text);
    } catch (err) {
      console.error('OCR Error:', err);
      setError(err.response?.data?.error || 'Failed to process image');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setFile(null);
    setPreview('');
    setText('');
    setProgress(0);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Image to Text Converter</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image
          </label>
          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200"
            >
              Choose File
            </label>
            <span className="ml-3 text-sm text-gray-600">
              {file ? file.name : 'No file selected'}
            </span>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Image Preview</h2>
            <div className="border rounded-md p-2">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto"
              />
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isLoading && (
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Processing...</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={handleSubmit}
            disabled={!file || isLoading}
            className={`py-2 px-4 rounded-md transition duration-200 ${
              !file || isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isLoading ? 'Processing...' : 'Extract Text'}
          </button>
          <button
            onClick={handleReset}
            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-md transition duration-200"
          >
            Reset
          </button>
        </div>

        {/* Extracted Text */}
        {text && (
          <div>
            <h2 className="text-lg font-medium mb-2">Extracted Text</h2>
            <div className="border rounded-md p-4 bg-gray-50 whitespace-pre-wrap">
              {text}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(text)}
              className="mt-3 py-1 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition duration-200"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadOCR;