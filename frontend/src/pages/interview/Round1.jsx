import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { UploadCloud, File, AlertCircle, Loader2 } from 'lucide-react';

const Round1 = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scoreData, setScoreData] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
    } else {
      setError('Please upload a valid PDF file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const currentInterview = JSON.parse(localStorage.getItem('current_interview'));
    if (!currentInterview || !currentInterview.id) {
      setError('Interview ID not found. Please start over.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/interview/round1?interview_id=${currentInterview.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setScoreData(res.data);
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Round 1: Resume Screening</h2>
        <p className="text-gray-400">Upload your PDF resume so our AI can analyze your skillset.</p>
      </div>

      <div className="glass-card max-w-xl w-full">
        {!scoreData ? (
          <>
            <div 
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors
                ${file ? 'border-primary-500 bg-primary-500/5' : 'border-gray-500 hover:border-gray-400 bg-dark-800/50'}`}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/pdf" 
                className="hidden" 
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <File className="w-12 h-12 text-primary-400 mb-4" />
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="text-sm text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="font-medium text-white">Click to upload your resume</p>
                  <p className="text-sm text-gray-400 mt-1">PDF format only (Max 5MB)</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="mt-8">
              <button 
                onClick={handleUpload} 
                className="btn-primary w-full flex justify-center items-center gap-2"
                disabled={!file || loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze Resume'}
              </button>
            </div>
          </>
        ) : (
          <div className="animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/10 border-4 border-primary-500 mb-4">
                <span className="text-2xl font-bold text-primary-400">{scoreData.score}%</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Resume Analyzed!</h3>
              <p className="text-gray-400">Here's what our AI found.</p>
            </div>

            <div className="bg-dark-800/80 rounded-lg p-5 border border-white/10 mb-6">
              <h4 className="font-medium text-white mb-3 pt-2">Extracted Skills:</h4>
              <div className="flex flex-wrap gap-2">
                {scoreData.skills_extracted?.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                    {skill}
                  </span>
                ))}
                {(!scoreData.skills_extracted || scoreData.skills_extracted.length === 0) && (
                  <span className="text-gray-500 text-sm">No skills found or failed to parse.</span>
                )}
              </div>
            </div>

            <button 
              onClick={() => navigate('/test')} 
              className="btn-primary w-full"
            >
              Proceed to Next Round (Online Test)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Round1;
