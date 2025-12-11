import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface TranscriptViewProps {
  contributorName: string;
  contributorId: string;
  onClose: () => void;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ contributorName, contributorId, onClose }) => {
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranscript = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contributor_id', contributorId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching transcript:', error);
      } else {
        setTranscript(data || []);
      }
      setLoading(false);
    };

    fetchTranscript();
  }, [contributorId]);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Transcript for {contributorName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
          {loading ? (
            <p>Loading transcript...</p>
          ) : (
            transcript.map((message) => (
              <div key={message.id} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(message.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t text-right">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptView;
