import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { generatePrompt } from '../lib/openai';

interface WritingType {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  popular?: boolean;
}

const writingTypes: WritingType[] = [
  { id: 'narrative', name: 'Narrative', description: 'Create exciting tales with heroes and twists!', difficulty: 'Medium', popular: true },
  { id: 'persuasive', name: 'Persuasive', description: 'Share your strong ideas and get others to agree!', difficulty: 'Hard' },
  { id: 'expository', name: 'Expository / Informative', description: 'Teach others about cool topics with clear facts!', difficulty: 'Medium', popular: true },
  { id: 'reflective', name: 'Reflective', description: 'Explore your own experiences and what you learned!', difficulty: 'Easy' },
  { id: 'descriptive', name: 'Descriptive', description: 'Use amazing words to describe people, places, and things!', difficulty: 'Easy', popular: true },
  { id: 'recount', name: 'Recount', description: 'Tell about events in the order they happened!', difficulty: 'Easy' }
];

export function Dashboard() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [showWritingTypes, setShowWritingTypes] = useState(false);
  const [showPromptOptions, setShowPromptOptions] = useState(false);
  const [selectedWritingType, setSelectedWritingType] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('All Levels');

  // FIXED: Proper async prompt generation with error handling
  const handleGeneratePrompt = async (textType: string) => {
    console.log('🎯 Dashboard: Generating prompt for:', textType);
    setIsGeneratingPrompt(true);
    
    try {
      // Call the OpenAI prompt generation function
      const prompt = await generatePrompt(textType);
      
      if (prompt) {
        console.log('✅ Prompt generated successfully:', prompt);
        
        // CRITICAL: Save to localStorage so WritingArea can access it
        localStorage.setItem(`${textType}_prompt`, prompt);
        localStorage.setItem('generatedPrompt', prompt);
        localStorage.setItem('selectedWritingType', textType);
        
        console.log('✅ Prompt saved to localStorage');
        
        // Small delay to ensure localStorage is written
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Navigate to writing area AFTER prompt is generated
        navigate('/writing');
        
      } else {
        throw new Error('No prompt generated');
      }
      
    } catch (error) {
      console.error('❌ Error generating prompt:', error);
      
      // FALLBACK: Use high-quality static prompts if AI generation fails
      const fallbackPrompts = {
        narrative: "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion.",
        persuasive: "Choose a topic you feel strongly about and write a persuasive essay to convince others of your viewpoint. Use strong evidence, logical reasoning, and persuasive techniques like rhetorical questions and emotional appeals. Structure your argument clearly with an introduction, body paragraphs, and conclusion.",
        expository: "Select a topic you know well and write an informative essay that teaches others about it. Use clear explanations, relevant examples, and organize your information in a logical sequence. Include an engaging introduction and a strong conclusion that summarizes your main points.",
        reflective: "Think about a meaningful experience in your life and write a reflective piece exploring what you learned from it. Show your thoughts and feelings, and explain how this experience changed or influenced you. Be honest and thoughtful in your reflection.",
        descriptive: "Choose a place, person, or object that is special to you and write a descriptive piece that brings it to life for your reader. Use sensory details (sight, sound, smell, touch, taste) and figurative language to create vivid imagery.",
        recount: "Write about an important event or experience in your life, telling what happened in the order it occurred. Include details about who was involved, where it happened, when it took place, and why it was significant to you."
      };
      
      const fallbackPrompt = fallbackPrompts[textType as keyof typeof fallbackPrompts] || fallbackPrompts.narrative;
      
      console.log('🔄 Using fallback prompt:', fallbackPrompt);
      
      // Save fallback prompt
      localStorage.setItem(`${textType}_prompt`, fallbackPrompt);
      localStorage.setItem('generatedPrompt', fallbackPrompt);
      localStorage.setItem('selectedWritingType', textType);
      
      // Navigate to writing area with fallback prompt
      await new Promise(resolve => setTimeout(resolve, 200));
      navigate('/writing');
      
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleWritingTypeSelect = (type: string) => {
    console.log('📝 Dashboard: Writing type selected:', type);
    setSelectedWritingType(type);
    setShowWritingTypes(false);
    setShowPromptOptions(true);
  };

  const handleMagicPromptClick = () => {
    console.log('🎯 PromptOptionsModal: Generate prompt clicked for:', selectedWritingType);
    setShowPromptOptions(false);
    handleGeneratePrompt(selectedWritingType);
  };

  const handleCustomPromptClick = () => {
    // For custom prompts, navigate directly to writing area
    localStorage.setItem('selectedWritingType', selectedWritingType);
    localStorage.removeItem(`${selectedWritingType}_prompt`);
    localStorage.removeItem('generatedPrompt');
    navigate('/writing');
  };

  const filteredWritingTypes = writingTypes.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         type.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'All Levels' || type.difficulty === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">InstaChat AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Hi there, {state.user?.email?.split('@')[0] || 'Writer'}!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Hi there, {state.user?.email?.split('@')[0] || 'Writer'}! 🌟</h2>
          <p className="text-lg text-gray-600">Let's write something awesome today!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">🔥</span>
              </div>
              <span className="text-2xl">⭐⭐⭐</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Writing Streak</h3>
            <p className="text-2xl font-bold text-orange-600 mb-1">3 days</p>
            <p className="text-sm text-gray-600">Keep it up! 🔥</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📚</span>
              </div>
              <span className="text-2xl">🎁</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Stories Created</h3>
            <p className="text-2xl font-bold text-blue-600 mb-1">5</p>
            <p className="text-sm text-gray-600">Amazing work! 📚</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✨</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 ml-3">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Words Written</h3>
            <p className="text-2xl font-bold text-green-600 mb-1">1,250</p>
            <p className="text-sm text-gray-600">You're on fire! ✨</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">🎉</span>
              </div>
              <span className="text-2xl">⚡⚡⚡</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Fun Level</h3>
            <p className="text-2xl font-bold text-purple-600 mb-1">Super!</p>
            <p className="text-sm text-gray-600">Keep having fun! 🎉</p>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h3 className="text-2xl font-bold mb-2">✨ What would you like to do?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📝</span>
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Write Story!</h4>
                  <p className="text-sm opacity-90">Create amazing stories with help from your AI friend</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <span>✨</span>
                  <span>AI Helper</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>📝</span>
                  <span>Stories</span>
                </span>
              </div>
            </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Practice Fun!</h4>
                  <p className="text-sm opacity-90">Take fun practice tests and improve your skills</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <span>🎯</span>
                  <span>Practice</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>🏆</span>
                  <span>Skills</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* My Writing Adventures */}
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6">📚 My Writing Adventures</h3>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6">
              <span className="text-3xl">✨</span>
            </div>
            
            <h4 className="text-xl font-semibold mb-4">Ready for your first adventure?</h4>
            <p className="text-lg opacity-90 mb-8">Start writing your first story and it will appear here! You can see all your amazing work and track your progress.</p>
            
            <button
              onClick={() => setShowWritingTypes(true)}
              className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 mx-auto"
            >
              <span>🚀</span>
              <span>Start My First Story!</span>
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-lg opacity-90">
              <strong>You're doing great!</strong>
            </p>
            <p className="opacity-75 mt-2">
              Every great writer started with their first word. Keep practicing, stay curious, and remember - every story you write makes you a better writer! 🌟
            </p>
          </div>
        </div>
      </div>

      {/* Writing Type Selection Modal */}
      {showWritingTypes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📝</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Choose Your Story Type! ✨</h3>
                    <p className="text-gray-600">What kind of writing adventure do you want to go on today?</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWritingTypes(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-gray-500">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search writing types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>All Levels</option>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
                <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium">
                  Popular
                </button>
              </div>

              {/* Writing Types Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWritingTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleWritingTypeSelect(type.id)}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {type.popular && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                            ⭐ Popular
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          type.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          type.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {type.difficulty}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {type.name}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Options Modal */}
      {showPromptOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">✨</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Choose Your Prompt</h3>
                </div>
                <button
                  onClick={() => setShowPromptOptions(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-gray-500">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center">
                How would you like to get your <span className="text-blue-600 font-semibold">{selectedWritingType}</span> writing prompt?
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleMagicPromptClick}
                  disabled={isGeneratingPrompt}
                  className="w-full p-4 border-2 border-purple-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <span className="text-purple-600 text-xl">✨</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Magic Prompt Generator ✨</h4>
                      <p className="text-sm text-gray-600">
                        Let our AI create an awesome {selectedWritingType} prompt just for you! Perfect for getting started quickly.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleCustomPromptClick}
                  className="w-full p-4 border-2 border-orange-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <span className="text-orange-600 text-xl">🎨</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Use My Own Idea 🎨</h4>
                      <p className="text-sm text-gray-600">
                        Type in your own {selectedWritingType} writing prompt or topic. Great for when you have a specific idea!
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 text-lg">⭐</span>
                  <p className="text-sm text-yellow-800">
                    A good prompt will help you write an amazing {selectedWritingType} story! Choose the option that sounds most exciting to you. 
                    Remember: there's no wrong choice - both will lead to great writing adventures!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {isGeneratingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Your Prompt...</h3>
            <p className="text-gray-600 text-sm">Our AI is crafting the perfect writing prompt just for you! ✨</p>
          </div>
        </div>
      )}
    </div>
  );
}
