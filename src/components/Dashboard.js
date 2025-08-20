
import React, { useState, useEffect } from 'react';
import { apiUrl, getUserSessionId } from '../config';
import Header from './DashboardHeader';
import SourcesPanel from './SourcesPanel';
import ChatPanel from './ChatPanel';

const STORAGE_KEY = 'chatHistory';
const SOURCES_STORAGE_KEY = 'uploadedSources';

const Dashboard = ({ onNavigateToLanding }) => {
  const [sources, setSources] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState('');

  // Load chat history and sources from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        // Test if localStorage is available
        if (typeof localStorage === 'undefined') {
          console.error('localStorage is not available');
          return;
        }
        
        // Load chat history
        const chatRaw = localStorage.getItem(STORAGE_KEY);
        console.log('Loading chat history from localStorage:', chatRaw);
        if (chatRaw) {
          const chatParsed = JSON.parse(chatRaw);
          console.log('Parsed chat data:', chatParsed);
          if (Array.isArray(chatParsed) && chatParsed.length > 0) {
            // Reset pending flags on reload
            const normalized = chatParsed.map((c) => ({
              ...c,
              pending: false,
            }));
            console.log('Loaded chat history:', normalized);
            setChatHistory(normalized);
          } else {
            console.log('No valid chat history found in localStorage');
          }
        } else {
          console.log('No chat data found in localStorage for key:', STORAGE_KEY);
        }

        // Load sources
        const sourcesRaw = localStorage.getItem(SOURCES_STORAGE_KEY);
        console.log('Loading sources from localStorage:', sourcesRaw);
        if (sourcesRaw) {
          const sourcesParsed = JSON.parse(sourcesRaw);
          console.log('Parsed sources data:', sourcesParsed);
          if (Array.isArray(sourcesParsed) && sourcesParsed.length > 0) {
            console.log('Loaded sources:', sourcesParsed);
            setSources(sourcesParsed);
          } else {
            console.log('No valid sources found in localStorage');
          }
        } else {
          console.log('No sources data found in localStorage for key:', SOURCES_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    };

    // Load immediately
    loadData();
  }, []);

  // Persist chat history whenever it changes
  useEffect(() => {
    // Don't save on initial load when chatHistory is empty
    if (chatHistory.length === 0) {
      console.log('Skipping save - chatHistory is empty (likely initial load)');
      return;
    }
    
    try {
      console.log('Saving chat history to localStorage:', chatHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
      console.log('Chat history saved successfully');
    } catch (error) {
      console.error('Error saving chat history to localStorage:', error);
    }
  }, [chatHistory]);

  // Persist sources whenever they change
  useEffect(() => {
    try {
      console.log('Saving sources to localStorage:', sources);
      localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(sources));
      console.log('Sources saved successfully');
    } catch (error) {
      console.error('Error saving sources to localStorage:', error);
    }
  }, [sources]);

  const handleAddSource = (source) => {
    setSources([...sources, source]);
  };

  const handleRemoveSource = async (sourceId, fileId) => {
    try {
      if (fileId) {
        await fetch(apiUrl('api/delete'), {
          method: 'POST',
          headers: {
            'usersessionid': getUserSessionId(),
            'fileid': String(fileId)
          }
        });
      }
    } catch {}
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  const handleNewChat = () => {
    setChatHistory([]);
    try {
      localStorage.setItem('chatHistory', JSON.stringify([]));
    } catch {}
  };

  const handleChatSubmit = async (message) => {
    if (!message.trim()) return;

    const newChatId = Date.now();
    const newChat = {
      id: newChatId,
      question: message,
      response: '',
      pending: true,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatHistory((prev) => [...prev, newChat]);
    setCurrentInput('');

    try {
      const response = await fetch(apiUrl('api/search/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'usersessionid': getUserSessionId()
        },
        body: JSON.stringify({ input: message })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Streaming not supported in this browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isSSE = contentType.includes('text/event-stream');

      let buffered = '';
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        const chunkText = decoder.decode(value || new Uint8Array(), { stream: !done });
        if (!chunkText) continue;

        if (isSSE) {
          buffered += chunkText;
          const lines = buffered.split(/\r?\n/);
          buffered = lines.pop() || '';
          for (const line of lines) {
            if (!line) continue;
            // If your server uses `data:` prefix, strip it here
            const data = line.startsWith('data:') ? line.slice(5).replace(/^\s/, '') : line;
            setChatHistory((prev) => prev.map((chat) =>
              chat.id === newChatId ? { ...chat, response: (chat.response || '') + data } : chat
            ));
          }
        } else {
          setChatHistory((prev) => prev.map((chat) =>
            chat.id === newChatId ? { ...chat, response: (chat.response || '') + chunkText } : chat
          ));
        }
      }

      // Mark complete
      setChatHistory((prev) => prev.map((chat) =>
        chat.id === newChatId ? { ...chat, pending: false } : chat
      ));
    } catch (err) {
      setChatHistory((prev) => prev.map((chat) =>
        chat.id === newChatId ? { ...chat, response: `Error: ${err.message}`, pending: false } : chat
      ));
    }
  };

  const handleCopyResponse = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Debug function to check localStorage
  const debugLocalStorage = () => {
    console.log('=== localStorage Debug ===');
    console.log('localStorage available:', typeof localStorage !== 'undefined');
    console.log('Chat history in localStorage:', localStorage.getItem(STORAGE_KEY));
    console.log('Sources in localStorage:', localStorage.getItem(SOURCES_STORAGE_KEY));
    console.log('Current chatHistory state:', chatHistory);
    console.log('Current sources state:', sources);
    console.log('=======================');
  };

  // Add debug function to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.debugLocalStorage = debugLocalStorage;
    }
  }, [chatHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header onNavigateToLanding={onNavigateToLanding} />
      <div className="flex h-screen pt-16">
        {/* Left Panel - Sources (30%) */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <SourcesPanel 
            sources={sources} 
            onAddSource={handleAddSource}
            onNewChat={handleNewChat}
            onRemoveSource={handleRemoveSource}
          />
        </div>
        
        {/* Right Panel - Chat (70%) */}
        <div className="w-2/3 bg-white dark:bg-gray-800">
          <ChatPanel 
            chatHistory={chatHistory}
            currentInput={currentInput}
            setCurrentInput={setCurrentInput}
            onSubmit={handleChatSubmit}
            onCopyResponse={handleCopyResponse}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
