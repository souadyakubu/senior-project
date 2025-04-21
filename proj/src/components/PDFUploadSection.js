import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PDFUploadSection = () => {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const navigate = useNavigate();

    /**
     * Creates a more reliable blob URL by ensuring proper binary data handling
     * @param {File} file - The PDF file to process
     * @returns {Promise<string>} - A promise that resolves to the blob URL
     */
    const createReliableBlobUrl = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    // Ensure the file is read as binary data
                    const arrayBuffer = event.target.result;
                    
                    // Create the blob with the correct MIME type
                    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
                    
                    // Create and store the blob URL
                    const blobUrl = URL.createObjectURL(blob);
                    
                    console.log("Created reliable blob URL:", blobUrl);
                    
                    // Store the URL to prevent garbage collection
                    // This is important! The URL might get revoked if not stored properly
                    window.pdfBlobUrls = window.pdfBlobUrls || {};
                    window.pdfBlobUrls[file.name] = blobUrl;
                    
                    resolve(blobUrl);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function(error) {
                console.error("Error reading file:", error);
                reject(error);
            };
            
            // Read the file as an ArrayBuffer (binary data)
            reader.readAsArrayBuffer(file);
        });
    };

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

    const handleReadPDF = async () => {
        if (uploadedFile) {
            try {
                setFileError("");
                
                // Use the utility function to create a reliable blob URL
                const blobUrl = await createReliableBlobUrl(uploadedFile);
                
                // Navigate to the reader with the blob URL
                navigate(`/book/pdf-${encodeURIComponent(uploadedFile.name)}`, { 
                    state: { 
                        pdfUrl: blobUrl,
                        fileName: uploadedFile.name,
                        isPdf: true
                    }
                });
            } catch (error) {
                console.error("Error creating PDF blob URL:", error);
                setFileError("Failed to process PDF file. Please try again or use a different file.");
            }
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