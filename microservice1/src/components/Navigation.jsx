import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; // Import the CSS from one directory up

function Navigation() {
    return (
        <nav className="App-nav">
            <Link to="/" className="nav-link">Upload a different file</Link>
        </nav>
    );
}

export default Navigation;