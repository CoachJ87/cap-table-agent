import React from 'react';
import { Trash2 } from 'lucide-react';

export interface Contributor {
  id: string;
  name: string;
  token: string;
  created_at: string;
  interview_completed: boolean;
}

interface ContributorTableProps {
  contributors: Contributor[];
  onViewTranscript: (contributor: Contributor) => void;
  onDelete: (id: string, name: string) => Promise<void>;
}

const ContributorTable: React.FC<ContributorTableProps> = ({ contributors, onViewTranscript, onDelete }) => {

  const copyToClipboard = (token: string) => {
    const link = `${window.location.origin}/contribute/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link: ', err);
    });
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contributors.map((contributor) => (
            <tr key={contributor.id} onClick={() => onViewTranscript(contributor)} className="hover:bg-gray-50 cursor-pointer">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contributor.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(contributor.created_at).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${contributor.interview_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {contributor.interview_completed ? 'Completed' : 'Pending'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(contributor.token);
                    }} 
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete ${contributor.name} and all their messages?`)) {
                        await onDelete(contributor.id, contributor.name);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete contributor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContributorTable;
