
import { Question } from './types';

export const COLORS = {
  primary: '#020617',
  secondary: '#0f172a',
  accent: '#92400e',
  success: '#064e3b',
  danger: '#7f1d1d',
  info: '#1e3a8a',
  background: '#f8fafc',
};

export const HOST_SCRIPTS = {
  INTRO: "Digital University AI Quiz Platform online. Welcome teams. Let's start the quiz!",
  WARNING_10S: "Just 10 seconds remaining.",
  TIME_UP: "Time is up. Let's move forward.",
  ASK_AI_INTRO: "{team}, please ask your question now."
};

export const AI_COMMENTS = {
  CORRECT: [
    "കലക്കി! (Kalakki!)",
    "പൊളിച്ചു! (Polichu!)",
    "അടി സക്കെ! (Adi Sakke!)",
    "കിടുവേ! (Kiduve!)",
    "സംഭവം കളറായി! (Sambhavam Colour Aayi!)",
    "ഒരു രക്ഷയുമില്ല! (Oru Rakshayumilla!)",
    "എടാ മോനേ! (Eda Mone!)",
    "മാസ്സ്! (Mass!)"
  ],
  WRONG: [
    "എന്തോന്നടേ ഇത്? (Enthonnade Ithu?)",
    "അയ്യേ... മോശം! (Ayye... Mosham!)",
    "നീ പോ മോനേ ദിനേശാ. (Nee Po Mone Dinesha.)",
    "ചതി കുലേ! (Chathi Kule!)",
    "ശോകം... വലിയ ശോകം. (Shokam... Valiya Shokam.)",
    "വിവരമില്ലായ്മ ഒരു കുറ്റമല്ല. (Vivaramillayma Oru Kuttamalla.)",
    "സെൻസ് വേണം, സെൻസിബിലിറ്റി വേണം. (Sense Venam, Sensibility Venam.)",
    "അളിയാ... തെറ്റിപ്പോയി. (Aliya... Thettippoyi.)"
  ]
};

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'ai_1',
    text: 'What does the "A" in AI stand for when discussing computer intelligence?',
    options: ['Artificial', 'Automated', 'Advanced', 'Analytical'],
    correctAnswer: 0,
    explanation: 'AI stands for Artificial Intelligence, which refers to systems or machines that mimic human intelligence to perform tasks.',
    points: 50,
    timeLimit: 30,
    roundType: 'STANDARD',
    difficulty: 'EASY',
    hint: 'It is the opposite of natural or biological.'
  },
  {
    id: 'ai_2',
    text: 'Which mathematician developed a "Test" to see if a machine could mimic human conversation?',
    options: ['Isaac Newton', 'Alan Turing', 'Ada Lovelace', 'Charles Babbage'],
    correctAnswer: 1,
    explanation: 'Alan Turing proposed the Turing Test in 1950 to evaluate whether a machine could think or behave like a human.',
    points: 100,
    timeLimit: 30,
    roundType: 'STANDARD',
    difficulty: 'EASY',
    hint: 'He is famously known for breaking the Enigma code.'
  },
  {
    id: 'ai_3',
    text: 'What is the primary goal of a "Neural Network" in modern AI?',
    options: ['To store large files', 'To mimic the human brain to find patterns', 'To speed up internet hardware', 'To encrypt blockchain data'],
    correctAnswer: 1,
    explanation: 'Neural networks are designed to mimic the human brain’s architecture to identify patterns and solve complex problems.',
    points: 150,
    timeLimit: 30,
    roundType: 'BUZZER',
    difficulty: 'MEDIUM',
    hint: 'Think about how biological neurons connect and learn.'
  },
  {
    id: 'ai_4',
    text: 'In the context of ChatGPT, what does the "P" in GPT stand for?',
    options: ['Programmed', 'Prototyped', 'Pre-trained', 'Processed'],
    correctAnswer: 2,
    explanation: 'The "P" stands for Pre-trained, meaning the model was trained on a large corpus of data before being fine-tuned.',
    points: 150,
    timeLimit: 30,
    roundType: 'STANDARD',
    difficulty: 'MEDIUM',
    hint: 'It describes how the model was taught before you interacted with it.'
  },
  {
    id: 'ai_5',
    text: 'Which IBM computer famously defeated world chess champion Garry Kasparov in 1997?',
    options: ['Watson', 'Deep Blue', 'AlphaGo', 'Siri'],
    correctAnswer: 1,
    explanation: 'Deep Blue was an IBM supercomputer that became the first machine to defeat a world chess champion in a match.',
    points: 200,
    timeLimit: 30,
    roundType: 'BUZZER',
    difficulty: 'MEDIUM',
    hint: 'It shares its name with a deep shade of a primary color.'
  },
  {
    id: 'ai_6',
    text: 'What term describes an AI model confidently presenting false information as fact?',
    options: ['Debugging', 'Glitching', 'Hallucination', 'Phantom Data'],
    correctAnswer: 2,
    explanation: 'AI hallucination occurs when an AI model generates factually incorrect information while appearing confident.',
    points: 200,
    timeLimit: 30,
    roundType: 'STANDARD',
    difficulty: 'MEDIUM',
    hint: 'It is the same word used in psychology for seeing things that aren\'t there.'
  },
  {
    id: 'ai_7',
    text: 'Who coined the "Three Laws of Robotics" in his influential science fiction stories?',
    options: ['Isaac Asimov', 'Arthur C. Clarke', 'Philip K. Dick', 'Elon Musk'],
    correctAnswer: 0,
    explanation: 'Isaac Asimov introduced the Three Laws of Robotics in his science fiction work, which established rules for robotic behavior.',
    points: 150,
    timeLimit: 30,
    roundType: 'STANDARD',
    difficulty: 'MEDIUM',
    hint: 'He wrote "I, Robot" and was a master of hard science fiction.'
  },
  {
    id: 'ai_8',
    text: 'In Machine Learning, what is "Overfitting"?',
    options: ['Data is too large for storage', 'A model memorizes noise rather than learning patterns', 'Hardware overheating', 'Too many layers in a network'],
    correctAnswer: 1,
    explanation: 'Overfitting occurs when a model learns the training data too well, including its noise, leading to poor generalization on new data.',
    points: 300,
    timeLimit: 30,
    roundType: 'BUZZER',
    difficulty: 'HARD',
    hint: 'The model performs perfectly on training data but fails on new data.'
  },
  {
    id: 'ai_9',
    text: 'Which 2017 research paper introduced the Transformer architecture used by most modern LLMs?',
    options: ['Attention Is All You Need', 'Computing Machinery and Intelligence', 'The Deep Learning Revolution', 'Neural Turing Machines'],
    correctAnswer: 0,
    explanation: 'The paper "Attention Is All You Need" introduced the Transformer architecture, which revolutionized natural language processing.',
    points: 400,
    timeLimit: 30,
    roundType: 'STANDARD',
    difficulty: 'HARD',
    hint: 'The title suggests that a specific mechanism is the only requirement.'
  },
  {
    id: 'ai_10',
    text: 'What is the theoretical stage of AI where a machine can perform any intellectual task a human can?',
    options: ['ANI', 'ASI', 'AGI', 'ALI'],
    correctAnswer: 2,
    explanation: 'Artificial General Intelligence (AGI) is a hypothetical level of AI that can perform any intellectual task as well as a human.',
    points: 500,
    timeLimit: 30,
    roundType: 'BUZZER',
    difficulty: 'HARD',
    hint: 'The "G" stands for General.'
  }
];

export const APP_CONFIG = {
  POLL_INTERVAL: 2000,
  BUZZER_COOLDOWN: 1000,
};
