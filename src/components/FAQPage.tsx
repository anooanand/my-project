import React, { useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        className="flex justify-between items-center w-full py-4 px-2 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-medium text-gray-800 dark:text-white">{question}</span>
        <svg
          className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}
      >
        <div className="px-2 text-gray-700 dark:text-gray-300">{answer}</div>
      </div>
    </div>
  );
};

export const FAQPage: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">FAQ</span>
        </h1>
        <p className="text-center text-xl text-gray-600 mb-12">
          Learn about NSW Selective exams and how our AI-powered writing assistant helps students excel
        </p>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">AI Writing Assistant</h2>
          
          <FAQItem
            question="Does the AI write essays for me?"
            answer={
              <div>
                <p className="mb-2">
                  No, our AI never writes essays for you. This is important for several reasons:
                </p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Learning: You need to develop your own writing skills to succeed in exams and beyond</li>
                  <li>Authenticity: Examiners can detect AI-generated content</li>
                  <li>Ethics: Using AI to write essays for you is considered cheating</li>
                </ul>
                <p className="mb-2">Instead, our AI:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Guides you through the writing process step by step</li>
                  <li>Helps you brainstorm and organize your ideas</li>
                  <li>Provides feedback on your writing</li>
                  <li>Suggests improvements for grammar, structure, and style</li>
                  <li>Teaches you writing techniques you can use in exams</li>
                </ul>
              </div>
            }
          />
          
          <FAQItem
            question="How does the AI improve writing skills?"
            answer={
              <div>
                <p className="mb-2">
                  Our AI enhances writing skills through multiple approaches:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Interactive guidance through the writing process</li>
                  <li>Constructive feedback on your work</li>
                  <li>Teaching writing techniques and strategies</li>
                  <li>Helping you identify areas for improvement</li>
                  <li>Providing examples of effective writing techniques</li>
                </ul>
                <p className="mt-2">
                  The AI adapts to your skill level and provides increasingly advanced suggestions as you progress.
                </p>
              </div>
            }
          />
          
          <FAQItem
            question="Can AI detect plagiarism?"
            answer={
              <div>
                <p className="mb-2">
                  Yes, our AI system includes advanced plagiarism detection:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Checks against a vast database of texts</li>
                  <li>Identifies copied content and paraphrasing</li>
                  <li>Ensures originality in student work</li>
                  <li>Provides reports on content authenticity</li>
                </ul>
                <p className="mt-2 font-medium">
                  Note: Plagiarism is strictly prohibited and may result in account suspension.
                </p>
              </div>
            }
          />
          
          <FAQItem
            question="What is Writing Mate?"
            answer={
              <p>
                Writing Mate is an AI-powered writing coach specifically designed to help students prepare for NSW Selective School exams. It provides personalized guidance, real-time feedback, and structured practice for various writing types required in the exam.
              </p>
            }
          />
          
          <FAQItem
            question="How does Writing Mate differ from other AI writing tools?"
            answer={
              <div>
                <p className="mb-2">
                  Unlike generic AI chatbots that simply generate content, Writing Mate:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provides step-by-step writing guidance following NSW curriculum standards</li>
                  <li>Offers real-time feedback on grammar, structure, and content</li>
                  <li>Adapts to each student's skill level</li>
                  <li>Focuses on teaching writing skills rather than just generating answers</li>
                  <li>Includes exam-specific strategies and practice environments</li>
                </ul>
              </div>
            }
          />

          <FAQItem
            question="How does the AI provide personalized feedback?"
            answer={
              <p>
                Our AI utilizes advanced machine learning algorithms to analyze your writing style, grammar, vocabulary, and adherence to NSW Selective marking criteria. It identifies your strengths and areas for improvement, then offers tailored suggestions and exercises. This personalized approach ensures that the feedback is always relevant to your individual learning needs, helping you progress more efficiently than generic tools.
              </p>
            }
          />

          <FAQItem
            question="Can I track my progress and improvement over time?"
            answer={
              <p>
                Yes, our platform includes a comprehensive progress tracking system. You can monitor your performance across different writing types, see your scores improve, and view detailed analytics on specific areas like vocabulary expansion, grammatical accuracy, and structural coherence. This allows you to visualize your growth and focus on areas that require more attention.
              </p>
            }
          />

          <FAQItem
            question="What kind of writing prompts does the AI use?"
            answer={
              <p>
                Our AI generates a wide variety of writing prompts specifically designed to mirror those found in the NSW Selective School exams. These prompts cover all relevant text types, including narrative, persuasive, imaginative, and discursive writing. They are regularly updated to reflect current exam trends and ensure you are practicing with the most realistic scenarios.
              </p>
            }
          />

        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">NSW Selective Exam Preparation</h2>
          
          <FAQItem
            question="What writing types are covered for NSW Selective exams?"
            answer={
              <div>
                <p className="mb-2">Our platform covers all major writing types that may appear in NSW Selective exams:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Narrative Writing - Stories with plots, characters, and descriptive elements</li>
                  <li>Persuasive Writing - Arguments using the PEEL method</li>
                  <li>Informative Writing - Clear explanations of topics</li>
                  <li>Reflective Writing - Personal insights and experiences</li>
                  <li>Imaginative Writing - Creative and fantastical stories</li>
                  <li>Discursive Writing - Exploring different viewpoints</li>
                  <li>Descriptive Writing - Creating vivid imagery with words</li>
                  <li>Recount Writing - Sharing personal or historical experiences</li>
                  <li>Diary Entry Writing - Personal thoughts and feelings</li>
                </ul>
              </div>
            }
          />
          
          <FAQItem
            question="How does the exam simulation work?"
            answer={
              <div>
                <p className="mb-2">
                  The NSW Selective Exam Practice Simulator creates a realistic exam environment with:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Timed writing sessions that match actual exam conditions</li>
                  <li>Real-time word count tracking</li>
                  <li>Post-session review and feedback</li>
                  <li>Assessment based on NSW marking criteria</li>
                </ul>
                <p className="mt-2">
                  This helps students practice under pressure and get familiar with exam conditions while receiving feedback aligned with NSW marking standards.
                </p>
              </div>
            }
          />
          
          <FAQItem
            question="What marking criteria are used for assessment?"
            answer={
              <div>
                <p className="mb-2">
                  Our assessment follows the official NSW Selective School marking criteria, including:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Content and ideas - Originality, relevance, and development</li>
                  <li>Structure and organization - Logical flow and paragraph structure</li>
                  <li>Language and expression - Vocabulary, grammar, and sentence variety</li>
                  <li>Mechanics - Spelling, punctuation, and formatting</li>
                  <li>Text type requirements - Specific elements for each writing type</li>
                </ul>
                <p className="mt-2">
                  Feedback is provided for each criterion to help students understand their strengths and areas for improvement.
                </p>
              </div>
            }
          />
          
          <FAQItem
            question="How should students prepare for the NSW Selective exam?"
            answer={
              <div>
                <p className="mb-2">
                  We recommend a structured approach to preparation:
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Start early - Begin preparation at least 6-12 months before the exam</li>
                  <li>Understand the requirements - Learn what each writing type requires</li>
                  <li>Regular practice - Write consistently using our platform</li>
                  <li>Timed practice - Get comfortable writing under time constraints</li>
                  <li>Seek feedback - Use our AI coach to improve your writing</li>
                  <li>Review and revise - Learn from mistakes and implement improvements</li>
                  <li>Practice exam conditions - Use our simulator for realistic practice</li>
                </ol>
                <p className="mt-2">
                  Consistent practice with guidance is the key to success in the NSW Selective exam.
                </p>
              </div>
            }
          />

          <FAQItem
            question="How does the platform help with time management during the exam?"
            answer={
              <p>
                Our timed practice mode is specifically designed to help students master time management. It replicates the 30-minute time limit of the actual NSW Selective Writing Test, allowing you to practice writing under pressure. The platform provides real-time word count and time remaining, helping you pace yourself and complete your essays within the allocated time.
              </p>
            }
          />

          <FAQItem
            question="Are there resources for understanding the NSW Selective marking criteria in detail?"
            answer={
              <p>
                Absolutely. Our platform provides detailed explanations of the official NSW Selective School marking criteria, breaking down each component (e.g., content, structure, language, mechanics). You'll receive feedback directly aligned with these criteria, helping you understand how your writing is assessed and what specific elements you need to improve to achieve higher scores.
              </p>
            }
          />

          <FAQItem
            question="Does the platform offer support for different year levels?"
            answer={
              <p>
                While our primary focus is on students preparing for the NSW Selective School exam (typically Year 6 for Year 7 entry, and Year 8 for Year 9 entry), the foundational writing skills and feedback provided are beneficial for students across various primary and early high school years. The AI adapts to the user's proficiency, making it a valuable tool for anyone looking to enhance their writing.
              </p>
            }
          />

        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Using the Platform</h2>
          
          <FAQItem
            question="How do I get started with Writing Mate?"
            answer={
              <div>
                <p className="mb-2">Getting started is easy:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Create an account or sign in</li>
                  <li>Select a writing type (narrative, persuasive, etc.)</li>
                  <li>Choose your assistance level</li>
                  <li>Start writing with AI guidance</li>
                </ol>
              </div>
            }
          />
          
          <FAQItem
            question="What are the technical requirements to use the platform?"
            answer={
              <p>
                Our platform is web-based, so you only need a modern web browser (Chrome, Firefox, Safari, Edge) and a stable internet connection. It's compatible with desktops, laptops, and tablets. No special software installations are required.
              </p>
            }
          />

          <FAQItem
            question="Can I use the platform on multiple devices?"
            answer={
              <p>
                Yes, your account is accessible from any device with a web browser and internet connection. Your progress and data are synced across all devices, allowing you to seamlessly switch between them.
              </p>
            }
          />

          <FAQItem
            question="Is my child's writing data private and secure?"
            answer={
              <p>
                Yes, we take data security seriously. All writing data is encrypted and stored securely. We do not share student writing with third parties, and all data is used solely for providing feedback and improving the platform's educational capabilities.
              </p>
            }
          />

          <FAQItem
            question="Is there a free trial available?"
            answer={
              <p>
                Yes, we offer a free trial that allows you to experience the core features of Writing Mate, including access to a limited number of practice essays and basic AI feedback. This is a great way to see how our platform can benefit your child's writing skills before committing to a subscription.
              </p>
            }
          />

          <FAQItem
            question="How can I get help if I have questions?"
            answer={
              <p>
                Our support team is available to help with any questions. You can contact us through the Help Center in your account, or email support@writingmate.co for assistance.
              </p>
            }
          />

          <FAQItem
            question="What are the benefits of a premium subscription?"
            answer={
              <p>
                A premium subscription unlocks unlimited access to all features, including unlimited practice essays, advanced AI feedback, all text type templates, full exam simulation mode, comprehensive progress tracking, and priority customer support. It provides the most complete and effective preparation for the NSW Selective Writing Test, ensuring consistent practice and personalized guidance without limitations.
              </p>
            }
          />

          <FAQItem
            question="How can parents monitor their child's progress?"
            answer={
              <p>
                Parents can access a dedicated dashboard that provides an overview of their child's writing progress. This includes performance trends, scores on practice essays, areas of strength and weakness, and the amount of time spent practicing. This transparency allows parents to stay informed and support their child's learning journey effectively.
              </p>
            }
          />

          <FAQItem
            question="Is technical support available if I encounter issues?"
            answer={
              <p>
                Yes, our dedicated support team is available to assist you with any technical issues or questions you may have. You can reach us through the Help Center within the platform or via email. We are committed to ensuring a smooth and effective learning experience for all our users.
              </p>
            }
          />


        </div>
      </div>
    </div>
  );
};
