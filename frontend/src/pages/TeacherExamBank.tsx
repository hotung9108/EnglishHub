import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Library, Search, PenTool, Mic, BookOpen, Headphones, 
  Sparkles, CheckCircle2, Clock, Send, Eye, Star, 
  Layers, UploadCloud, X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { 
  ExamTemplateItem, ExamSkill, QuickAssignForm 
} from '../types/exam-bank.types';
import { ExamDetailModal } from '../components/exam-bank/ExamDetailModal';
import { QuickAssignModal } from '../components/exam-bank/QuickAssignModal';
import '../styles/teacher-exam-bank.css';

export const TeacherExamBank: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // State
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedBand, setSelectedBand] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Modals state
  const [previewExam, setPreviewExam] = useState<ExamTemplateItem | null>(null);
  const [assigningExam, setAssigningExam] = useState<ExamTemplateItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Exam Templates Database
  const examTemplates: ExamTemplateItem[] = useMemo(() => [
    // --- WRITING EXAMS ---
    {
      id: 'eb-wr-01',
      code: 'EB-WR-191',
      skill: 'writing',
      title: 'Cambridge IELTS 19 - Test 1: Artificial Intelligence & Workforce Evolution',
      description: 'The rapid development of artificial intelligence is poised to transform the global workforce. Some argue that AI will eliminate jobs, while others believe it creates new opportunities.',
      format: 'Cambridge 15-19',
      targetBand: 'Band 6.5 - 7.5',
      durationMinutes: 60,
      questionCount: 'Task 2 Essay • 250+ words',
      tags: ['AI & Tech', 'Employment', 'Society', 'Task 2'],
      usageCount: 28,
      rating: 4.9,
      source: 'Cambridge IELTS 19 Academic',
      difficulty: 'Medium',
      details: {
        taskType: 'IELTS Writing Task 2 (Discursive Essay)',
        prompt: 'The rapid development of artificial intelligence and machine automation is poised to transform the global workforce. Some argue that AI will eliminate millions of traditional jobs, while others believe it will create new employment opportunities. Discuss both views and give your own opinion. (Write at least 250 words).',
        minWords: 250,
        rubricsSummary: 'Task Response (25%), Coherence & Cohesion (25%), Lexical Resource (25%), Grammatical Range & Accuracy (25%).',
        modelAnswerSummary: 'In contemporary society, the relentless advancement of artificial intelligence has sparked intense debate regarding the future of work...'
      }
    },
    {
      id: 'eb-wr-02',
      code: 'EB-WR-182',
      skill: 'writing',
      title: 'Cambridge IELTS 18 - Task 1: Renewable Energy Consumption Comparative Bar Chart',
      description: 'The chart below gives information about renewable energy consumption across six OECD countries between 2010 and 2024. Summarise the key trends and comparisons.',
      format: 'IELTS Academic',
      targetBand: 'Band 6.0 - 7.0',
      durationMinutes: 40,
      questionCount: 'Task 1 Report • 150+ words',
      tags: ['Environment', 'Energy', 'Report', 'Task 1'],
      usageCount: 19,
      rating: 4.8,
      source: 'Cambridge IELTS 18 Academic',
      difficulty: 'Medium',
      details: {
        taskType: 'IELTS Writing Task 1 (Comparative Bar Chart)',
        prompt: 'The chart below illustrates comparative renewable energy generation in gigawatt-hours across six industrial nations between 2010 and 2024. Summarise the information by selecting and reporting the main features and make comparisons where relevant.',
        minWords: 150,
        rubricsSummary: 'Task Achievement (25%), Coherence & Cohesion (25%), Lexical Resource (25%), Grammatical Range (25%).',
        modelAnswerSummary: 'The bar chart demonstrates a noticeable upward trajectory in renewable energy production across the surveyed OECD members...'
      }
    },
    {
      id: 'eb-wr-03',
      code: 'EB-WR-173',
      skill: 'writing',
      title: 'Cambridge IELTS 17 - Task 2: Urban Mass Transit vs Private Car Subsidies',
      description: 'Governments should invest heavily in public transport networks rather than constructing wider highways. To what extent do you agree or disagree?',
      format: 'Cambridge 15-19',
      targetBand: 'Band 7.5 - 8.5+',
      durationMinutes: 60,
      questionCount: 'Task 2 Essay • 250+ words',
      tags: ['Urbanization', 'Infrastructure', 'Pollution', 'Task 2'],
      usageCount: 32,
      rating: 5.0,
      source: 'Cambridge IELTS 17 Academic',
      difficulty: 'Hard',
      details: {
        taskType: 'IELTS Writing Task 2 (Opinion Essay)',
        prompt: 'Traffic congestion in metropolitan centers has reached critical levels. Some experts assert that public expenditure must prioritize high-speed electric mass transit over expanding multi-lane expressways. To what extent do you agree or disagree?',
        minWords: 250,
        rubricsSummary: 'TR 25%, CC 25%, LR 25%, GRA 25% with strict penalty for unsupported generalizations.',
        modelAnswerSummary: 'Urban planners increasingly recognize that building additional road capacity often induces further vehicle traffic...'
      }
    },

    // --- SPEAKING EXAMS ---
    {
      id: 'eb-sp-01',
      code: 'EB-SP-201',
      skill: 'speaking',
      title: 'IELTS Speaking Part 2 & 3: Environmental Hazards & Urban Pollution',
      description: 'Candidate Cue Card: Describe an environmental problem caused by rapid megacity expansion. Includes examiner audio prompt and 3 follow-up discussion questions.',
      format: 'IELTS Academic',
      targetBand: 'Band 6.5 - 7.5',
      durationMinutes: 15,
      questionCount: 'Cue Card + 3 Part 3 Qs',
      tags: ['Environment', 'Urbanization', 'Part 2', 'Part 3'],
      usageCount: 24,
      rating: 4.9,
      source: 'British Council Speaking Master',
      difficulty: 'Medium',
      details: {
        cueCard: {
          topic: 'Describe an environmental problem that has occurred in your city or country.',
          bullets: [
            'What the problem is and where it occurs',
            'What causes this environmental hazard',
            'What effect it has on residents and ecosystems',
            'And explain what measures should be taken to mitigate this issue.'
          ],
          prepTimeSeconds: 60,
          speakingTimeSeconds: 120
        },
        questionsPreview: [
          { id: '1', prompt: 'Do you believe individual actions or government regulations are more effective?', type: 'Discussion' },
          { id: '2', prompt: 'How might green architecture improve air quality in crowded megacities?', type: 'Discussion' }
        ],
        rubricsSummary: 'Fluency & Coherence (25%), Lexical Resource (25%), Grammatical Range (25%), Pronunciation (25%).'
      }
    },
    {
      id: 'eb-sp-02',
      code: 'EB-SP-192',
      skill: 'speaking',
      title: 'IELTS Speaking Part 1 & 2: Digital Devices & AI in Daily Life',
      description: 'Candidate Cue Card: Describe an AI software or smart device that you rely on regularly. Evaluates technical vocabulary and natural rhythm.',
      format: 'Cambridge 15-19',
      targetBand: 'Band 6.0 - 7.0',
      durationMinutes: 12,
      questionCount: 'Cue Card + 4 Part 1 Qs',
      tags: ['AI & Tech', 'Daily Life', 'Part 1', 'Part 2'],
      usageCount: 31,
      rating: 4.8,
      source: 'Cambridge IELTS 19 Speaking',
      difficulty: 'Easy',
      details: {
        cueCard: {
          topic: 'Describe an artificial intelligence tool or digital assistant that you find helpful.',
          bullets: [
            'What the application or gadget is',
            'How frequently you interact with it',
            'How it helps streamline your daily tasks',
            'And explain why you consider it indispensable.'
          ],
          prepTimeSeconds: 60,
          speakingTimeSeconds: 120
        },
        rubricsSummary: 'FC 25%, LR 25%, GRA 25%, PR 25% with automated Whisper phoneme checks.'
      }
    },
    {
      id: 'eb-sp-03',
      code: 'EB-SP-183',
      skill: 'speaking',
      title: 'IELTS Speaking Part 2 & 3: Cultural Heritage & Historic Preservation',
      description: 'Candidate Cue Card: Describe a historic monument or heritage site you visited. Evaluates past narratives and abstract sociopolitical reasoning in Part 3.',
      format: 'IELTS Academic',
      targetBand: 'Band 7.5 - 8.5+',
      durationMinutes: 15,
      questionCount: 'Cue Card + 4 Part 3 Qs',
      tags: ['Culture', 'History', 'Tourism', 'Part 3'],
      usageCount: 17,
      rating: 4.9,
      source: 'IELTS Masterclass Official',
      difficulty: 'Hard',
      details: {
        cueCard: {
          topic: 'Describe a historic building or cultural monument that made a strong impression on you.',
          bullets: [
            'Where the site is situated',
            'What historical era it originates from',
            'What architectural features it possesses',
            'And explain why preserving this heritage is significant for future generations.'
          ],
          prepTimeSeconds: 60,
          speakingTimeSeconds: 120
        },
        rubricsSummary: 'High-band collocations, complex past modals, and phoneme stress.'
      }
    },

    // --- READING EXAMS ---
    {
      id: 'eb-rd-01',
      code: 'EB-RD-191',
      skill: 'reading',
      title: 'Cambridge IELTS 19 - Academic Reading: Biomimicry Innovation & Engineering',
      description: 'Full Academic Reading Passage exploring how bio-inspired design and shark skin denticles are revolutionizing renewable energy turbine blades.',
      format: 'Cambridge 15-19',
      targetBand: 'Band 6.5 - 7.5',
      durationMinutes: 20,
      questionCount: '13 Questions • 1 Passage',
      tags: ['Science', 'Biology', 'Engineering', 'MCQ'],
      usageCount: 36,
      rating: 5.0,
      source: 'Cambridge IELTS 19 Academic',
      difficulty: 'Medium',
      details: {
        passage: {
          title: 'Biomimicry Innovation: How Evolutionary Adaptations Power Modern Industry',
          paragraphs: [
            { label: 'A', text: 'Biomimicry is the practice of learning from and mimicking the strategies found in nature to solve human design challenges...' },
            { label: 'B', text: 'Consider the humpback whale. Despite weighing up to 40 tons, it maneuvers through water with surprising agility, due to bumps called tubercles...' },
            { label: 'C', text: 'Another triumph of bio-inspired engineering is modeled on shark denticles, which reduce drag and deter bacterial colonization...' }
          ]
        },
        questionsPreview: [
          { id: '1', prompt: 'According to Paragraph B, why do humpback whale flippers possess tubercles?', type: 'Multiple Choice' },
          { id: '2', prompt: 'Shark denticles are currently deployed on commercial aircraft surfaces.', type: 'True/False/Not Given' },
          { id: '3', prompt: 'Whale tubercle design increases turbine electrical output by [ _____ ] percent.', type: 'Gap Fill' }
        ]
      }
    },
    {
      id: 'eb-rd-02',
      code: 'EB-RD-182',
      skill: 'reading',
      title: 'Cambridge IELTS 18 - Academic Reading: The Evolution of Typesetting & Typography',
      description: 'Passage analyzing the historical origins of typesetting, the 1500s Aldus Manutius legacy, and the digital transition to modern computer fonts.',
      format: 'Cambridge 15-19',
      targetBand: 'Band 6.0 - 7.0',
      durationMinutes: 20,
      questionCount: '14 Questions • 1 Passage',
      tags: ['History', 'Typography', 'Media', 'T/F/NG'],
      usageCount: 22,
      rating: 4.8,
      source: 'Cambridge IELTS 18 Academic',
      difficulty: 'Medium',
      details: {
        passage: {
          title: 'The Origin and Enduring Legacy of Typesetting Standards',
          paragraphs: [
            { label: 'A', text: 'Lorem Ipsum has been the industry standard dummy text ever since the 1500s...' },
            { label: 'B', text: 'The point of using dummy text is that it has a normal distribution of letters...' },
            { label: 'C', text: 'Roots in classical Latin literature dating back to Cicero in 45 BC...' }
          ]
        },
        questionsPreview: [
          { id: '1', prompt: 'Who took a 1914 Cicero translation to make Letraset Body Type sheets?', type: 'Multiple Choice' },
          { id: '2', prompt: 'The earliest printed books did not use any layout planning.', type: 'True/False/Not Given' }
        ]
      }
    },
    {
      id: 'eb-rd-03',
      code: 'EB-RD-173',
      skill: 'reading',
      title: 'Cambridge IELTS 17 - Academic Reading: Urban Agriculture & Hydroponic Systems',
      description: 'Detailed passage examining vertical farming yields, LED wavelength optimization, and water reclamation economics in high-density capitals.',
      format: 'IELTS Academic',
      targetBand: 'Band 7.5 - 8.5+',
      durationMinutes: 20,
      questionCount: '13 Questions • 1 Passage',
      tags: ['Agriculture', 'Food Tech', 'Sustainability', 'Headings'],
      usageCount: 29,
      rating: 4.9,
      source: 'Cambridge IELTS 17 Academic',
      difficulty: 'Hard',
      details: {
        passage: {
          title: 'Feeding the Vertical City: The Economics of Hydroponic Urban Towers',
          paragraphs: [
            { label: 'A', text: 'By 2050, roughly 68 percent of humanity will reside in metropolitan regions, exerting immense strain on rural agricultural chains...' },
            { label: 'B', text: 'Controlled-environment agriculture (CEA) allows year-round crop production with 95 percent less water than conventional soil farming...' }
          ]
        },
        questionsPreview: [
          { id: '1', prompt: 'Paragraph A heading matches: The impending food security crisis in urban centers.', type: 'Matching Headings' },
          { id: '2', prompt: 'Closed-loop hydroponic systems recycle virtually all nutrient water.', type: 'True/False/Not Given' }
        ]
      }
    },

    // --- LISTENING EXAMS ---
    {
      id: 'eb-ls-01',
      code: 'EB-LS-151',
      skill: 'listening',
      title: 'Cambridge IELTS 15 - Test 1: Campus Accommodation & Academic Tutoring',
      description: 'Full 4-section listening practice: student housing interview, campus tour, renewable seminar consultation, and an academic lecture on marine biology.',
      format: 'Cambridge 15-19',
      targetBand: 'Band 6.0 - 7.0',
      durationMinutes: 30,
      questionCount: '40 Questions • 4 Sections',
      tags: ['Campus Life', 'Housing', 'Lecture', 'Form Completion'],
      usageCount: 42,
      rating: 5.0,
      source: 'Cambridge IELTS 15 Official Audio',
      difficulty: 'Medium',
      details: {
        audio: {
          title: 'Cambridge_15_Test1_Listening_Full.mp3',
          duration: '30:00',
          sectionsCount: 4
        },
        questionsPreview: [
          { id: '1', prompt: 'Name of applicant: [ Alice Johnson ]', type: 'Form Completion', clue: '02:10' },
          { id: '2', prompt: 'Preferred location near: [ Central Park ] campus', type: 'Form Completion', clue: '01:05' },
          { id: '3', prompt: 'Duration of accommodation requested: [ 2 ] semesters', type: 'Form Completion', clue: '02:10' }
        ]
      }
    },
    {
      id: 'eb-ls-02',
      code: 'EB-LS-162',
      skill: 'listening',
      title: 'Cambridge IELTS 16 - Section 2 & 3: Local Eco-Park & Chemistry Tutorial',
      description: 'Features a community volunteer briefing followed by a university discussion on carbon capture catalysts with distraction traps and phonetic pitfalls.',
      format: 'Cambridge 15-19',
      targetBand: 'Band 6.5 - 7.5',
      durationMinutes: 25,
      questionCount: '20 Questions • Sections 2 & 3',
      tags: ['Volunteering', 'Science', 'Discussion', 'MCQ'],
      usageCount: 25,
      rating: 4.8,
      source: 'Cambridge IELTS 16 Audio',
      difficulty: 'Medium',
      details: {
        audio: {
          title: 'Cambridge_16_Sections_2_3.mp3',
          duration: '22:45',
          sectionsCount: 2
        },
        questionsPreview: [
          { id: '1', prompt: 'What safety gear must volunteers wear before entering the wetland reserve?', type: 'Multiple Choice', clue: '04:15' },
          { id: '2', prompt: 'The student postponed the lab experiment due to: [ Equipment calibration ]', type: 'Short Answer', clue: '08:30' }
        ]
      }
    },
    {
      id: 'eb-ls-03',
      code: 'EB-LS-183',
      skill: 'listening',
      title: 'Cambridge IELTS 18 - Section 4: Academic Lecture on Deep Sea Hydrothermal Vents',
      description: 'Fast-paced academic monologue examining chemosynthetic organisms living near oceanic trenches. Tests dense note-taking and rapid scientific spelling.',
      format: 'IELTS Academic',
      targetBand: 'Band 7.5 - 8.5+',
      durationMinutes: 20,
      questionCount: '10 Questions • Section 4',
      tags: ['Oceanography', 'Biology', 'Section 4', 'Note Completion'],
      usageCount: 18,
      rating: 4.9,
      source: 'Cambridge IELTS 18 Audio',
      difficulty: 'Hard',
      details: {
        audio: {
          title: 'Cambridge_18_Section4_Hydrothermal.mp3',
          duration: '14:20',
          sectionsCount: 1
        },
        questionsPreview: [
          { id: '1', prompt: 'Hydrothermal vents were first discovered in [ 1977 ] near the Galapagos Rift.', type: 'Note Completion', clue: '01:45' },
          { id: '2', prompt: 'Primary bacteria utilize [ hydrogen sulfide ] instead of sunlight for energy.', type: 'Note Completion', clue: '03:10' }
        ]
      }
    }
  ], []);

  // Filtered list
  const filteredExams = useMemo(() => {
    return examTemplates.filter(item => {
      // Skill filter
      if (selectedSkill !== 'all' && item.skill !== selectedSkill) return false;
      // Format filter
      if (selectedFormat !== 'all' && item.format !== selectedFormat) return false;
      // Band filter
      if (selectedBand !== 'all' && item.targetBand !== selectedBand) return false;
      // Tag filter
      if (selectedTag !== 'all' && !item.tags.includes(selectedTag)) return false;
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [examTemplates, selectedSkill, selectedFormat, selectedBand, selectedTag, searchQuery]);

  // Skill counts for pills
  const skillCounts = useMemo(() => {
    return {
      all: examTemplates.length,
      writing: examTemplates.filter(e => e.skill === 'writing').length,
      speaking: examTemplates.filter(e => e.skill === 'speaking').length,
      reading: examTemplates.filter(e => e.skill === 'reading').length,
      listening: examTemplates.filter(e => e.skill === 'listening').length,
    };
  }, [examTemplates]);

  const handleConfirmAssign = (form: QuickAssignForm) => {
    setAssigningExam(null);
    showToast(isVi 
      ? `Đã giao đề "${form.assignmentTitle}" thành công cho lớp ${form.className}!` 
      : `Successfully deployed "${form.assignmentTitle}" to ${form.className}!`);
  };

  const handleCloneTemplate = (exam: ExamTemplateItem) => {
    showToast(isVi ? `Đang nhân bản đề ${exam.code} vào trình soạn thảo bài tập...` : `Cloning ${exam.code} into editor...`);
    setTimeout(() => {
      navigate(`/teacher/assignments/create?type=${exam.skill}&templateId=${exam.id}`);
    }, 600);
  };

  const getSkillBadge = (skill: ExamSkill) => {
    switch (skill) {
      case 'writing':
        return (
          <span className="exam-badge-skill writing">
            <PenTool size={12} /> Writing
          </span>
        );
      case 'speaking':
        return (
          <span className="exam-badge-skill speaking">
            <Mic size={12} /> Speaking
          </span>
        );
      case 'reading':
        return (
          <span className="exam-badge-skill reading">
            <BookOpen size={12} /> Reading
          </span>
        );
      default:
        return (
          <span className="exam-badge-skill listening">
            <Headphones size={12} /> Listening
          </span>
        );
    }
  };

  return (
    <div className="exam-bank-container">
      {/* Hero Header Banner */}
      <section className="exam-bank-hero">
        <div className="exam-hero-content">
          <div>
            <h1 className="exam-hero-title">
              <Library size={30} color="#60a5fa" />
              {isVi ? 'Ngân Hàng Đề Thi & Bài Tập Mẫu' : 'Exam & Assessment Template Bank'}
            </h1>
            <p className="exam-hero-subtitle">
              {isVi
                ? 'Thư viện đề thi chuẩn Cambridge IELTS, TOEIC và học liệu 4 kỹ năng được hiệu chuẩn sẵn rubric chấm điểm và AI diagnostics. Giao bài nhanh cho lớp chỉ với 1 cú click.'
                : 'Curated repository of official Cambridge IELTS, TOEIC, and 4-skill exam modules with calibrated rubrics and AI assessment presets.'}
            </p>
          </div>

          <div className="exam-hero-actions">
            <button 
              type="button" 
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => navigate('/teacher/assignments/create')}
              style={{ fontWeight: 700, color: '#0f172a' }}
            >
              <UploadCloud size={16} />
              <span>{isVi ? '+ Soạn đề mới' : '+ Create Custom'}</span>
            </button>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: '#2563eb', borderColor: '#3b82f6', fontWeight: 700 }}
              onClick={() => showToast(isVi ? 'Đang cập nhật thêm đề thi Cambridge 20...' : 'Syncing Cambridge 20 Exam Bank...')}
            >
              <Sparkles size={16} />
              <span>{isVi ? 'Đồng bộ Cambridge' : 'Sync Cambridge'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <div className="exam-stats-grid">
        <div className="exam-stat-card">
          <div className="exam-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Library size={22} />
          </div>
          <div>
            <div className="exam-stat-num">{examTemplates.length} {isVi ? 'Đề thi chuẩn' : 'Templates'}</div>
            <div className="exam-stat-label">{isVi ? 'Toàn bộ 4 kỹ năng trong thư viện' : 'Curated 4-Skill Exams'}</div>
          </div>
        </div>

        <div className="exam-stat-card">
          <div className="exam-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="exam-stat-num">100% {isVi ? 'Rubric Chuẩn' : 'Calibrated'}</div>
            <div className="exam-stat-label">{isVi ? 'Tích hợp sẵn thang điểm AI' : 'Official IELTS Band Descriptors'}</div>
          </div>
        </div>

        <div className="exam-stat-card">
          <div className="exam-stat-icon" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
            <Layers size={22} />
          </div>
          <div>
            <div className="exam-stat-num">420+ {isVi ? 'Lượt giao bài' : 'Class Deploys'}</div>
            <div className="exam-stat-label">{isVi ? 'Giáo viên đã sử dụng trong học kỳ' : 'Deployed across classrooms'}</div>
          </div>
        </div>

        <div className="exam-stat-card">
          <div className="exam-stat-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Star size={22} />
          </div>
          <div>
            <div className="exam-stat-num">4.9 / 5.0</div>
            <div className="exam-stat-label">{isVi ? 'Đánh giá độ sát đề thi thật' : 'Exam Fidelity Rating'}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="exam-filter-bar">
        {/* 4 Skills Navigation Pills */}
        <div className="exam-skill-pills">
          <button
            type="button"
            className={`exam-skill-pill ${selectedSkill === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedSkill('all')}
          >
            {isVi ? 'Tất cả kỹ năng' : 'All Skills'}
            <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: 2 }}>({skillCounts.all})</span>
          </button>

          <button
            type="button"
            className={`exam-skill-pill ${selectedSkill === 'writing' ? 'active-writing' : ''}`}
            onClick={() => setSelectedSkill('writing')}
          >
            <PenTool size={13} />
            <span>Writing (Kỹ năng Viết)</span>
            <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: 2 }}>({skillCounts.writing})</span>
          </button>

          <button
            type="button"
            className={`exam-skill-pill ${selectedSkill === 'speaking' ? 'active-speaking' : ''}`}
            onClick={() => setSelectedSkill('speaking')}
          >
            <Mic size={13} />
            <span>Speaking (Kỹ năng Nói)</span>
            <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: 2 }}>({skillCounts.speaking})</span>
          </button>

          <button
            type="button"
            className={`exam-skill-pill ${selectedSkill === 'reading' ? 'active-reading' : ''}`}
            onClick={() => setSelectedSkill('reading')}
          >
            <BookOpen size={13} />
            <span>Reading (Kỹ năng Đọc)</span>
            <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: 2 }}>({skillCounts.reading})</span>
          </button>

          <button
            type="button"
            className={`exam-skill-pill ${selectedSkill === 'listening' ? 'active-listening' : ''}`}
            onClick={() => setSelectedSkill('listening')}
          >
            <Headphones size={13} />
            <span>Listening (Kỹ năng Nghe)</span>
            <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: 2 }}>({skillCounts.listening})</span>
          </button>
        </div>

        {/* Search & Dropdown Filters Row */}
        <div className="exam-controls-row">
          <div className="exam-search-box">
            <Search size={15} className="exam-search-icon" />
            <input 
              type="text"
              className="exam-search-input"
              placeholder={isVi ? 'Tìm đề theo tên, mã đề EB, chủ đề (AI, Environment...)' : 'Search exam code, topic, or title...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="exam-dropdown-group">
            {/* Format Filter */}
            <select 
              className="exam-filter-select"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value="all">{isVi ? 'Tất cả nguồn đề' : 'All Exam Sources'}</option>
              <option value="Cambridge 15-19">Cambridge IELTS 15-19</option>
              <option value="IELTS Academic">IELTS Academic Test</option>
              <option value="IELTS General">IELTS General</option>
              <option value="TOEIC 750+">TOEIC 750+ Test Bank</option>
              <option value="VSTEP B2-C1">VSTEP B2-C1</option>
            </select>

            {/* Target Band Filter */}
            <select 
              className="exam-filter-select"
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
            >
              <option value="all">{isVi ? 'Tất cả Target Band' : 'All Target Bands'}</option>
              <option value="Band 5.5 - 6.5">Band 5.5 - 6.5</option>
              <option value="Band 6.5 - 7.5">Band 6.5 - 7.5</option>
              <option value="Band 7.5 - 8.5+">Band 7.5 - 8.5+</option>
            </select>

            {/* Topic Tag Filter */}
            <select 
              className="exam-filter-select"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="all">{isVi ? 'Tất cả chủ đề' : 'All Topic Tags'}</option>
              <option value="Environment">Environment & Ecology</option>
              <option value="AI & Tech">AI & Technology</option>
              <option value="Urbanization">Urbanization & Cities</option>
              <option value="Science">Science & Biology</option>
              <option value="Campus Life">Campus Life & Education</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exam Grid */}
      <div className="exam-grid">
        {filteredExams.map((exam) => (
          <div key={exam.id} className="exam-card">
            <div>
              {/* Card Top: Code, Skill, Source */}
              <div className="exam-card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="exam-card-code">{exam.code}</span>
                  {getSkillBadge(exam.skill)}
                </div>
                <span className="exam-card-source">{exam.source}</span>
              </div>

              {/* Title */}
              <h3 
                className="exam-card-title"
                onClick={() => setPreviewExam(exam)}
                title={exam.title}
              >
                {exam.title}
              </h3>

              {/* Description */}
              <p className="exam-card-desc">
                {exam.description}
              </p>

              {/* Meta tags strip */}
              <div className="exam-card-meta-strip">
                <span><Clock size={12} style={{ display: 'inline', marginRight: 3 }} />{exam.durationMinutes}p</span>
                <span>•</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{exam.questionCount}</span>
                <span>•</span>
                <span style={{ 
                  color: '#15803d', 
                  backgroundColor: '#f0fdf4', 
                  padding: '1px 6px', 
                  borderRadius: '4px', 
                  fontWeight: 700 
                }}>
                  {exam.targetBand}
                </span>
              </div>

              {/* Tags */}
              <div className="exam-card-tags" style={{ marginTop: '10px' }}>
                {exam.tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="exam-tag-pill">#{tag}</span>
                ))}
              </div>
            </div>

            {/* Footer with actions */}
            <div className="exam-card-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                <Star size={13} fill="#d97706" color="#d97706" />
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{exam.rating}</span>
                <span>({exam.usageCount})</span>
              </div>

              <div className="exam-card-actions">
                <button
                  type="button"
                  className="btn btn-secondary bg-white btn-sm"
                  style={{ padding: '6px 10px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  onClick={() => setPreviewExam(exam)}
                  title={isVi ? 'Xem trước nội dung đề' : 'Preview Exam'}
                >
                  <Eye size={13} />
                  <span>{isVi ? 'Xem trước' : 'Preview'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  onClick={() => setAssigningExam(exam)}
                >
                  <Send size={13} />
                  <span>{isVi ? 'Giao cho lớp' : 'Assign'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredExams.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
          <Library size={44} color="#94a3b8" style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            {isVi ? 'Không tìm thấy đề thi phù hợp' : 'No matching exam templates found'}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            {isVi ? 'Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc kỹ năng/thang điểm.' : 'Try adjusting your search query or reset the skill filters.'}
          </p>
        </div>
      )}

      {/* Exam Detail Preview Modal */}
      {previewExam && (
        <ExamDetailModal 
          exam={previewExam}
          onClose={() => setPreviewExam(null)}
          onAssignToClass={(item) => setAssigningExam(item)}
          onCloneTemplate={(item) => handleCloneTemplate(item)}
        />
      )}

      {/* Quick Assign Modal */}
      {assigningExam && (
        <QuickAssignModal 
          exam={assigningExam}
          onClose={() => setAssigningExam(null)}
          onConfirmAssign={handleConfirmAssign}
        />
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="edit-toast">
          <CheckCircle2 size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default TeacherExamBank;
