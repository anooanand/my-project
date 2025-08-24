import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SpellingError {
  word: string;
  start: number;
  end: number;
  suggestions: string[];
}

interface SpellCheckTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onMouseUp?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  [key: string]: any; // Allow other props to pass through
}

// Simple spell checker class embedded in the component
class SimpleSpellChecker {
  private dictionary: Set<string>;
  private commonMisspellings: Map<string, string>;

  constructor() {
    // Common English words dictionary (expanded set)
    this.dictionary = new Set([
      'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
      'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
      'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
      'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
      'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just',
      'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on',
      'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
      'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
      'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to',
      'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
      'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours',
      'yourself', 'yourselves',
      // Story and writing words
      'story', 'character', 'characters', 'adventure', 'journey', 'magical', 'forest', 'castle',
      'princess', 'prince', 'dragon', 'treasure', 'friend', 'friends', 'family', 'home', 'school',
      'teacher', 'student', 'book', 'books', 'read', 'reading', 'write', 'writing', 'amazing',
      'wonderful', 'beautiful', 'exciting', 'scary', 'happy', 'sad', 'angry', 'surprised',
      'discovered', 'found', 'looked', 'walked', 'ran', 'jumped', 'climbed', 'flew', 'swam',
      'talked', 'said', 'asked', 'answered', 'thought', 'felt', 'knew', 'learned', 'taught',
      'helped', 'saved', 'protected', 'loved', 'cared', 'shared', 'gave', 'received', 'took',
      'brought', 'carried', 'held', 'opened', 'closed', 'started', 'finished', 'began', 'ended',
      'suddenly', 'quickly', 'slowly', 'carefully', 'quietly', 'loudly', 'gently', 'softly',
      'brightly', 'darkly', 'clearly', 'finally', 'eventually', 'immediately', 'always', 'never',
      'sometimes', 'often', 'usually', 'rarely', 'everywhere', 'somewhere', 'nowhere', 'anywhere',
      'everyone', 'someone', 'nobody', 'anybody', 'everything', 'something', 'nothing', 'anything',
      'first', 'second', 'third', 'last', 'next', 'previous', 'new', 'old', 'young', 'big', 'small',
      'large', 'little', 'long', 'short', 'tall', 'high', 'low', 'wide', 'narrow', 'thick', 'thin',
      'heavy', 'light', 'strong', 'weak', 'fast', 'slow', 'hot', 'cold', 'warm', 'cool', 'dry', 'wet',
      'clean', 'dirty', 'fresh', 'old', 'new', 'good', 'bad', 'best', 'worst', 'better', 'worse',
      'right', 'wrong', 'correct', 'incorrect', 'true', 'false', 'real', 'fake', 'original', 'copy',
      'inside', 'outside', 'upstairs', 'downstairs', 'nearby', 'far', 'close', 'distant', 'here', 'there',
      'today', 'tomorrow', 'yesterday', 'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year',
      'time', 'hour', 'minute', 'second', 'moment', 'while', 'during', 'before', 'after', 'since', 'until',
      'color', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray',
      'number', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'hundred', 'thousand', 'million', 'billion', 'first', 'second', 'third', 'fourth', 'fifth',
      'place', 'room', 'house', 'building', 'street', 'city', 'town', 'country', 'world', 'earth',
      'water', 'fire', 'air', 'ground', 'sky', 'sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'wind',
      'tree', 'flower', 'grass', 'leaf', 'branch', 'root', 'seed', 'fruit', 'vegetable', 'plant',
      'animal', 'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'chicken', 'mouse', 'lion',
      'tiger', 'elephant', 'bear', 'rabbit', 'deer', 'wolf', 'fox', 'snake', 'frog', 'butterfly', 'bee',
      'food', 'eat', 'drink', 'hungry', 'thirsty', 'breakfast', 'lunch', 'dinner', 'meal', 'bread', 'meat',
      'milk', 'cheese', 'egg', 'apple', 'orange', 'banana', 'cake', 'cookie', 'candy', 'chocolate',
      'body', 'head', 'face', 'eye', 'nose', 'mouth', 'ear', 'hair', 'hand', 'finger', 'arm', 'leg', 'foot',
      'heart', 'mind', 'brain', 'voice', 'smile', 'laugh', 'cry', 'sleep', 'dream', 'wake', 'rest',
      'work', 'job', 'play', 'game', 'sport', 'music', 'song', 'dance', 'art', 'picture', 'movie', 'show',
      'party', 'birthday', 'holiday', 'vacation', 'trip', 'visit', 'travel', 'drive', 'ride', 'walk', 'run',
      'money', 'buy', 'sell', 'pay', 'cost', 'price', 'cheap', 'expensive', 'free', 'gift', 'present',
      'clothes', 'shirt', 'pants', 'dress', 'shoes', 'hat', 'coat', 'jacket', 'wear', 'put', 'take',
      'make', 'build', 'create', 'design', 'draw', 'paint', 'cut', 'fix', 'break', 'clean', 'wash',
      'cook', 'bake', 'grow', 'plant', 'water', 'feed', 'care', 'help', 'teach', 'learn', 'study',
      'remember', 'forget', 'think', 'know', 'understand', 'believe', 'hope', 'wish', 'want', 'need',
      'like', 'love', 'hate', 'enjoy', 'prefer', 'choose', 'decide', 'try', 'attempt', 'succeed', 'fail',
      'win', 'lose', 'fight', 'argue', 'agree', 'disagree', 'talk', 'speak', 'tell', 'say', 'ask', 'answer',
      'call', 'shout', 'whisper', 'listen', 'hear', 'see', 'look', 'watch', 'find', 'search', 'lose',
      'keep', 'save', 'throw', 'catch', 'drop', 'pick', 'lift', 'push', 'pull', 'move', 'stop', 'start',
      'begin', 'end', 'finish', 'complete', 'continue', 'pause', 'wait', 'hurry', 'rush', 'slow', 'fast'
    ]);

    // Common misspellings and their corrections
    this.commonMisspellings = new Map([
      ['teh', 'the'],
      ['adn', 'and'],
      ['hte', 'the'],
      ['taht', 'that'],
      ['thier', 'their'],
      ['recieve', 'receive'],
      ['seperate', 'separate'],
      ['definately', 'definitely'],
      ['occured', 'occurred'],
      ['begining', 'beginning'],
      ['writting', 'writing'],
      ['freind', 'friend'],
      ['becuase', 'because'],
      ['wich', 'which'],
      ['woudl', 'would'],
      ['coudl', 'could'],
      ['shoudl', 'should'],
      ['alot', 'a lot'],
      ['cant', "can't"],
      ['wont', "won't"],
      ['dont', "don't"],
      ['isnt', "isn't"],
      ['wasnt', "wasn't"],
      ['werent', "weren't"],
      ['havent', "haven't"],
      ['hasnt', "hasn't"],
      ['hadnt', "hadn't"],
      ['wouldnt', "wouldn't"],
      ['couldnt', "couldn't"],
      ['shouldnt', "shouldn't"],
    ]);
  }

  isWordCorrect(word: string): boolean {
    if (!word || word.length === 0) return true;
    
    const cleanWord = word.toLowerCase().replace(/[^\w']/g, '');
    if (cleanWord.length === 0) return true;
    
    // Check if it's in our dictionary
    if (this.dictionary.has(cleanWord)) return true;
    
    // Check if it's a number
    if (/^\d+$/.test(cleanWord)) return true;
    
    // Check if it's a proper noun (starts with capital letter)
    if (word[0] === word[0].toUpperCase() && word.length > 1) {
      return true; // Assume proper nouns are correct
    }
    
    // Check if it's a contraction
    if (word.includes("'")) {
      // Handle common contractions
      const contractions = ["can't", "won't", "don't", "isn't", "wasn't", "weren't", "haven't", "hasn't", "hadn't", "wouldn't", "couldn't", "shouldn't", "you're", "we're", "they're", "i'm", "he's", "she's", "it's", "we've", "they've", "i've", "you've", "he'd", "she'd", "we'd", "they'd", "i'd", "you'd", "i'll", "you'll", "he'll", "she'll", "we'll", "they'll"];
      if (contractions.includes(cleanWord)) return true;
    }
    
    return false;
  }

  getSuggestions(word: string): string[] {
    const cleanWord = word.toLowerCase().replace(/[^\w']/g, '');
    
    // Check common misspellings first
    if (this.commonMisspellings.has(cleanWord)) {
      return [this.commonMisspellings.get(cleanWord)!];
    }
    
    const suggestions: string[] = [];
    
    // Simple suggestions based on dictionary words
    for (const dictWord of this.dictionary) {
      if (this.editDistance(cleanWord, dictWord) <= 2 && dictWord.length > 2) {
        suggestions.push(dictWord);
      }
      if (suggestions.length >= 5) break; // Limit suggestions
    }
    
    return suggestions;
  }

  private editDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  checkText(text: string): SpellingError[] {
    const errors: SpellingError[] = [];
    const wordRegex = /\b\w+(?:'\w+)?\b/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      if (!this.isWordCorrect(word)) {
        errors.push({
          word,
          start: match.index,
          end: match.index + word.length,
          suggestions: this.getSuggestions(word)
        });
      }
    }
    
    return errors;
  }
}

export const SpellCheckTextarea: React.FC<SpellCheckTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  style = {},
  disabled = false,
  onMouseUp,
  onKeyUp,
  ...otherProps
}) => {
  const [spellingErrors, setSpellingErrors] = useState<SpellingError[]>([]);
  const [selectedError, setSelectedError] = useState<SpellingError | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const spellChecker = useRef(new SimpleSpellChecker());
  const checkTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced spell checking
  const checkSpelling = useCallback((text: string) => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    checkTimeoutRef.current = setTimeout(() => {
      const errors = spellChecker.current.checkText(text);
      setSpellingErrors(errors);
    }, 500); // 500ms debounce
  }, []);

  // Check spelling when value changes
  useEffect(() => {
    if (value.trim()) {
      checkSpelling(value);
    } else {
      setSpellingErrors([]);
    }
  }, [value, checkSpelling]);

  // Sync scroll between textarea and overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setShowSuggestions(false);
  };

  // Handle click on highlighted error
  const handleErrorClick = (error: SpellingError, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedError(error);
    setShowSuggestions(true);
    
    // Position suggestions popup
    const rect = textareaRef.current?.getBoundingClientRect();
    if (rect) {
      setSuggestionPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top + 25
      });
    }
  };

  // Apply suggestion
  const applySuggestion = (suggestion: string) => {
    if (selectedError) {
      const newValue = value.substring(0, selectedError.start) + 
                      suggestion + 
                      value.substring(selectedError.end);
      onChange(newValue);
    }
    setShowSuggestions(false);
    setSelectedError(null);
  };

  // Ignore error (add to dictionary)
  const ignoreError = () => {
    if (selectedError) {
      spellChecker.current.dictionary.add(selectedError.word.toLowerCase());
      checkSpelling(value); // Recheck to remove the error
    }
    setShowSuggestions(false);
    setSelectedError(null);
  };

  // Create highlighted text with error overlays
  const createHighlightedText = () => {
    if (spellingErrors.length === 0) {
      return <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    spellingErrors.forEach((error, index) => {
      // Add text before error
      if (error.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`} style={{ whiteSpace: 'pre-wrap' }}>
            {value.substring(lastIndex, error.start)}
          </span>
        );
      }

      // Add highlighted error
      parts.push(
        <span
          key={`error-${index}`}
          style={{
            backgroundColor: '#fef3c7', // yellow-100
            borderBottom: '2px wavy #f59e0b', // yellow-500 wavy underline
            cursor: 'pointer',
            whiteSpace: 'pre-wrap'
          }}
          onClick={(e) => handleErrorClick(error, e)}
          title={`Possible spelling error: ${error.word}. Click for suggestions.`}
        >
          {error.word}
        </span>
      );

      lastIndex = error.end;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(
        <span key="text-end" style={{ whiteSpace: 'pre-wrap' }}>
          {value.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="relative" style={{ position: 'relative' }}>
      {/* Overlay for highlighting */}
      <div
        ref={overlayRef}
        className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
        style={{
          ...style,
          color: 'transparent',
          backgroundColor: 'transparent',
          border: 'none',
          resize: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          zIndex: 1,
          pointerEvents: spellingErrors.length > 0 ? 'auto' : 'none'
        }}
      >
        <div
          style={{
            padding: style.padding || '0.75rem', // Match textarea padding
            fontSize: style.fontSize || 'inherit',
            fontFamily: style.fontFamily || 'inherit',
            lineHeight: style.lineHeight || 'inherit',
            minHeight: '100%',
            pointerEvents: spellingErrors.length > 0 ? 'auto' : 'none'
          }}
        >
          {createHighlightedText()}
        </div>
      </div>

      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        onMouseUp={onMouseUp}
        onKeyUp={onKeyUp}
        placeholder={placeholder}
        className={className}
        style={{
          ...style,
          backgroundColor: spellingErrors.length > 0 ? 'transparent' : style.backgroundColor,
          position: 'relative',
          zIndex: 2
        }}
        disabled={disabled}
        spellCheck={false} // Disable browser spell check
        {...otherProps}
      />

      {/* Suggestions popup */}
      {showSuggestions && selectedError && (
        <div
          className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-48"
          style={{
            left: suggestionPosition.x,
            top: suggestionPosition.y,
            maxWidth: '250px'
          }}
        >
          <div className="mb-2">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Spelling suggestion for "{selectedError.word}":
            </div>
            {selectedError.suggestions.length > 0 ? (
              <div className="space-y-1">
                {selectedError.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-blue-50 rounded"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No suggestions available</div>
            )}
          </div>
          
          <div className="border-t pt-2 flex space-x-2">
            <button
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              onClick={ignoreError}
            >
              Ignore
            </button>
            <button
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              onClick={() => setShowSuggestions(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpellCheckTextarea;
