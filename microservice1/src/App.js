import './App.css';
import PdfToCsvConverter from './components/Pdftocsv';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Microservice 1</h1>
      </header>
      <div className="app-content">
        <Navigation />
        <main className="app-main">
          <div className="converter-container">
            <PdfToCsvConverter />
          </div>
        </main>
      </div> 
      <footer className="app-footer">
        <p>Copyright</p>
      </footer>
    </div>
  );
}

export default App;