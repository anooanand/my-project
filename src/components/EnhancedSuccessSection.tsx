import React from 'react';
import { CheckCircle, X, Play, Quote, Star, ArrowRight } from 'lucide-react';

export function EnhancedSuccessSection() {
  const testimonials = [
    {
      name: "Emily R.",
      role: "Selective School Student",
      quote: "Writing Mate transformed my approach to essays. The instant feedback helped me understand my mistakes immediately, leading to a significant improvement in my scores. Highly recommend!",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      rating: 5
    },
    {
      name: "David L.",
      role: "Year 6 Student",
      quote: "I used to dread writing, but Writing Mate made it fun and engaging. The personalized tips were like having a tutor available 24/7. I feel much more confident for my exams now.",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      rating: 5
    },
    {
      name: "Sarah K.",
      role: "Parent of Year 8 Student",
      quote: "As a parent, I'm thrilled with the progress my child has made. The detailed feedback and structured practice have been invaluable. It's an affordable and effective alternative to traditional tutoring.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5
    },
  ];

  return (
    <div className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Statistics Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              See Results in Just Weeks!
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">87%</div>
              <div className="text-lg text-blue-100">Average Score Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">10,000+</div>
              <div className="text-lg text-blue-100">Students Helped</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">4.9/5</div>
              <div className="text-lg text-blue-100">Parent Satisfaction</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-colors duration-300 shadow-lg">
              Start Your Free Trial
            </button>
            <button className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-blue-600 transition-colors duration-300 flex items-center justify-center">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </button>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Hear From Our Successful Students & Parents
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join hundreds of students who have boosted their writing scores and confidence with Writing Mate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 shadow-md border border-gray-100 flex flex-col">
                <div className="flex items-center mb-4">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4 object-cover" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-gray-300 mb-4" />
                <p className="text-gray-700 flex-grow">{testimonial.quote}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-xl text-gray-700 mb-6">
              Ready to write your own success story?
            </p>
            <button
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start Your Free Trial Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Feature Comparison Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="text-2xl mr-3">💡</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              How Writing Mate Stands Out from Other AI Writing Tools
            </h3>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="text-xl mr-3">🔍</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Feature Comparison
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-green-600">Writing Mate</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-600 dark:text-gray-400">Generic AI Chatbots</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">Step-by-step writing guidance</td>
                    <td className="py-4 px-4 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <X className="w-6 h-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">Follows NSW writing criteria</td>
                    <td className="py-4 px-4 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <X className="w-6 h-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">NSW exam-style feedback</td>
                    <td className="py-4 px-4 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <X className="w-6 h-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">Real-time grammar & sentence corrections</td>
                    <td className="py-4 px-4 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">Adaptive learning based on skill level</td>
                    <td className="py-4 px-4 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <X className="w-6 h-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">Interactive AI coaching</td>
                    <td className="py-4 px-4 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <X className="w-6 h-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-pink-50 dark:bg-pink-900/30 rounded-lg border-l-4 border-pink-500">
              <div className="flex items-start">
                <div className="text-xl mr-3">📌</div>
                <p className="text-gray-700 dark:text-gray-300">
                  Unlike generic AI chatbots, Writing Mate teaches students how to write better, rather than just generating answers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
