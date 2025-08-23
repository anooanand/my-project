import React, { useState, useEffect } from 'react';
import { X, Award, Target, TrendingUp, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { EnhancedNSWFeedback } from './EnhancedNSWFeedback';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  textType: string;
}

export function EvaluationModal({ isOpen, onClose, content, textType }: EvaluationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">NSW Selective Writing Assessment Report</h2>
            <p className="text-blue-100 text-sm">Comprehensive evaluation based on official NSW criteria</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <EnhancedNSWFeedback essay={content} textType={textType} />
        </div>
      </div>
    </div>
  );
}
