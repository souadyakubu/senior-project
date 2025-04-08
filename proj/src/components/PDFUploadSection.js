import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PDFUploadSection = () => {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const navigate = useNavigate();

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        
        if (file) {
            console.log("File selected:", file.name, "Type:", file.type, "Size:", file.size);
            
            // Check if file is PDF
            if (file.type !== 'application/pdf') {
                setFileError("Please upload a PDF file");
                setUploadedFile(null);
                return;
            }

            // Check file size (limit to 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setFileError("File size should be less than 10MB");
                setUploadedFile(null);
                return;
            }

            setFileError("");
            setUploadedFile(file);
        }
    };

    const handleReadPDF = () => {
        if (uploadedFile) {
            // Use FileReader to ensure the file is fully loaded before creating a URL
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Create a Blob with proper MIME type
                const blob = new Blob([e.target.result], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                
                console.log("Created Blob URL:", blobUrl);
                
                // Navigate to BookReader with the PDF file info
                navigate(`/book/pdf-reader`, { 
                    state: { 
                        pdfUrl: blobUrl,
                        fileName: uploadedFile.name,
                        isPdf: true
                    }
                });
            };
            
            reader.onerror = function(e) {
                console.error("Error reading file:", e);
                setFileError("Error processing the PDF file");
            };
            
            // Read the file as an ArrayBuffer
            reader.readAsArrayBuffer(uploadedFile);
        }
    };

    return (
        <div className="pdf-upload-section" style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #444',
            borderRadius: '5px',
            backgroundColor: '#1e1e1e'
        }}>
            <h2 style={{ marginBottom: '1rem', color: '#fff' }}>Upload Your Own PDF</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #444',
                        borderRadius: '5px',
                        backgroundColor: '#2d2d2d',
                        color: '#fff'
                    }}
                />
                {fileError && (
                    <p style={{ color: '#ff6b6b' }}>{fileError}</p>
                )}
                {uploadedFile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <p style={{ color: '#69db7c' }}>
                            {uploadedFile.name} selected
                        </p>
                        <button
                            onClick={handleReadPDF}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#4263eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Read PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFUploadSection;