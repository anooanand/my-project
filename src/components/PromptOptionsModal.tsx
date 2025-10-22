import React, { useState } from 'react';
import { X, Sparkles, Edit3, Wand, Star, Zap } from 'lucide-react';
import './PromptOptionsModal.css'; // Import for custom styles
import { useNavigate } from 'react-router-dom';

interface PromptOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGeneratePrompt: () => Promise<void>;
  onCustomPrompt: () => void;
  textType: string;
}

export function PromptOptionsModal({
  isOpen,
  onClose,
  onGeneratePrompt,
  onCustomPrompt,
  textType
}: PromptOptionsModalProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePrompt = async () => {
    setIsLoading(true);
    console.log('🎯 PromptOptionsModal: Generate prompt clicked for:', textType);

    localStorage.setItem('promptType', 'generated');
    localStorage.setItem('selectedWritingType', textType);

    await onGeneratePrompt();
    setIsLoading(false);
  };

  const handleCustomPrompt = () => {
    console.log('✏️ PromptOptionsModal: Custom prompt clicked for:', textType);

    localStorage.setItem('promptType', 'custom');
    localStorage.setItem('selectedWritingType', textType);

    onCustomPrompt();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="prompt-modal-overlay">
      <div className="prompt-modal-container">
        <div className="prompt-modal-content">
          <div className="prompt-modal-header">
            <div className="prompt-modal-header-top">
              <div className="prompt-modal-title-area">
                <div className="prompt-modal-icon-wrapper">
                  <Wand className="prompt-modal-icon" />
                </div>
                <h2 className="prompt-modal-title">
                  How would you like to get your {textType} writing prompt?
                </h2>
              </div>
              <button onClick={handleClose} className="prompt-modal-close-button">
                <X className="prompt-modal-close-icon" />
              </button>
            </div>
            <p className="prompt-modal-subtitle">
              Choose how you want to start your writing adventure today!
            </p>
          </div>

          <div className="prompt-modal-body">
            <div className="prompt-modal-options-wrapper">
              <button onClick={handleGeneratePrompt} disabled={isLoading} className="prompt-option-button prompt-option-magic">
                <div className="prompt-option-icon-wrapper">
                  <div className="prompt-option-icon-bg">
                    {isLoading ? (
                      <Zap className="prompt-option-sparkles animate-spin" />
                    ) : (
                      <Sparkles className="prompt-option-sparkles" />
                    )}
                  </div>
                </div>
                <div className="prompt-option-text-content">
                  <h3 className="prompt-option-title">
                    {isLoading ? 'Generating Prompt...' : 'Magic Prompt Generator ✨'}
                  </h3>
                  <p className="prompt-option-description">
                    Let our AI create an awesome {textType} prompt just for you! Perfect for getting started quickly.
                  </p>
                </div>
              </button>

              <button onClick={handleCustomPrompt} className="prompt-option-button prompt-option-custom">
                <div className="prompt-option-icon-wrapper">
                  <div className="prompt-option-icon-bg">
                    <Edit3 className="prompt-option-edit-icon" />
                  </div>
                </div>
                <div className="prompt-option-text-content">
                  <h3 className="prompt-option-title">
                    Use my own Prompt
                  </h3>
                  <p className="prompt-option-description">
                    Type in your own {textType} writing prompt or topic. Great for when you have a specific idea!
                  </p>
                </div>
              </button>
            </div>

            <div className="prompt-tip-box">
              <div className="prompt-tip-content">
                <Star className="prompt-tip-icon" />
                <p className="prompt-tip-text">
                  A good prompt will help you write an amazing {textType} story! Choose the option that sounds most exciting to you. Remember, there's no wrong choice - both will lead to great writing adventures!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
