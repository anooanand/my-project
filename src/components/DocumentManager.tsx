import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Type, Trash2, FolderOpen, Search, Filter, Download, Eye, X, Plus } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  textType: string;
  wordCount: number;
  dateCreated: string;
  lastModified: string;
}

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDocument: (doc: Document) => void;
  onDeleteDocument?: (docId: string) => void;
}

export function DocumentManager({ isOpen, onClose, onLoadDocument, onDeleteDocument }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('dateCreated');

  // Load documents from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedDocs = JSON.parse(localStorage.getItem('writingDocuments') || '[]');
      setDocuments(savedDocs);
    }
  }, [isOpen]);

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || doc.textType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'dateCreated') {
        return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'wordCount') {
        return b.wordCount - a.wordCount;
      }
      return 0;
    });

  const handleDeleteDocument = (docId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this document? This action cannot be undone.');
    if (confirmed) {
      const updatedDocs = documents.filter(doc => doc.id !== docId);
      setDocuments(updatedDocs);
      localStorage.setItem('writingDocuments', JSON.stringify(updatedDocs));
      if (onDeleteDocument) {
        onDeleteDocument(docId);
      }
    }
  };

  const handleExportDocument = (doc: Document) => {
    const content = `${doc.title}\n\nText Type: ${doc.textType}\nWord Count: ${doc.wordCount}\nCreated: ${new Date(doc.dateCreated).toLocaleDateString()}\n\n${doc.content}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTextTypeColor = (textType: string) => {
    switch (textType.toLowerCase()) {
      case 'narrative': return 'bg-blue-100 text-blue-800';
      case 'persuasive': return 'bg-green-100 text-green-800';
      case 'expository': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FolderOpen className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">My Writing Documents</h2>
                <p className="text-blue-100">Manage your saved writing projects</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="narrative">Narrative</option>
                  <option value="persuasive">Persuasive</option>
                  <option value="expository">Expository</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dateCreated">Date Created</option>
                  <option value="title">Title</option>
                  <option value="wordCount">Word Count</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Document List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {documents.length === 0 ? 'No documents saved yet' : 'No documents match your search'}
              </h3>
              <p className="text-gray-500">
                {documents.length === 0 
                  ? 'Start writing and save your work to see it here!' 
                  : 'Try adjusting your search terms or filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  {/* Document Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate mb-1">{doc.title}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTextTypeColor(doc.textType)}`}>
                        {doc.textType}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Document Stats */}
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <div className="flex items-center space-x-2">
                      <Type className="w-3 h-3" />
                      <span>{doc.wordCount} words</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(doc.dateCreated).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Document Preview */}
                  <div className="text-xs text-gray-500 mb-4 line-clamp-3 bg-gray-50 p-2 rounded">
                    {doc.content.substring(0, 120)}...
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        onLoadDocument(doc);
                        onClose();
                      }}
                      className="flex-1 bg-blue-500 text-white py-2 px-3 rounded text-sm hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Open</span>
                    </button>
                    <button
                      onClick={() => handleExportDocument(doc)}
                      className="bg-gray-500 text-white py-2 px-3 rounded text-sm hover:bg-gray-600 transition-colors"
                      title="Export as text file"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredDocuments.length} of {documents.length} documents</span>
            <div className="flex items-center space-x-4">
              <span>Total words written: {documents.reduce((sum, doc) => sum + doc.wordCount, 0)}</span>
              <span>•</span>
              <span>Documents saved: {documents.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
