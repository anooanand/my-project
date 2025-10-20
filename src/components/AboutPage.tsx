import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
          About <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">Writing Mate</span>
        </h1>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Our Mission</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Writing Mate was created with a clear mission: to help students master the writing skills needed to excel in NSW Selective School exams and beyond. We believe that every student deserves personalized guidance that adapts to their unique learning journey.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Unlike generic AI tools that simply generate content, our platform teaches students how to become better writers through structured guidance, real-time feedback, and practice aligned with NSW curriculum standards.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Our Educational Approach</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            We've developed a unique educational methodology that combines AI technology with proven pedagogical principles:
          </p>
          
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2 text-blue-600">Step-by-Step Guidance</h3>
            <p className="text-gray-700 pl-4 border-l-2 border-blue-200">
              Our AI coach guides students through each section of their writing using an interactive, structured approach based on NSW syllabus expectations.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2 text-purple-600">Adaptive Learning</h3>
            <p className="text-gray-700 pl-4 border-l-2 border-purple-200">
              The platform continuously analyzes writing patterns and progress to provide personalized recommendations and challenges appropriate for each student's skill level.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2 text-blue-600">NSW Curriculum Alignment</h3>
            <p className="text-gray-700 pl-4 border-l-2 border-blue-200">
              All writing types, feedback, and assessment criteria are specifically designed to align with NSW Selective School exam requirements.
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Our Results</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Students using Writing Mate have reported significant improvements in their writing skills and confidence:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">Proven</div>
              <div className="text-gray-700">Teaching Methods</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">Expert</div>
              <div className="text-gray-700">AI Guidance</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Join Our Community</h2>
          <p className="text-gray-700 mb-6">
            Our platform provides the guidance, practice, and feedback needed to develop strong writing skills for NSW Selective School exams and beyond.
          </p>
          <div className="text-center">
            <a href="#" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 hover:shadow-xl text-white font-medium rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
              Start Your Writing Journey
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

