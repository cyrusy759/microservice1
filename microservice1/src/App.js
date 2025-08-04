import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import PdfToCsvConverter from './components/Pdftocsv';
import TestPage from './TestPage';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Microservice 1</h1>
      </header>
      <div className="app-content">
        <Navigation />
        <main className="app-main">
          <Routes>
            <Route path="/" element={
              <div className="converter-container">
                <PdfToCsvConverter />
              </div>
            } />
            <Route path="/test" element={
              <div className="converter-container">
                <TestPage />
              </div>
            } />
          </Routes>
        </main>
      </div>
      <footer className="app-footer">
        <p>Copyright</p>
      </footer>
    </div>
  );
}

export default App;