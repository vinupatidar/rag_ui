
import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config';


const SourcesPanel = ({ sources, onAddSource, onNewChat, onRemoveSource }) => {
  const [uploadType, setUploadType] = useState('file');
  const [fileInput, setFileInput] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [textInput, setTextInput] = useState('');
  
  // Validation states
  const [fileError, setFileError] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [textError, setTextError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Auto-hide success after 10 seconds
  useEffect(() => {
    if (!uploadSuccess) return;
    const t = setTimeout(() => setUploadSuccess(''), 10000);
    return () => clearTimeout(t);
  }, [uploadSuccess]);

  // File validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];
  const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.csv', '.docx', '.doc', '.txt'];

  const validateFile = (file) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_FILE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return `File type not supported. Please upload only PDF, CSV, Word documents, or text files.`;
    }

    return null; // No error
  };

  const validateWebsiteUrl = (url) => {
    try {
      const urlObj = new URL(url);
      if (!urlObj.protocol.startsWith('http')) {
        return 'Please enter a valid website URL starting with http:// or https://';
      }
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return 'YouTube links are not allowed here. Please use the YouTube tab for YouTube URLs.';
      }
      return null; // No error
    } catch {
      return 'Please enter a valid website URL';
    }
  };

  const validateYoutubeUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const isYouTube = hostname.includes('youtube.com') || hostname.includes('youtu.be');
      if (!isYouTube) {
        return 'Only YouTube URLs are allowed in this field (youtube.com or youtu.be)';
      }
      return null;
    } catch {
      return 'Please enter a valid YouTube URL';
    }
  };

  const validateText = (text) => {
    // Check for special characters that might cause issues
    const specialCharPattern = /[<>{}[\]\\|`~!@#$%^&*()+=;:'"?]/;
    if (specialCharPattern.test(text)) {
      return 'Text contains special characters that are not allowed. Please remove: < > { } [ ] \\ | ` ~ ! @ # $ % ^ & * ( ) + = ; : \' " ?';
    }
    return null; // No error
  };

  const uploadWebsiteToServer = async (url) => {
    const res = await fetch(apiUrl('api/website/'), {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ url })
    });

    let payload;
    try {
      payload = await res.json();
    } catch {
      const t = await res.text();
      payload = { data: t };
    }

    if (!res.ok) {
      throw new Error(payload?.data || `Upload failed with status ${res.status}`);
    }

    const message = String(payload?.data || 'Indexing Completed for the given website');
    return message;
  };

  const uploadYoutubeToServer = async (url) => {
    const res = await fetch(apiUrl('api/youtube'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    let payload;
    try {
      payload = await res.json();
    } catch {
      const t = await res.text();
      payload = { data: t };
    }

    if (!res.ok) {
      throw new Error(payload?.data || `Upload failed with status ${res.status}`);
    }

    const message = String(payload?.data || 'Indexing Completed for the given video');
    return message;
  };

  const uploadFileToServer = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(apiUrl('api/upload/'), {
      method: 'POST',
      body: formData,
    });

    // Try JSON first, fallback to text
    let payload;
    try {
      payload = await res.json();
    } catch {
      const text = await res.text();
      payload = { data: text };
    }

    if (!res.ok) {
      throw new Error(payload?.data || `Upload failed with status ${res.status}`);
    }

    const message = String(payload?.data || '');
    const expected = 'Indexing Completed for the given file';
    if (!message.includes(expected)) {
      throw new Error(message || 'Unexpected response from server');
    }

    return message;
  };

  const uploadPlainTextToServer = async (text) => {
    const res = await fetch(apiUrl('api/plaintext'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    let payload;
    try {
      payload = await res.json();
    } catch {
      const t = await res.text();
      payload = { data: t };
    }

    if (!res.ok) {
      throw new Error(payload?.data || `Upload failed with status ${res.status}`);
    }

    const message = String(payload?.data || 'Indexing Completed for the given text');
    return message;
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setFileError('');
    setUploadSuccess('');

    const process = async () => {
      setUploading(true);
      try {
        for (const file of files) {
          const validationError = validateFile(file);
          if (validationError) {
            setFileError(validationError);
            continue;
          }

          try {
            const msg = await uploadFileToServer(file);
            setUploadSuccess(msg);
            const source = {
              id: Date.now() + Math.random(),
              type: 'file',
              name: file.name,
              size: file.size,
              timestamp: new Date().toLocaleString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
            };
            onAddSource(source);
          } catch (err) {
            setFileError((prev) => prev ? prev + ' \n' + (err?.message || String(err)) : (err?.message || String(err)));
          }
        }
      } finally {
        setUploading(false);
      }
    };

    process();

    // Clear the input so re-selecting same files triggers change
    event.target.value = '';
  };

  const handleWebsiteUpload = async () => {
    setWebsiteError(''); // Clear previous errors
    setUploadSuccess('');
    
    if (!urlInput.trim()) {
      setWebsiteError('Please enter a website URL');
      return;
    }

    const validationError = validateWebsiteUrl(urlInput);
    if (validationError) {
      setWebsiteError(validationError);
      return;
    }

    setUploading(true);
    try {
      const msg = await uploadWebsiteToServer(urlInput.trim());
      setUploadSuccess(msg);

      const source = {
        id: Date.now(),
        type: 'website',
        name: urlInput.trim(),
        timestamp: new Date().toLocaleString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };
      onAddSource(source);
      setUrlInput('');
    } catch (err) {
      setWebsiteError(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleYoutubeUpload = async () => {
    setYoutubeError(''); // Clear previous errors
    setUploadSuccess('');
    
    if (!youtubeInput.trim()) {
      setYoutubeError('Please enter a YouTube URL');
      return;
    }

    const validationError = validateYoutubeUrl(youtubeInput);
    if (validationError) {
      setYoutubeError(validationError);
      return;
    }

    setUploading(true);
    try {
      const msg = await uploadYoutubeToServer(youtubeInput.trim());
      setUploadSuccess(msg);

      const source = {
        id: Date.now(),
        type: 'youtube',
        name: youtubeInput.trim(),
        timestamp: new Date().toLocaleString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };
      onAddSource(source);
      setYoutubeInput('');
    } catch (err) {
      setYoutubeError(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleTextUpload = async () => {
    setTextError(''); // Clear previous errors
    setUploadSuccess('');

    const trimmed = textInput.trim();
    if (!trimmed) {
      setTextError('Please enter some text');
      return;
    }

    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount > 5000) {
      setTextError(`Text exceeds 5000 word limit. Current: ${wordCount} words`);
      return;
    }

    const validationError = validateText(trimmed);
    if (validationError) {
      setTextError(validationError);
      return;
    }

    setUploading(true);
    try {
      const msg = await uploadPlainTextToServer(trimmed);
      setUploadSuccess(msg);

      const source = {
        id: Date.now(),
        type: 'text',
        name: `Text Input (${trimmed.length} characters)`,
        content: trimmed,
        timestamp: new Date().toLocaleString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };
      onAddSource(source);
      setTextInput('');
    } catch (err) {
      setTextError(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  };

  const wordCount = textInput.trim() ? textInput.trim().split(/\s+/).length : 0;
  const isTextValid = textInput.trim().length > 0 && wordCount <= 5000;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sources</h2>
        
        {/* Upload Type Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            <button
            onClick={() => setUploadType('file')}
            disabled={uploading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              uploadType === 'file'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              Files
            </button>
            <button
            onClick={() => setUploadType('website')}
            disabled={uploading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              uploadType === 'website'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              Website
            </button>
            <button
            onClick={() => setUploadType('youtube')}
            disabled={uploading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              uploadType === 'youtube'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              YouTube
            </button>
            <button
            onClick={() => setUploadType('text')}
            disabled={uploading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              uploadType === 'text'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              Text
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onNewChat && onNewChat()}
              disabled={uploading}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
              title="Start a new chat"
            >
              New Chat
            </button>
          </div>
        </div>

        {/* File Upload Section */}
        {uploadType === 'file' && (
          <div className="space-y-4">
            <div className={`border-2 border-dashed ${uploading ? 'border-blue-300 dark:border-blue-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg p-6 text-center ${uploading ? 'animate-pulse' : 'hover:border-blue-400 dark:hover:border-blue-500'} transition-colors duration-200`}>
              <input
                ref={setFileInput}
                type="file"
                multiple
                accept=".pdf,.csv,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => !uploading && fileInput?.click()}
                className={`w-full flex flex-col items-center space-y-2 ${uploading ? 'text-blue-600 dark:text-blue-300 cursor-wait' : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
                disabled={uploading}
              >
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span className="font-medium">{uploading ? 'Uploading & Indexing…' : 'Upload PDF, CSV, Word documents, or text files'}</span>
                <span className="text-sm">Maximum file size: 5MB</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Supported: .pdf, .csv, .doc, .docx, .txt</span>
              </button>
            </div>
            
            {uploading && uploadType === 'file' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center space-x-2">
                <span className="inline-block w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                <span className="text-sm text-blue-700 dark:text-blue-300">Processing...</span>
              </div>
            )}

            {/* Success Display */}
            {uploadSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{uploadSuccess}</span>
                </div>
                <button
                  onClick={() => setUploadSuccess('')}
                  className="ml-3 p-1 rounded hover:bg-green-100 dark:hover:bg-green-800/40"
                  aria-label="Close success message"
                  title="Close"
                >
                  <svg className="w-4 h-4 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* File Error Display */}
            {fileError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium whitespace-pre-line">{fileError}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Website Upload Section */}
        {uploadType === 'website' && (
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="url"
                placeholder="Enter website URL (e.g., https://example.com)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleWebsiteUpload}
                disabled={!urlInput.trim() || uploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>Add</span>
              </button>
            </div>
            
            {uploading && uploadType === 'website' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center space-x-2">
                <span className="inline-block w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                <span className="text-sm text-blue-700 dark:text-blue-300">Processing website…</span>
              </div>
            )}

            {/* Website Success Display */}
            {uploadSuccess && uploadType === 'website' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{uploadSuccess}</span>
                </div>
                <button
                  onClick={() => setUploadSuccess('')}
                  className="ml-3 p-1 rounded hover:bg-green-100 dark:hover:bg-green-800/40"
                  aria-label="Close success message"
                  title="Close"
                >
                  <svg className="w-4 h-4 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Website Error Display */}
            {websiteError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{websiteError}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* YouTube Upload Section */}
        {uploadType === 'youtube' && (
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="url"
                placeholder="Enter YouTube URL (e.g., https://youtube.com/watch?v=...)"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleYoutubeUpload}
                disabled={!youtubeInput.trim() || uploading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Add</span>
              </button>
            </div>
            
            {uploading && uploadType === 'youtube' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center space-x-2">
                <span className="inline-block w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                <span className="text-sm text-blue-700 dark:text-blue-300">Processing YouTube link…</span>
              </div>
            )}

            {/* YouTube Success Display */}
            {uploadSuccess && uploadType === 'youtube' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{uploadSuccess}</span>
                </div>
                <button
                  onClick={() => setUploadSuccess('')}
                  className="ml-3 p-1 rounded hover:bg-green-100 dark:hover:bg-green-800/40"
                  aria-label="Close success message"
                  title="Close"
                >
                  <svg className="w-4 h-4 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* YouTube Error Display */}
            {youtubeError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{youtubeError}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Upload Section */}
        {uploadType === 'text' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <textarea
                placeholder="Enter your text here (up to 5000 words)..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={8}
                maxLength={25000} // Approximate character limit for 5000 words
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center">
                <span className={`text-sm ${
                  wordCount > 5000 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {wordCount} / 5000 words
                </span>
                <button
                  onClick={handleTextUpload}
                  disabled={!isTextValid || uploading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Submit Text</span>
                </button>
              </div>
            </div>
            
            {uploading && uploadType === 'text' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center space-x-2">
                <span className="inline-block w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                <span className="text-sm text-blue-700 dark:text-blue-300">Processing text…</span>
              </div>
            )}

            {/* Text Success Display */}
            {uploadSuccess && uploadType === 'text' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{uploadSuccess}</span>
                </div>
                <button
                  onClick={() => setUploadSuccess('')}
                  className="ml-3 p-1 rounded hover:bg-green-100 dark:hover:bg-green-800/40"
                  aria-label="Close success message"
                  title="Close"
                >
                  <svg className="w-4 h-4 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Text Error Display */}
            {textError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{textError}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-6">
        {sources.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No sources added yet</p>
            <p className="text-xs mt-1">Upload files, add websites, YouTube links, or text to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    source.type === 'file' ? 'bg-blue-100 dark:bg-blue-900' :
                    source.type === 'website' ? 'bg-green-100 dark:bg-green-900' :
                    source.type === 'youtube' ? 'bg-red-100 dark:bg-red-900' :
                    'bg-purple-100 dark:bg-purple-900'
                  }`}>
                    {source.type === 'file' && (
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {source.type === 'website' && (
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    )}
                    {source.type === 'youtube' && (
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {source.type === 'text' && (
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {source.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Uploaded: {source.timestamp}
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => onRemoveSource && onRemoveSource(source.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                      title="Remove source"
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SourcesPanel;
