/**
 * Round 1 page (Resume upload)
 */
import { useState } from 'react';

export default function Round1() {
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    setResume(file);
    
    if (file) {
      setUploading(true);
      // TODO: Upload resume to API
      setTimeout(() => setUploading(false), 1000);
    }
  };

  return (
    <div className="round1-page">
      <div className="round-container">
        <h1>Round 1: Resume Review</h1>
        <p>Upload your resume to proceed with the interview</p>

        <div className="upload-area">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeUpload}
            disabled={uploading}
          />
          {resume && (
            <div className="file-info">
              <p>Selected: {resume.name}</p>
            </div>
          )}
        </div>

        <button className="btn btn-primary" disabled={!resume || uploading}>
          {uploading ? 'Uploading...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
