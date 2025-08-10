import React from "react";
import PdfToCsvConverter from "./components/Pdftocsv";

const PDFConvertPage = () => {
    return(
        <div className="converter-container">
            <PdfToCsvConverter />
        </div>
    );
};

export default PDFConvertPage;