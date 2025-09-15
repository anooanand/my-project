```typescript
import {
  MessageCircle,
  Send,
  Loader2,
  Brain,
  BookOpen,
  Target,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  makeOpenAICall,
  generateChatResponse,
  getSynonyms,
  rephraseSentence,
  evaluateEssay,
  getWritingStructure,
  identifyCommonMistakes,
  getTextTypeVocabulary,
  getNSWSelectiveFeedback,
} from "./lib/openai";
import { useAuth } from "./contexts/AuthContext";
import { useLearning } from "./contexts/LearningContext";
import { useAutoSave } from "./components/AutoSave";
import { useDebounce } from "./hooks/useDebounce";
import { useAssistant } from "./hooks/useAssistant";
import {
  FeedbackCategory,
  DetailedFeedback,
  GrammarCorrection,
  VocabularyEnhancement,
} from "./types/feedback";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { ScrollArea } from "./components/ui/scroll-area";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Switch } from "./components/ui/switch";
import { Label } from "./components/ui/label";
import { Progress } from "./components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ContextSummary {
  wordCount: number;
  currentStage: string;
  writingType: string;
  lastFeedback?: string;
}

interface EnhancedCoachPanelProps {
  currentContent: string;
  textType: string;
  onContentChange: (content: string) => void;
  onFeedbackGenerated: (feedback: DetailedFeedback) => void;
  onClearFeedback: () => void;
  feedback: DetailedFeedback | null;
  isGeneratingFeedback: boolean;
  prompt: string;
}

const MAX_MESSAGES_IN_HISTORY = 5;

class ContextManager {
  static createSummary(messages: ConversationMessage[], currentContent: string, textType: string): ContextSummary {
    const wordCount = currentContent.split(/\s+/).filter(Boolean).length;
    let currentStage = "initial";
    let lastFeedback = undefined;

    // Determine writing stage based on content length and past interactions
    if (wordCount > 0 && wordCount < 100) {
      currentStage = "drafting";
    } else if (wordCount >= 100 && wordCount < 300) {
      currentStage = "developing";
    } else if (wordCount >= 300) {
      currentStage = "refining";
    }

    // Extract last assistant feedback
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        lastFeedback = messages[i].content;
        break;
      }
    }

    return {
      wordCount,
      currentStage,
      writingType: textType,
      lastFeedback,
    };
  }
}

const EnhancedCoachPanel: React.FC<EnhancedCoachPanelProps> = ({
  currentContent,
  textType,
  onContentChange,
  onFeedbackGenerated,
  onClearFeedback,
  feedback,
  isGeneratingFeedback,
  prompt,
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [showVocabEnhancer, setShowVocabEnhancer] = useState(false);
  const [showSynonymModal, setShowSynonymModal] = useState(false);
  const [synonymWord, setSynonymWord] = useState("");
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [showRephraseModal, setShowRephraseModal] = useState(false);
  const [rephraseSentenceText, setRephraseSentenceText] = useState("");
  const [rephrasedSentence, setRephrasedSentence] = useState("");
  const [activeTab, setActiveTab] = useState("coach");
  const [nswAssistanceLevel, setNswAssistanceLevel] = useState("standard");
  const [autoFeedbackEnabled, setAutoFeedbackEnabled] = useState(true);
  const [autoFeedbackInterval, setAutoFeedbackInterval] = useState(10000); // 10 seconds
  const [lastAutoFeedbackTime, setLastAutoFeedbackTime] = useState(0);
  const [autoFeedbackProgress, setAutoFeedbackProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { learningPlan, updateLearningPlan } = useLearning();
  const { saveContent } = useAutoSave();
  const debouncedContent = useDebounce(currentContent, 2000); // Debounce content for auto-feedback

  const { getAssistantResponse } = useAssistant();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial welcome message from AI Writing Buddy
    if (messages.length === 0) {
      addMessage(
        "assistant",
        "Hi! I'm your AI Writing Buddy! 📝 I'm here to help you write amazing stories. Ask me anything about writing, or just start typing and I'll give you feedback!"
      );
    }
  }, []);

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage: ConversationMessage = {
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newMessage];
      // Keep only the last MAX_MESSAGES_IN_HISTORY messages to prevent excessive context
      return updatedMessages.slice(-MAX_MESSAGES_IN_HISTORY);
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = inputMessage;
    addMessage("user", userMsg);
    setInputMessage("");
    setIsLoading(true);

    try {
      const contextSummary = ContextManager.createSummary(messages, currentContent, textType);
      const response = await generateChatResponse({
        userMessage: userMsg,
        textType: textType,
        currentContent: currentContent,
        wordCount: contextSummary.wordCount,
        context: JSON.stringify({
          writingStage: contextSummary.currentStage,
          wordCount: contextSummary.wordCount,
          conversationHistory: messages,
          textType: textType,
        }),
      });
      addMessage("assistant", response);
    } catch (error) {
      console.error("Error generating chat response:", error);
      addMessage(
        "assistant",
        "Oops! Something went wrong while trying to get a response. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    // Automatically send the message after setting it
    setTimeout(() => handleSendMessage(), 0);
  };

  const handleGenerateFeedback = useCallback(async () => {
    if (!currentContent.trim()) {
      addMessage("assistant", "Please write some content first before I can give feedback!");
      return;
    }
    onClearFeedback();
    setIsLoading(true);
    try {
      const newFeedback = await getNSWSelectiveFeedback(
        currentContent,
        textType,
        nswAssistanceLevel
      );
      onFeedbackGenerated(newFeedback);
      addMessage("assistant", "I've generated detailed feedback for your writing! Check the 'Analysis' tab. Let me know if you have any questions about it. 😊");
    } catch (error) {
      console.error("Error generating NSW selective feedback:", error);
      addMessage("assistant", "I couldn't generate detailed feedback right now. Please try again later or check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  }, [currentContent, textType, nswAssistanceLevel, onFeedbackGenerated, onClearFeedback]);

  // Auto-feedback logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoFeedbackEnabled && debouncedContent.length > 50) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now - lastAutoFeedbackTime > autoFeedbackInterval) {
          handleGenerateFeedback();
          setLastAutoFeedbackTime(now);
          setAutoFeedbackProgress(0);
        } else {
          setAutoFeedbackProgress(
            ((now - lastAutoFeedbackTime) / autoFeedbackInterval) * 100
          );
        }
      }, 1000); // Check every second
    } else {
      setAutoFeedbackProgress(0);
    }

    return () => clearInterval(interval);
  }, [autoFeedbackEnabled, debouncedContent, autoFeedbackInterval, lastAutoFeedbackTime, handleGenerateFeedback]);

  const handleSynonymSearch = async () => {
    if (!synonymWord.trim()) return;
    setIsLoading(true);
    try {
      const result = await getSynonyms(synonymWord);
      setSynonyms(result);
    } catch (error) {
      console.error("Error fetching synonyms:", error);
      setSynonyms(["Could not fetch synonyms."]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRephraseSentence = async () => {
    if (!rephraseSentenceText.trim()) return;
    setIsLoading(true);
    try {
      const result = await rephraseSentence(rephraseSentenceText);
      setRephrasedSentence(result);
    } catch (error) {
      console.error("Error rephrasing sentence:", error);
      setRephrasedSentence("Could not rephrase sentence.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderFeedbackCategory = (category: FeedbackCategory) => (
    <AccordionItem key={category.title} value={category.title}>
      <AccordionTrigger className="text-left">{category.title}</AccordionTrigger>
      <AccordionContent>
        <p className="mb-2">{category.summary}</p>
        {category.suggestions.length > 0 && (
          <ul className="list-disc list-inside space-y-1">
            {category.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
      </AccordionContent>
    </AccordionItem>
  );

  const renderGrammarCorrection = (correction: GrammarCorrection) => (
    <Alert key={correction.id} className="mb-2">
      <AlertTitle>Correction: {correction.type}</AlertTitle>
      <AlertDescription>
        <p>Original: <span className="line-through">{correction.original}</span></p>
        <p>Suggestion: <span className="font-semibold">{correction.suggestion}</span></p>
        {correction.explanation && <p className="text-sm text-gray-500">{correction.explanation}</p>}
      </AlertDescription>
    </Alert>
  );

  const renderVocabularyEnhancement = (enhancement: VocabularyEnhancement) => (
    <Alert key={enhancement.id} className="mb-2">
      <AlertTitle>Enhancement: {enhancement.originalWord}</AlertTitle>
      <AlertDescription>
        <p>Original: <span className="line-through">{enhancement.originalWord}</span></p>
        <p>Suggestion: <span className="font-semibold">{enhancement.suggestedWord}</span></p>
        {enhancement.context && <p className="text-sm text-gray-500">Context: {enhancement.context}</p>}
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="coach">Coach</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="vocab">Vocab</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>
        <TabsContent value="coach" className="flex-grow flex flex-col p-4">
          <ScrollArea className="flex-grow pr-4 mb-4">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-lg p-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="auto-feedback">Automatic Feedback</Label>
              <Switch
                id="auto-feedback"
                checked={autoFeedbackEnabled}
                onCheckedChange={setAutoFeedbackEnabled}
              />
            </div>
            {autoFeedbackEnabled && debouncedContent.length > 50 && (
              <Progress value={autoFeedbackProgress} className="w-full mb-2" />
            )}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                type="text"
                placeholder="Ask me about writing..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Quick questions to get started:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleQuickQuestion("How can I improve my introduction?")}>
                  How can I improve my introduction?
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickQuestion("What's a good synonym for 'said'?")}>
                  What's a good synonym for 'said'?
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickQuestion("Help me with my conclusion")}>
                  Help me with my conclusion
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickQuestion("How do I make my characters more interesting?")}>
                  How do I make my characters more interesting?
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickQuestion("What makes a good story hook?")}>
                  What makes a good story hook?
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickQuestion("Can you give me some NSW selective writing tips?")}>
                  NSW selective writing tips
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="analysis" className="flex-grow flex flex-col p-4">
          <h3 className="text-xl font-bold mb-4">Writing Analysis</h3>
          <Select value={nswAssistanceLevel} onValueChange={setNswAssistanceLevel}>
            <SelectTrigger className="w-full mb-4">
              <SelectValue placeholder="Select Assistance Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimal">Minimal Assistance</SelectItem>
              <SelectItem value="standard">Standard Assistance</SelectItem>
              <SelectItem value="detailed">Detailed Assistance</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateFeedback} disabled={isLoading || isGeneratingFeedback} className="mb-4">
            {isGeneratingFeedback ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Feedback...</>
            ) : (
              "Generate Detailed Feedback"
            )}
          </Button>
          <ScrollArea className="flex-grow pr-4">
            {feedback ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Score: {feedback.overallScore}/100</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Based on NSW Selective Writing Criteria</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Ideas & Content: <Badge variant="secondary">{feedback.criteriaScores.ideasAndContent}</Badge></div>
                      <div>Structure & Org: <Badge variant="secondary">{feedback.criteriaScores.textStructureAndOrganization}</Badge></div>
                      <div>Language & Vocab: <Badge variant="secondary">{feedback.criteriaScores.languageFeaturesAndVocabulary}</Badge></div>
                      <div>Spelling, Punc & Grammar: <Badge variant="secondary">{feedback.criteriaScores.spellingPunctuationAndGrammar}</Badge></div>
                    </div>
                  </CardContent>
                </Card>

                {feedback.feedbackCategories.length > 0 && (
                  <Accordion type="multiple" className="w-full">
                    {feedback.feedbackCategories.map(renderFeedbackCategory)}
                  </Accordion>
                )}

                {feedback.grammarCorrections.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Grammar Corrections:</h4>
                    {feedback.grammarCorrections.map(renderGrammarCorrection)}
                  </div>
                )}

                {feedback.vocabularyEnhancements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Vocabulary Enhancements:</h4>
                    {feedback.vocabularyEnhancements.map(renderVocabularyEnhancement)}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">No feedback generated yet. Click 'Generate Detailed Feedback' to get started!</p>
            )}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="vocab" className="flex-grow flex flex-col p-4">
          <h3 className="text-xl font-bold mb-4">Vocabulary Tools</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="synonym-search">Synonym Finder</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="synonym-search"
                  type="text"
                  placeholder="Enter a word (e.g., 'said')"
                  value={synonymWord}
                  onChange={(e) => setSynonymWord(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSynonymSearch();
                    }
                  }}
                />
                <Button onClick={handleSynonymSearch} disabled={isLoading}>
                  Find
                </Button>
              </div>
              {synonyms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {synonyms.map((s, i) => (
                    <Badge key={i} variant="secondary">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="rephrase-sentence">Sentence Rephraser</Label>
              <div className="flex space-x-2 mt-1">
                <Textarea
                  id="rephrase-sentence"
                  placeholder="Enter a sentence to rephrase..."
                  value={rephraseSentenceText}
                  onChange={(e) => setRephraseSentenceText(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleRephraseSentence} disabled={isLoading}>
                  Rephrase
                </Button>
              </div>
              {rephrasedSentence && (
                <Alert className="mt-2">
                  <AlertTitle>Rephrased Sentence:</AlertTitle>
                  <AlertDescription>{rephrasedSentence}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="progress" className="flex-grow flex flex-col p-4">
          <h3 className="text-xl font-bold mb-4">Progress Tracking</h3>
          <p className="text-gray-600 dark:text-gray-400">Coming soon: Detailed progress analytics and personalized learning paths!</p>
          {/* Placeholder for progress tracking components */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedCoachPanel;
```
