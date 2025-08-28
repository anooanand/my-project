import React, { useState, useEffect } from 'react'
import { Button } from './components/\\ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/\\ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/\\ui/tabs'
import { Badge } from './components/\\ui/badge'
import { 
  MessageCircle, 
  BarChart3, 
  BookOpen, 
  TrendingUp, 
  Lightbulb,
  Send,
  Eye,
  Target,
  Play,
  CheckCircle,
  Zap,
  Brain,
  Star,
  Clock,
  FileText,
  X
} from 'lucide-react'
import './App.css'

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isAutomatic?: boolean;
  paragraphNumber?: number;
}

interface PlanningData {
  characters: string;
  setting: string;
  problem: string;
  events: string;
  solution: string;
  feelings: string;
}

type TextType = 'Narrative' | 'Persuasive' | 'Expository' | 'Descriptive' | 'Creative';
type ActiveTab = 'coach' | 'analysis' | 'vocabulary' | 'progress';

function App(): JSX.Element {
  const [content, setContent] = useState<string>('')
  const [textType, setTextType] = useState<TextType>('Narrative')
  const [activeTab, setActiveTab] = useState<ActiveTab>('coach')
  const [chatInput, setChatInput] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isAIConnected] = useState<boolean>(true)
  const [wordCount, setWordCount] = useState<number>(0)
  const [charCount, setCharCount] = useState<number>(0)
  const [readTime, setReadTime] = useState<number>(0)
  const [qualityScore] = useState<number>(75)
  const [showPlanningModal, setShowPlanningModal] = useState<boolean>(false)
  const [showStructureGuide, setShowStructureGuide] = useState<boolean>(false)
  const [planningStep, setPlanningStep] = useState<number>(1)
  const [planningData, setPlanningData] = useState<PlanningData>({
    characters: '',
    setting: '',
    problem: '',
    events: '',
    solution: '',
    feelings: ''
  })

  // Calculate stats
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    const chars = content.length
    const readingTime = Math.ceil(words / 200)
    
    setWordCount(words)
    setCharCount(chars)
    setReadTime(readingTime)
  }, [content])

  const handleSendMessage = (): void => {
    if (!chatInput.trim()) return
    
    const newMessage: ChatMessage = {
      id: Date.now(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, newMessage])
    setChatInput('')
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: Date.now() + 1,
        text: "Great question! For narrative writing, try to show your character's emotions through their actions and thoughts rather than just telling us how they feel. This makes your story more engaging!",
        sender: 'ai',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleSubmitForEvaluation = (): void => {
    alert('Your essay has been submitted for evaluation! You will receive detailed feedback shortly.')
  }

  const handleTextTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setTextType(e.target.value as TextType)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setContent(e.target.value)
  }

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setChatInput(e.target.value)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const handlePlanningNext = (): void => {
    if (planningStep < 6) {
      setPlanningStep(planningStep + 1)
    } else {
      setShowPlanningModal(false)
      setPlanningStep(1)
    }
  }

  const handlePlanningPrev = (): void => {
    if (planningStep > 1) {
      setPlanningStep(planningStep - 1)
    }
  }

  const updatePlanningData = (field: keyof PlanningData, value: string): void => {
    setPlanningData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getPlanningStepContent = () => {
    switch (planningStep) {
      case 1:
        return {
          emoji: '👥',
          title: 'Who are your characters?',
          description: 'Tell us about the main character in your story. What do they look like? What are they like?',
          placeholder: 'Example: Sarah is a brave 12-year-old girl with curly red hair...',
          field: 'characters' as keyof PlanningData
        }
      case 2:
        return {
          emoji: '🏞️',
          title: 'Where does your story happen?',
          description: 'Describe the place where your story takes place. Is it a school, forest, city, or somewhere magical?',
          placeholder: 'Example: A mysterious old library with tall bookshelves and dusty books...',
          field: 'setting' as keyof PlanningData
        }
      case 3:
        return {
          emoji: '⚡',
          title: "What's the problem?",
          description: 'Every good story has a problem or challenge. What goes wrong? What needs to be solved?',
          placeholder: 'Example: Sarah discovers that all the books in the library are disappearing one by one...',
          field: 'problem' as keyof PlanningData
        }
      case 4:
        return {
          emoji: '🎬',
          title: 'What happens in your story?',
          description: 'List the main events. What does your character do to try to solve the problem?',
          placeholder: 'Example: Sarah searches the library, finds clues, meets a magical librarian...',
          field: 'events' as keyof PlanningData
        }
      case 5:
        return {
          emoji: '✅',
          title: 'How is the problem solved?',
          description: 'How does your story end? How is the problem fixed? What happens to your characters?',
          placeholder: 'Example: Sarah learns a magic spell that brings all the books back to the library...',
          field: 'solution' as keyof PlanningData
        }
      case 6:
        return {
          emoji: '😊',
          title: 'How do the characters feel?',
          description: 'Describe the emotions in your story. How do characters feel at different parts?',
          placeholder: 'Example: Sarah feels scared at first, then excited when she discovers the magic...',
          field: 'feelings' as keyof PlanningData
        }
      default:
        return {
          emoji: '👥',
          title: 'Who are your characters?',
          description: 'Tell us about the main character in your story.',
          placeholder: 'Example: Sarah is a brave 12-year-old girl...',
          field: 'characters' as keyof PlanningData
        }
    }
  }

  const currentStepContent = getPlanningStepContent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select 
                value={textType}
                onChange={handleTextTypeChange}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="Narrative">Narrative</option>
                <option value="Persuasive">Persuasive</option>
                <option value="Expository">Expository</option>
                <option value="Descriptive">Descriptive</option>
                <option value="Creative">Creative</option>
              </select>
              <Button variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isAIConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  AI {isAIConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Writing Prompt */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Your Writing Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Write an engaging story about a character who discovers something unexpected that changes their life forever. 
              Include vivid descriptions, realistic dialogue, and show the character's emotional journey.
            </p>
          </CardContent>
        </Card>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPlanningModal(true)}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Target className="w-4 h-4 mr-2" />
            Planning Phase
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Exam Mode
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowStructureGuide(true)}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
          >
            <FileText className="w-4 h-4 mr-2" />
            Structure Guide
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Tips
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
          >
            <Eye className="w-4 h-4 mr-2" />
            Focus
          </Button>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-300px)]">
          {/* Writing Area - Takes 3/5 of the space */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardContent className="flex-1 p-0">
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
                  className="w-full h-full p-6 border-none resize-none focus:outline-none focus:ring-0 text-base leading-relaxed font-['Inter'] bg-transparent dark:text-white"
                  style={{ minHeight: '500px' }}
                />
              </CardContent>
              
              {/* Writing Stats */}
              <div className="border-t p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-6">
                    <span className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{wordCount} words</span>
                    </span>
                    <span>{charCount} characters</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{readTime} min read</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={isAIConnected ? "default" : "secondary"}>
                      AI {isAIConnected ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button 
                      onClick={handleSubmitForEvaluation}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit for Evaluation Report
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Writing Buddy - Takes 2/5 of the space */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-purple-600" />
                    AI Writing Buddy
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quality: {qualityScore}%</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as ActiveTab)} className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 mx-4">
                    <TabsTrigger value="coach" className="text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Coach
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="text-xs">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Analysis
                    </TabsTrigger>
                    <TabsTrigger value="vocabulary" className="text-xs">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Vocabulary
                    </TabsTrigger>
                    <TabsTrigger value="progress" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Progress
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 p-4">
                    <TabsContent value="coach" className="h-full flex flex-col mt-0">
                      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                        <p className="text-purple-700 dark:text-purple-300 text-sm font-medium flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          I'll automatically give you AI feedback as you complete paragraphs!
                        </p>
                      </div>

                      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
                        {chatMessages.map(message => (
                          <div key={message.id} className={`p-3 rounded-lg text-sm ${
                            message.sender === 'user' 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ml-4' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 mr-4'
                          }`}>
                            {message.text}
                          </div>
                        ))}
                        
                        {chatMessages.length === 0 && (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Ask me anything about your writing!</p>
                            <p className="text-xs mt-1">I'll help you improve your story.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={handleChatInputChange}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask for writing help..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="analysis" className="h-full mt-0">
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Writing Analysis</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Readability:</span>
                              <span className="font-medium">Good</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sentence Variety:</span>
                              <span className="font-medium">Excellent</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Paragraph Structure:</span>
                              <span className="font-medium">Needs Work</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                          <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Strengths</h4>
                          <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
                            <li>• Creative use of descriptive language</li>
                            <li>• Strong character development</li>
                            <li>• Engaging opening paragraph</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                          <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Areas to Improve</h4>
                          <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
                            <li>• Add more dialogue between characters</li>
                            <li>• Vary sentence beginnings</li>
                            <li>• Include more sensory details</li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="vocabulary" className="h-full mt-0">
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                          <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Vocabulary Level</h4>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                            </div>
                            <span className="text-sm font-medium">70%</span>
                          </div>
                          <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                            Good use of varied vocabulary! Try incorporating more advanced words.
                          </p>
                        </div>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Suggested Words</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Instead of "big":</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge variant="secondary">enormous</Badge>
                                <Badge variant="secondary">massive</Badge>
                                <Badge variant="secondary">gigantic</Badge>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Instead of "said":</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge variant="secondary">whispered</Badge>
                                <Badge variant="secondary">exclaimed</Badge>
                                <Badge variant="secondary">declared</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="progress" className="h-full mt-0">
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                          <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Writing Progress</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Word Goal</span>
                                <span>{wordCount}/500</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min((wordCount / 500) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Quality Score</span>
                                <span>{qualityScore}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${qualityScore}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Recent Achievements</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>First paragraph completed!</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>Used descriptive language</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Zap className="w-4 h-4 text-purple-500" />
                              <span>Creative story opening</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Planning Modal */}
      {showPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Story Planning</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPlanningModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Step {planningStep} of 6</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5, 6].map(step => (
                      <div 
                        key={step}
                        className={`w-2 h-2 rounded-full ${
                          step <= planningStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">{currentStepContent.emoji}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {currentStepContent.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentStepContent.description}
                  </p>
                </div>
                
                <textarea
                  value={planningData[currentStepContent.field]}
                  onChange={(e) => updatePlanningData(currentStepContent.field, e.target.value)}
                  placeholder={currentStepContent.placeholder}
                  className="w-full h-32 p-4 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={handlePlanningPrev}
                  disabled={planningStep === 1}
                >
                  Previous
                </Button>
                <Button 
                  onClick={handlePlanningNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {planningStep === 6 ? 'Finish Planning' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Structure Guide Modal */}
      {showStructureGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Narrative Structure Guide</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowStructureGuide(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">1. Opening (Hook)</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Start with an exciting moment, interesting dialogue, or intriguing question to grab your reader's attention.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">2. Setting & Characters</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Introduce your main character and describe where and when your story takes place.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">3. Problem/Conflict</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Present the main challenge or problem that your character needs to solve.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">4. Rising Action</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Show the events that happen as your character tries to solve the problem. Build excitement!
                  </p>
                </div>
                
                <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">5. Climax</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    The most exciting part! This is where the main problem reaches its peak.
                  </p>
                </div>
                
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">6. Resolution</h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    Show how the problem is solved and what happens to your characters at the end.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
