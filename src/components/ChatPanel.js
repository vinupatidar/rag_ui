import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Editor from '@monaco-editor/react';

const CodePreview = ({ language, content, isDark }) => {
  const [height, setHeight] = useState(160);

  const handleMount = (editor, monaco) => {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const update = () => {
      const h = editor.getContentHeight ? editor.getContentHeight() : undefined;
      if (h) {
        const newHeight = clamp(h, 120, 1000);
        setHeight(newHeight);
        const dom = editor.getDomNode();
        if (dom && dom.parentElement) {
          editor.layout({ width: dom.parentElement.clientWidth, height: newHeight });
        }
      } else {
        const model = editor.getModel();
        const lineCount = model ? model.getLineCount() : (content.split('\n').length || 1);
        const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight) || 20;
        const newHeight = clamp(lineCount * lineHeight + 16, 120, 1000);
        setHeight(newHeight);
      }
    };

    update();
    editor.onDidContentSizeChange(update);
  };

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      value={content}
      theme={isDark ? 'vs-dark' : 'light'}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'off',
        automaticLayout: true,
      }}
      onMount={handleMount}
    />
  );
};

const ChatPanel = ({ chatHistory, currentInput, setCurrentInput, onSubmit, onCopyResponse }) => {
  const [isListening, setIsListening] = useState(false);
  const [audioText, setAudioText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const hasPending = Array.isArray(chatHistory) && chatHistory.some((c) => c && c.question && !c.response);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentInput.trim() && !hasPending) {
      onSubmit(currentInput);
    }
  };

  const handleAudioInput = () => {
    if (isListening) {
      setIsListening(false);
      if (audioText.trim()) {
        setCurrentInput(audioText);
        setAudioText('');
      }
    } else {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        setAudioText('This is a simulated audio input. In a real app, this would be actual speech recognition.');
      }, 2000);
    }
  };

  const normalizeResponse = (raw) => {
    if (!raw) return '';
    let s = String(raw);
    s = s.replace(/<<\s*code-editor/gi, '<code-editor');
    s = s.replace(/<\/\s*code-editor\s*>>/gi, '</code-editor>');
    s = s.replace(/(<code-editor[^>]*?)>>/gi, '$1>');
    s = s.replace(/\blanguage\s*=\s*"/gi, 'lang="');
    return s;
  };

  const decodeCodeContent = (content) => {
    if (!content) return '';
    let c = content;
    c = c.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    c = c.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    c = c
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return c;
  };

  const parseResponseBlocks = (response) => {
    if (!response) return [];
    const text = normalizeResponse(response);
    const blocks = [];
    const regex = /<code-editor(?:\s+(?:lang|language)="([^"]+)")?\s*>([\s\S]*?)<\/code-editor>/gi;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const [full, lang, codeContent] = match;
      const start = match.index;
      const end = start + full.length;

      if (start > lastIndex) {
        blocks.push({ type: 'markdown', content: text.slice(lastIndex, start) });
      }

      blocks.push({ type: 'code', language: (lang || 'javascript').toLowerCase(), content: decodeCodeContent(codeContent) });
      lastIndex = end;
    }

    if (lastIndex < text.length) {
      blocks.push({ type: 'markdown', content: text.slice(lastIndex) });
    }

    return blocks;
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const formatDateTime = (value) => {
    let d;
    if (!value) {
      d = new Date();
    } else {
      const tryDate = new Date(value);
      d = isNaN(tryDate.getTime()) ? new Date() : tryDate;
    }
    const day = d.getDate();
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chat</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Ask questions about your uploaded sources
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm mt-1">Upload sources and ask questions to get AI-powered insights</p>
          </div>
        ) : (
          chatHistory.map((chat) => (
            <div key={chat.id} className="space-y-2">
              {/* Question wrapper */}
              <div className="flex justify-end">
                <div className="w-fit max-w-3xl">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">
                    <p className="text-sm leading-relaxed">{chat.question}</p>
                  </div>
                  <div className="mt-1 px-1 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatDateTime(chat.createdAt || chat.timestamp)}</span>
                    <button
                      type="button"
                      onClick={() => onCopyResponse(chat.question)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Copy question"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-100 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Answer wrapper */}
              <div className="flex justify-start">
                <div className="w-fit max-w-3xl">
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 dark:border-gray-700">
                    {chat.response ? (
                      <div className="space-y-4 text-sm leading-relaxed text-gray-900 dark:text-white">
                        {parseResponseBlocks(chat.response).map((block, idx) => {
                          if (block.type === 'code') {
                            return (
                              <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <CodePreview language={block.language} content={block.content} isDark={isDark} />
                              </div>
                            );
                          }
                          return (
                            <ReactMarkdown
                              key={idx}
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                              components={{
                                p: ({ node, ...props }) => (
                                  <p className="my-2 text-sm leading-relaxed text-gray-900 dark:text-white" {...props} />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul className="list-disc pl-5 my-2 text-gray-900 dark:text-white" {...props} />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol className="list-decimal pl-5 my-2 text-gray-900 dark:text-white" {...props} />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className="my-1 text-gray-900 dark:text-white" {...props} />
                                ),
                                strong: ({ node, ...props }) => (
                                  <strong className="font-semibold text-gray-900 dark:text-white" {...props} />
                                ),
                                em: ({ node, ...props }) => (
                                  <em className="italic text-gray-900 dark:text-white" {...props} />
                                ),
                                a: ({ node, ...props }) => (
                                  <a className="underline text-blue-600 dark:text-blue-300" target="_blank" rel="noopener noreferrer" {...props} />
                                ),
                                code: ({ inline, children, ...props }) => (
                                  inline ? (
                                    <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" {...props}>{children}</code>
                                  ) : (
                                    <pre className="p-3 rounded bg-gray-100 dark:bg-gray-800 overflow-x-auto"><code className="text-gray-900 dark:text-gray-100" {...props}>{children}</code></pre>
                                  )
                                ),
                                h1: ({ node, ...props }) => <h1 className="text-base font-semibold mt-3 text-gray-900 dark:text-white" {...props} />, 
                                h2: ({ node, ...props }) => <h2 className="text-base font-semibold mt-3 text-gray-900 dark:text-white" {...props} />, 
                                h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-3 text-gray-900 dark:text-white" {...props} />, 
                                h4: ({ node, ...props }) => <h4 className="text-base font-semibold mt-3 text-gray-900 dark:text-white" {...props} />,
                              }}
                            >
                              {block.content}
                            </ReactMarkdown>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-white/80" aria-label="Generating response">
                        <span className="inline-block w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                        <span className="text-sm">Thinking…</span>
                      </div>
                    )}
                  </div>
                  {chat.response && (
                    <div className="mt-1 px-1 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDateTime(chat.createdAt || chat.timestamp)}</span>
                      <button
                        type="button"
                        onClick={() => onCopyResponse(chat.response)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Copy response"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={hasPending ? 'Waiting for response…' : 'Ask a question about your sources...'}
              disabled={hasPending}
              className={`w-full px-4 py-3 pr-20 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${hasPending ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'}`}
            />
            
            <button
              type="button"
              onClick={handleAudioInput}
              disabled={hasPending}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                hasPending
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-400'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!currentInput.trim() || hasPending}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Send</span>
          </button>
        </form>

        {isListening && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Listening...</span>
            </div>
          </div>
        )}

        {audioText && !isListening && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-sm font-medium">Audio input detected:</span>
              </div>
              <button
                onClick={() => setAudioText('')}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">{audioText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
