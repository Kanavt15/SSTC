const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Chatbot endpoint - Notes summarizer
router.post('/summarize', auth, async (req, res) => {
  try {
    const { text, mode = 'summarize' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // Simple rule-based summarization for demo
    // In production, integrate with Gemini API or other LLM
    let response;

    if (mode === 'summarize') {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const keyLength = Math.max(3, Math.ceil(sentences.length * 0.3));
      const summary = sentences.slice(0, keyLength).join(' ');
      response = {
        type: 'summary',
        content: summary.trim(),
        wordCount: text.split(/\s+/).length,
        summaryWordCount: summary.split(/\s+/).length,
        reductionPercent: Math.round((1 - summary.split(/\s+/).length / text.split(/\s+/).length) * 100)
      };
    } else if (mode === 'keypoints') {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const keyPoints = sentences
        .filter((s, i) => i === 0 || s.length > 30)
        .slice(0, 7)
        .map(s => `• ${s.trim()}`);
      response = {
        type: 'keypoints',
        content: keyPoints.join('\n'),
        totalPoints: keyPoints.length
      };
    } else if (mode === 'explain') {
      response = {
        type: 'explanation',
        content: `Here's a simplified explanation:\n\n${text.substring(0, 500)}...\n\n**Key Takeaway:** This content covers the main concepts discussed in the provided text. For a more detailed analysis, consider reviewing the full notes.`
      };
    } else if (mode === 'quiz') {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      const questions = sentences.slice(0, 5).map((s, i) => {
        const words = s.trim().split(/\s+/);
        const blankIndex = Math.floor(words.length / 2);
        const answer = words[blankIndex];
        words[blankIndex] = '______';
        return { question: `Q${i + 1}: Fill in the blank: ${words.join(' ')}`, answer };
      });
      response = {
        type: 'quiz',
        content: questions.map(q => q.question).join('\n\n'),
        answers: questions.map(q => q.answer),
        totalQuestions: questions.length
      };
    } else {
      response = {
        type: 'chat',
        content: 'I can help you with:\n• **Summarize** - Get a concise summary of your notes\n• **Key Points** - Extract important points\n• **Explain** - Simplify complex topics\n• **Quiz** - Generate practice questions\n\nPaste your notes text and choose a mode!'
      };
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Chat with bot
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMsg = message.toLowerCase();

    let response;

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      response = "Hello! 👋 I'm the KJSIT Connect Bot. I can help you with:\n\n📝 **Summarize Notes** - Paste your notes and I'll create a summary\n📋 **Key Points** - Extract important bullet points\n🎓 **Explain Topics** - Simplify complex concepts\n📊 **Generate Quiz** - Create practice questions\n\nHow can I help you today?";
    } else if (lowerMsg.includes('summarize') || lowerMsg.includes('summary')) {
      response = "Sure! To summarize your notes, please use the **Summarize** mode and paste your notes text in the input box. I'll create a concise summary for you! 📝";
    } else if (lowerMsg.includes('quiz') || lowerMsg.includes('question')) {
      response = "Want to test your knowledge? Use the **Quiz** mode and paste your study material. I'll generate practice questions for you! 📊";
    } else if (lowerMsg.includes('help') || lowerMsg.includes('what can you do')) {
      response = "I'm here to make your study life easier! Here's what I can do:\n\n1. 📝 **Summarize** long notes into key paragraphs\n2. 📋 **Extract Key Points** from any material\n3. 🎓 **Explain** complex topics in simple language\n4. 📊 **Generate Quizzes** from your notes\n5. 💬 Answer your questions about using KJSIT Connect\n\nJust ask away!";
    } else if (lowerMsg.includes('department') || lowerMsg.includes('branch')) {
      response = "KJSIT has 4 departments:\n\n🤖 **AI & Data Science (AIDS)** - Artificial Intelligence & Data Science\n💻 **Computer Science (COMPS)** - Computer Engineering\n🌐 **Information Technology (IT)** - Information Technology\n📡 **EXTC** - Electronics & Telecommunication\n\nYou can join department-wise chat rooms to connect with peers!";
    } else {
      response = "I understand you're asking about: \"" + message + "\"\n\nI'm currently best at:\n• Summarizing study notes\n• Extracting key points\n• Generating practice quizzes\n\nTry pasting some notes and using one of the modes above! 🎯";
    }

    res.json({ role: 'assistant', content: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
