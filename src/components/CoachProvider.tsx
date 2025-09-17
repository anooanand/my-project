/**
 * Enhanced CoachProvider with improved feedback handling
 * 
 * INSTRUCTIONS:
 * 1. Open your existing src/components/CoachProvider.tsx
 * 2. Replace the useEffect for paragraph completion (around line 40-80) with the enhanced version below
 * 3. Add the getContextualFallbackTip function at the end of the component
 */

// ===== REPLACE THE EXISTING useEffect FOR PARAGRAPH COMPLETION WITH THIS =====
useEffect(() => {
  const handler = async (p: { 
    paragraph: string; 
    index: number; 
    wordCount?: number; 
    trigger?: string;
  }) => {
    try {
      if (!p.paragraph || typeof p.paragraph !== 'string' || p.paragraph.trim().length === 0) {
        return;
      }

      // More responsive feedback - trigger for shorter content too
      const wordCount = p.paragraph.trim().split(/\s+/).length;
      if (wordCount < 10) return;

      console.log("Coach received paragraph event:", p);

      setIsAITyping(true);

      // Add typing indicator with context-aware message
      const getTypingMessage = (trigger?: string) => {
        switch (trigger) {
          case 'dialogue_detected':
            return 'Writing Buddy noticed your dialogue...';
          case 'transition_detected':
            return 'Writing Buddy is analyzing your transitions...';
          case 'typing_pause':
            return 'Writing Buddy is reviewing your recent writing...';
          default:
            return 'Writing Buddy is analyzing your paragraph...';
        }
      };

      const typingMessage: ChatMessage = {
        id: 'typing-' + Date.now(),
        text: getTypingMessage(p.trigger),
        isUser: false,
        timestamp: new Date(),
        isTyping: true
      };
      setMessages(prev => [...prev, typingMessage]);

      try {
        const res = await coachTip(p.paragraph);
        
        // Remove typing indicator and add real response
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, {
            id: 'coach-' + Date.now(),
            text: res.tip || getContextualFallbackTip(p.paragraph, p.trigger),
            isUser: false,
            timestamp: new Date()
          }];
        });

        // Hide quick questions after first interaction
        setShowQuickQuestions(false);

      } catch (error) {
        console.error("Coach tip failed:", error);
        
        // Remove typing indicator and add fallback response
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping);
          return [...withoutTyping, {
            id: 'coach-' + Date.now(),
            text: getContextualFallbackTip(p.paragraph, p.trigger),
            isUser: false,
            timestamp: new Date()
          }];
        });
      }

    } catch (error) {
      console.error("Paragraph handler error:", error);
    } finally {
      setIsAITyping(false);
    }
  };
  
  eventBus.on("paragraph.ready", handler);
  return () => eventBus.off("paragraph.ready", handler);
}, []);

// ===== ADD THIS NEW FUNCTION BEFORE THE EXISTING getFallbackTip FUNCTION =====
const getContextualFallbackTip = (paragraph: string, trigger?: string): string => {
  const text = paragraph.toLowerCase();
  
  // Context-specific tips based on trigger
  if (trigger === 'dialogue_detected') {
    return "Great dialogue! 💬 Try using different dialogue tags like 'whispered', 'exclaimed', or 'declared' instead of 'said'. This makes your characters more expressive!";
  }
  
  if (trigger === 'transition_detected') {
    return "Nice use of transition words! ⭐ They help your story flow smoothly. Try adding more sensory details to make the scene come alive!";
  }
  
  if (trigger === 'typing_pause') {
    return "You're making great progress! ✨ Consider adding more descriptive details about what your characters see, hear, or feel to paint a vivid picture!";
  }
  
  // Existing fallback logic
  if (text.includes('said') && text.split('said').length > 2) {
    return "Great dialogue! Try using different words instead of 'said' - like whispered, exclaimed, or declared. This makes your characters more expressive! 💬";
  } else if (text.includes('"') || text.includes("'")) {
    return "I love that you're using dialogue! It brings your characters to life. Remember to start a new paragraph when a different character speaks. 🎭";
  } else if (text.includes('then') || text.includes('next') || text.includes('after')) {
    return "Nice use of transition words! They help your story flow smoothly from one event to the next. Keep building that narrative! ⭐";
  } else if (paragraph.split(/[.!?]+/).length >= 3) {
    return "Good paragraph structure! You're using multiple sentences to develop your ideas. Try adding more descriptive details to paint a vivid picture! 🎨";
  } else {
    return "Keep writing! You're doing great. Try adding more details about what your characters see, hear, or feel to make your story come alive! ✨";
  }
};
