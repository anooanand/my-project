import React, { useState, useEffect } from 'react';
import { Lightbulb, Type, Save, Settings, Sparkles, ChevronDown, ChevronUp, Users, Target, Star, CheckCircle } from 'lucide-react';
import { InteractiveTextEditor } from './InteractiveTextEditor'; // Updated import
import { getNSWSelectiveFeedback } from '../lib/openai';

interface NarrativeWritingTemplateRedesignedProps {
  content: string;
  onChange: (content: string) => void;
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
}

interface TemplateData {
  setting: string;
  characters: string;
  plot: string;
  theme: string;
}

export function NarrativeWritingTemplateRedesigned({ 
  content, 
  onChange, 
  prompt,
  onPromptChange 
}: NarrativeWritingTemplateRedesignedProps) {
  const [templateData, setTemplateData] = useState<TemplateData>({
    setting: '',
    characters: '',
    plot: '',
    theme: ''
  });
  
  const [showPlanning, setShowPlanning] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Calculate word and character count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharacterCount(content.length);
  }, [content]);

  const writingSteps = [
    { id: 1, title: "Setting", icon: Settings, description: "Where and when your story unfolds", field: 'setting' as keyof TemplateData },
    { id: 2, title: "Characters", icon: Users, description: "The people who bring your story to life", field: 'characters' as keyof TemplateData },
    { id: 3, title: "Plot", icon: Target, description: "The sequence of events in your story", field: 'plot' as keyof TemplateData },
    { id: 4, title: "Theme", icon: Star, description: "The deeper meaning or message", field: 'theme' as keyof TemplateData }
  ];

  const updateCompletedSteps = (data: TemplateData) => {
    const completed: number[] = [];
    if (data.setting.trim()) completed.push(1);
    if (data.characters.trim()) completed.push(2);
    if (data.plot.trim()) completed.push(3);
    if (data.theme.trim()) completed.push(4);
    setCompletedSteps(completed);
  };

  const handleTemplateChange = (field: keyof TemplateData, value: string) => {
    const newData = {
      ...templateData,
      [field]: value
    };
    setTemplateData(newData);
    updateCompletedSteps(newData);
  };

  const getProgressPercentage = () => {
    return Math.round((completedSteps.length / writingSteps.length) * 100);
  };

  const togglePlanning = () => {
    setShowPlanning(!showPlanning);
  };

  // AI Feedback function for the enhanced editor
  const handleGetFeedback = async (content: string) => {
    try {
      return await getNSWSelectiveFeedback(content, 'narrative', 'detailed', []);
    } catch (error) {
      console.error('Error getting NSW Selective feedback:', error);
      return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* FIXED: Show prompt if available */}
      {prompt && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Writing Prompt</h3>
                <p className="text-blue-800 leading-relaxed">{prompt}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* REMOVED: Duplicate planning toggle from toolbar - it's handled by parent layout */}
        
        {/* Planning Section - Only show if toggled */}
        {showPlanning && (
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Story Planning</h3>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600">
                    Progress: {getProgressPercentage()}%
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {writingSteps.map((step) => (
                  <div key={step.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <step.icon className="w-5 h-5 text-gray-400" />
                      )}
                      <label className="font-medium text-gray-700">{step.title}</label>
                    </div>
                    <textarea
                      value={templateData[step.field]}
                      onChange={(e) => handleTemplateChange(step.field, e.target.value)}
                      placeholder={step.description}
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Writing Area - Enhanced with AI Grammar Checking and Interactive Highlighting */}
        <div className="flex-1 p-6 bg-white">
          <div className="max-w-4xl mx-auto h-full">
            <InteractiveTextEditor
              content={content}
              onChange={onChange}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life... ✨"
              className="w-full h-full"
              textType="narrative"
              onGetFeedback={handleGetFeedback}
              // Removed style prop as it's handled internally by InteractiveTextEditor
            />
          </div>
        </div>

        {/* Writing Tips (Bottom) */}
        {wordCount < 50 && (
          <div className="bg-blue-50 border-t border-blue-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center space-x-2 text-blue-700">
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">Writing Tip:</span>
              </div>
              <p className="text-blue-600 text-sm mt-1">
                Start with a strong opening that grabs your reader's attention. Don't worry about making it perfect - you can always revise it later!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
