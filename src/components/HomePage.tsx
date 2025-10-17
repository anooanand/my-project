Text file: HomePage.tsx
Latest content with line numbers:
1	import React from 'react';
2	import { useAuth } from '../contexts/AuthContext';
3	import { HeroSection } from './HeroSection';
4	import { FeaturesSection } from './FeaturesSection';
5	import { HowItWorksSection } from './HowItWorksSection';
6	import { StudentSuccessSection } from './StudentSuccessSection';
7	import { PricingPage } from './PricingPage';
8	import { WritingTypesSection } from './WritingTypesSection';
9	import { ArrowRight, CheckCircle, Star, Users, Zap, BookOpen, Award, Target } from 'lucide-react';
10	
11	interface HomePageProps {
12	  onNavigate: (page: string, type?: string) => void;
13	}
14	
15	export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
16	  const { user } = useAuth();
17	
18	  return (
19	    <div className="min-h-screen bg-white">
20	      {/* Modern Hero Section */}
21	      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 pb-32">
22	        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] bg-[size:32px_32px]"></div>
23	
24	        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
25	          <div className="text-center max-w-4xl mx-auto">
26	            {/* Trust Badge */}
27	            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full mb-8 border border-blue-100">
28	              <Star className="w-4 h-4 text-yellow-500 fill-current mr-2" />
29	              <span className="text-sm font-semibold text-gray-700">AI-Powered Writing Coach for NSW Students</span>
30	            </div>
31	
32	            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
33	              Master Writing for
34	              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent">
35	                NSW Selective Exams
36	              </span>
37	            </h1>
38	
39	            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
40	              Get instant AI-powered feedback, personalized coaching, and proven strategies to achieve top marks in your writing exam.
41	            </p>
42	
43	            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
44	              <button
45	                onClick={() => onNavigate(user ? 'dashboard' : 'auth')}
46	                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
47	              >
48	                {user ? 'Go to Dashboard' : 'Start Free Trial'}
49	                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
50	              </button>
51	
52	              <button
53	                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
54	                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-200"
55	              >
56	                See How It Works
57	              </button>
58	            </div>
59	
60	            {/* Key Features */}
61	            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
62	              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
63	                <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
64	                <div className="text-sm font-semibold text-gray-900 mb-1">Instant Feedback</div>
65	                <div className="text-xs text-gray-600">Real-time AI analysis</div>
66	              </div>
67	              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
68	                <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
69	                <div className="text-sm font-semibold text-gray-900 mb-1">NSW Aligned with official NSW Department of Education rubric</div>
70	                <div className="text-xs text-gray-600">Curriculum specific, following the official NSW Department of Education rubric</div>
71	              </div>
72	              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
73	                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
74	                <div className="text-sm font-semibold text-gray-900 mb-1">Personalized</div>
75	                <div className="text-xs text-gray-600">Adapts to your level</div>
76	              </div>
77	            </div>
78	          </div>
79	        </div>
80	      </section>
81	
82	      {/* Problem/Solution Section */}
83	      <section className="py-24 bg-gray-50">
84	        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
85	          <div className="text-center mb-16">
86	            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
87	              Why Students Struggle with Writing Exams
88	            </h2>
89	            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
90	              Traditional tutoring is expensive, time-consuming, and doesn't provide instant feedback when you need it most.
91	            </p>
92	          </div>
93	
94	          <div className="grid md:grid-cols-3 gap-8 mb-12">
95	            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
96	              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
97	                <span className="text-2xl">😰</span>
98	              </div>
99	              <h3 className="text-xl font-bold text-gray-900 mb-3">No Instant Feedback</h3>
100	              <p className="text-gray-600">Wait days for tutor feedback, missing crucial practice time before exams.</p>
101	            </div>
102	
103	            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
104	              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
105	                <span className="text-2xl">💸</span>
106	              </div>
107	              <h3 className="text-xl font-bold text-gray-900 mb-3">Expensive Tutoring</h3>
108	              <p className="text-gray-600">Private tutors cost $60-120/hour with inconsistent quality and availability.</p>
109	            </div>
110	
111	            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
112	              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
113	                <span className="text-2xl">📚</span>
114	              </div>
115	              <h3 className="text-xl font-bold text-gray-900 mb-3">Generic Advice</h3>
116	              <p className="text-gray-600">One-size-fits-all guidance doesn't address your specific weaknesses.</p>
117	            </div>
118	          </div>
119	
120	          {/* Solution Highlight */}
121	          <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-12 text-center">
122	            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">
123	              Get Unlimited AI Coaching for Less Than One Tutoring Session
124	            </h3>
125	            <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
126	              Instant feedback • Available 24/7 • Personalized to your needs • NSW curriculum aligned
127	            </p>
128	            <button
129	              onClick={() => onNavigate(user ? 'dashboard' : 'pricing')}
130	              className="inline-flex items-center px-8 py-4 text-lg font-semibold bg-white text-purple-700 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
131	            >
132	              {user ? 'Start Writing Now' : 'View Pricing'}
133	              <ArrowRight className="ml-2 w-5 h-5" />
134	            </button>
135	          </div>
136	        </div>
137	      </section>
138	
139	      {/* Features Section */}
140	      <FeaturesSection />
141	
142	      {/* How It Works */}
143	      <div id="how-it-works">
144	        <HowItWorksSection />
145	      </div>
146	
147	      {/* Writing Types */}
148	      <WritingTypesSection onNavigate={onNavigate} />
149	
150	      {/* Student Success */}
151	      <StudentSuccessSection />
152	
153	      {/* CTA Section */}
154	      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
155	        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
156	          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
157	            Ready to Excel in Your Writing Exam?
158	          </h2>
159	          <p className="text-xl text-gray-600 mb-10">
160	            Start improving your writing skills today with personalized AI-powered coaching.
161	          </p>
162	
163	          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
164	            <button
165	              onClick={() => onNavigate(user ? 'dashboard' : 'auth')}
166	              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
167	            >
168	              {user ? 'Continue Writing' : 'Start Your 3-Day Free Trial'}
169	              <ArrowRight className="ml-2 w-5 h-5" />
170	            </button>
171	          </div>
172	
173	          <p className="text-sm text-gray-500">
174	            No credit card required • Cancel anytime • Money-back guarantee
175	          </p>
176	        </div>
177	      </section>
178	    </div>
179	  );
180	};
181	