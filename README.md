# PDF to CSV Converter Microservice

# Communication Contract

# Requesting Data (API Specification)

To request a PDF to CSV conversion, make a POST request to the `/convert` endpoint with the PDF file as form data.

**Endpoint**: `POST /convert`

**Headers**:
- `Content-Type`: `multipart/form-data`

**Body**:
- `file`: PDF file to convert (required)

**Example Request (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('file', pdfFile); // pdfFile is a File object

const response = await fetch('http://your-service-url/convert', {
  method: 'POST',
  body: formData
  // Headers are automatically set by browser for FormData
});
```

# Response Handling
The service will respond with the CSV data in the response body with appropriate headers.

# Example of succesfully receiving data
Successful Response (200 OK):

Content-Type: text/csv

Content-Disposition: attachment; filename="converted.csv"

# UML diagram

![alt text](../images/uml.drawio.png)
