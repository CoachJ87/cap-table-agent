import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import { supabase } from '../lib/supabase';
import type { Contributor } from './ContributorTable';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  contributor: Contributor;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ contributor }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [interviewIsFinished, setInterviewIsFinished] = useState(false);
  const [evidenceText, setEvidenceText] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('role, content')
        .eq('contributor_id', contributor.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
        return;
      }

      if (data.length === 0) {
        // Create first message
        const firstMessage = {
          role: 'assistant' as const,
          content: `Hi ${contributor.name}, thank you for taking the time to chat. I'm here to collect your perspective on contributions to the Mother project to help with token allocation. To start, what was your main role or focus area?`,
        };

        // Insert into database first
        const { error: insertError } = await supabase.from('messages').insert({
          contributor_id: contributor.id,
          role: firstMessage.role,
          content: firstMessage.content
        });

        if (!insertError) {
          setMessages([firstMessage]);
        }
      } else {
        // Remove duplicates: keep only unique messages based on content + role
        const uniqueMessages = data.reduce((acc: Message[], current) => {
          const isDuplicate = acc.some(
            msg => msg.role === current.role && msg.content === current.content
          );
          if (!isDuplicate) {
            acc.push(current);
          }
          return acc;
        }, []);

        setMessages(uniqueMessages);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [contributor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (isSending) return;
    
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    setIsSending(true);
    const userMessage: Message = { role: 'user', content: trimmedInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsThinking(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { contributorId: contributor.id, message: trimmedInput },
      });

      if (error) throw error;

      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error calling chat function:', error);
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsThinking(false);
      setIsSending(false);
    }
  };

  const handleEndInterview = async () => {
    // Verify allocation prefs were submitted before allowing interview completion
    if (!contributor.allocation_prefs_submitted_at) {
      alert('Please complete the allocation preferences step first.');
      return;
    }

    // Confirm submission since it's final
    const confirmed = window.confirm(
      'Are you sure you want to submit your interview?\n\n' +
      'Once submitted, you won\'t be able to make any further changes to your responses or allocation preferences.\n\n' +
      'Click OK to submit, or Cancel to continue editing.'
    );

    if (!confirmed) {
      return;
    }

    setIsThinking(true);
    const { error } = await supabase
      .from('contributors')
      .update({
        interview_completed: true,
        interview_completed_at: new Date().toISOString(),
        evidence_text: evidenceText
      })
      .eq('id', contributor.id);

    if (error) {
      console.error('Error ending interview:', error);
      alert('There was an issue ending the interview. Please try again.');
    } else {
      setInterviewIsFinished(true);
    }
    setIsThinking(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-grow p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Step 2 of 2: Interview</span>
              <span>~15-20 minutes total</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <Link
              to={`/contribute/${contributor.token}`}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              ← Back to Allocation Preferences
            </Link>
          </div>
          {loading ? (
            <div className="text-center text-gray-500">Loading conversation...</div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>
      
      {!interviewIsFinished && (
        <div className="p-6 bg-white border-t">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isThinking ? 'Assistant is typing...' : 'Type your message...'}
                disabled={isThinking}
              />
              <button
                onClick={handleSendMessage}
                className="ml-4 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={!inputValue.trim() || isThinking || isSending}
              >
                {isThinking ? '...' : 'Send'}
              </button>
            </div>
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Supporting Documentation (Optional)
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                Paste any relevant text from your work below — strategy docs, notes, plans, meeting summaries, etc. 
                You can paste multiple documents in one go, just separate them with a line like "---" or "=== Document 2 ===". 
                Plain text works best.
              </p>
              <textarea
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                className="w-full h-32 px-3 py-2 border rounded-lg text-sm mb-4"
                placeholder="Paste your documentation here. For multiple docs, separate with --- or a header like '=== Marketing Plan ==='..."
              />
            </div>
            <div className="text-center pt-2">
              <button
                onClick={handleEndInterview}
                className="px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                disabled={isThinking}
              >
                Submit Interview
              </button>
              <p className="text-xs text-gray-500 mt-1">Click when you're ready to finish</p>
            </div>
          </div>
        </div>
      )}
      
      {interviewIsFinished && (
        <div className="p-6 bg-white border-t text-center">
          <h3 className="text-xl font-semibold">Thank You!</h3>
          <p className="text-gray-600 mt-2">Your responses have been recorded. You can now close this window.</p>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
