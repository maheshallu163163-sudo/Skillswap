import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK with server-side API key
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Error initializing GoogleGenAI:', err);
  }
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// -------------------------------------------------------------
// 1. AI Match Explanation API
// -------------------------------------------------------------
app.post('/api/gemini/explain-match', async (req: Request, res: Response) => {
  try {
    const { currentUser, candidateUser, deterministicReasons } = req.body;

    if (!ai) {
      return res.json({
        explanation: `You and ${candidateUser.fullName} have complementary goals: you teach skills they want to learn, and they offer expertise in areas you're eager to develop. With compatible ${candidateUser.learningMode} availability, you can easily set up collaborative learning milestones.`,
        source: 'fallback',
      });
    }

    const prompt = `You are the matching intelligence engine for SkillSwap, a peer-to-peer skill exchange platform.
Explain in a warm, motivating, and concise manner (3 to 4 sentences maximum) why these two members are an exceptional skill match.

Person 1 (Current User):
Name: ${currentUser.fullName}
Can Teach: ${(currentUser.skills || []).filter((s: any) => s.type === 'teach').map((s: any) => `${s.name} (${s.experienceLevel})`).join(', ')}
Wants to Learn: ${(currentUser.skills || []).filter((s: any) => s.type === 'learn').map((s: any) => `${s.name} (${s.experienceLevel})`).join(', ')}
Learning Mode: ${currentUser.learningMode}
Availability: ${(currentUser.availability || []).join(', ')}

Person 2 (Match Candidate):
Name: ${candidateUser.fullName}
Can Teach: ${(candidateUser.skills || []).filter((s: any) => s.type === 'teach').map((s: any) => `${s.name} (${s.experienceLevel})`).join(', ')}
Wants to Learn: ${(candidateUser.skills || []).filter((s: any) => s.type === 'learn').map((s: any) => `${s.name} (${s.experienceLevel})`).join(', ')}
Learning Mode: ${candidateUser.learningMode}
Availability: ${(candidateUser.availability || []).join(', ')}

Deterministic Factors:
${(deterministicReasons || []).join('; ')}

Write directly to Person 1. Highlight the direct bilateral knowledge exchange, reciprocal value, and how their scheduling/mode preferences align.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const explanation = response.text || '';
    return res.json({ explanation, source: 'gemini' });
  } catch (error: any) {
    console.error('Gemini explain-match error:', error);
    return res.status(200).json({
      explanation: 'You two share complementary teaching and learning objectives! An ideal reciprocal partnership where both of you can level up together.',
      source: 'fallback-error',
    });
  }
});

// -------------------------------------------------------------
// 2. AI Learning Plan Generator
// -------------------------------------------------------------
app.post('/api/gemini/learning-plan', async (req: Request, res: Response) => {
  try {
    const { skillName, currentLevel, goal, hoursPerWeek, durationWeeks } = req.body;

    const weeksCount = durationWeeks || 4;
    const hours = hoursPerWeek || 5;

    if (!ai) {
      return res.json({
        overview: `A structured ${weeksCount}-week curriculum tailored for ${currentLevel} learners to achieve "${goal}" in ${skillName}.`,
        weeks: [
          {
            weekNumber: 1,
            title: `${skillName} Core Foundations`,
            topics: ['Core syntax & paradigms', 'Environment setup & essential tools', 'Fundamental building blocks'],
            practiceTasks: ['Complete hands-on playground exercises', 'Build a simple starter utility'],
            goals: 'Solidify foundational concepts and remove syntax friction.',
            estimatedHours: hours,
            sessionStructure: '30m theory review + 30m paired coding exercise',
          },
          {
            weekNumber: 2,
            title: 'Intermediate Concepts & Best Practices',
            topics: ['Design patterns & modularity', 'Handling asynchronous flows/state', 'Standard library mastery'],
            practiceTasks: ['Refactor Week 1 project with patterns', 'Solve 3 real-world mini-challenges'],
            goals: 'Write idiomatic, maintainable code with confidence.',
            estimatedHours: hours,
            sessionStructure: '20m code review + 40m feature implementation',
          },
          {
            weekNumber: 3,
            title: 'Real-world Application & Architecture',
            topics: ['Integrating APIs or data sources', 'Debugging techniques & performance', 'Testing fundamentals'],
            practiceTasks: ['Develop core feature of milestone project', 'Implement error boundaries and tests'],
            goals: 'Construct an end-to-end working module with guidance from your mentor.',
            estimatedHours: hours,
            sessionStructure: '15m Q&A + 45m live architectural pairing',
          },
          {
            weekNumber: 4,
            title: 'Capstone Project & Polish',
            topics: ['Deployment or presentation prep', 'Review against industry standards', 'Next steps for autonomy'],
            practiceTasks: ['Deliver completed capstone project', 'Give peer demonstration and receive review'],
            goals: 'Demonstrate tangible mastery of your target goal.',
            estimatedHours: hours,
            sessionStructure: '45m capstone review & feedback + 15m roadmap',
          },
        ],
        source: 'fallback',
      });
    }

    const prompt = `You are an expert curriculum designer on SkillSwap. Create a highly structured ${weeksCount}-week peer-learning curriculum.
Skill: ${skillName}
Current Level: ${currentLevel}
Target Goal: ${goal}
Time Commitment: ${hours} hours/week

Return ONLY valid JSON matching this schema without markdown codeblocks or backticks:
{
  "overview": "Brief 2-sentence summary of the curriculum roadmap",
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Week title",
      "topics": ["topic 1", "topic 2", "topic 3"],
      "practiceTasks": ["task 1", "task 2"],
      "goals": "Weekly milestone objective",
      "estimatedHours": ${hours},
      "sessionStructure": "Recommended 60-minute paired session agenda"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(raw);
    return res.json({ ...parsed, source: 'gemini' });
  } catch (error: any) {
    console.error('Gemini learning-plan error:', error);
    return res.status(500).json({ error: 'Failed to generate learning plan' });
  }
});

// -------------------------------------------------------------
// 3. AI Profile Bio Generator
// -------------------------------------------------------------
app.post('/api/gemini/generate-bio', async (req: Request, res: Response) => {
  try {
    const { fullName, skillsTeach, skillsLearn, experience, goals, style } = req.body;

    if (!ai) {
      const bio = `Passionate lifelong learner and mentor with a background in ${experience || 'technology'}. Eager to share practical insights in ${(skillsTeach || []).join(', ')} while collaborating with fellow creators to master ${(skillsLearn || []).join(', ')}. Let's connect and level up our skills together!`;
      return res.json({ bio, source: 'fallback' });
    }

    const prompt = `Write an engaging, authentic, and professional profile bio for a SkillSwap member.
Name: ${fullName || 'Member'}
Background / Experience: ${experience || 'Self-taught practitioner'}
Skills they can teach: ${(skillsTeach || []).join(', ')}
Skills they want to learn: ${(skillsLearn || []).join(', ')}
Learning Goals: ${goals || 'Collaborative growth'}
Tone: ${style || 'Friendly, professional, and encouraging'}

Constraints:
- Length: 2 to 3 sentences (40-75 words).
- First person ("I'm...").
- Highlight both what they bring to the table and their hunger to learn.
- No cheesy clichés. Return ONLY the plain text bio.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ bio: response.text?.trim() || '', source: 'gemini' });
  } catch (error: any) {
    console.error('Gemini bio error:', error);
    return res.status(200).json({
      bio: 'Enthusiastic creator and mentor excited to exchange real-world skills, solve challenging problems, and collaborate with great peers on SkillSwap.',
      source: 'fallback-error',
    });
  }
});

// -------------------------------------------------------------
// 4. AI Chat Assistant API
// -------------------------------------------------------------
app.post('/api/gemini/chat-assistant', async (req: Request, res: Response) => {
  try {
    const { action, draft, conversationContext, partnerName, targetLanguage } = req.body;

    if (!ai) {
      let result = draft || '';
      if (action === 'improve') result = `Hi ${partnerName || 'there'}! ${draft}. Looking forward to connecting and sharing what we know.`;
      if (action === 'suggest_reply') result = `Thanks for the update! That schedule sounds great for our session. I'll prepare some topics in advance.`;
      if (action === 'professional') result = `Hello ${partnerName || ''}. I would appreciate the opportunity to collaborate on our upcoming skill exchange. Please let me know your preferred time slot.`;
      if (action === 'friendly') result = `Hey ${partnerName || ''}! Really excited about this! Let's definitely team up soon 😊`;
      if (action === 'suggest_schedule') result = `Would you have 45–60 minutes open this Thursday or Saturday evening for our first 1-on-1 swap session?`;
      if (action === 'translate') result = draft;
      return res.json({ result, source: 'fallback' });
    }

    let instruction = '';
    switch (action) {
      case 'improve':
        instruction = `Rewrite the user's draft message to make it clearer, more engaging, and warmer for a skill swap peer. Draft: "${draft}"`;
        break;
      case 'suggest_reply':
        instruction = `Based on the latest chat context, generate a thoughtful, constructive reply from the user to ${partnerName || 'their swap partner'}. Context: ${JSON.stringify(conversationContext || [])}`;
        break;
      case 'professional':
        instruction = `Rewrite the following draft to have a polite, polished, and professional tone suitable for a professional exchange: "${draft}"`;
        break;
      case 'friendly':
        instruction = `Rewrite the following draft to make it casual, enthusiastic, and friendly: "${draft}"`;
        break;
      case 'suggest_schedule':
        instruction = `Draft a polite invitation message proposing to schedule a 45-60 minute learning session this week. Keep it adaptable.`;
        break;
      case 'translate':
        instruction = `Translate the following message into ${targetLanguage || 'Spanish'}. Return ONLY the translation: "${draft}"`;
        break;
      default:
        instruction = `Polish this message: "${draft}"`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: instruction,
    });

    return res.json({ result: response.text?.trim() || draft, source: 'gemini' });
  } catch (error: any) {
    console.error('Gemini chat assistant error:', error);
    return res.status(200).json({ result: req.body.draft || 'Sounds great, let us connect soon!', source: 'fallback-error' });
  }
});

// -------------------------------------------------------------
// 5. AI Conversation Starter API
// -------------------------------------------------------------
app.post('/api/gemini/conversation-starter', async (req: Request, res: Response) => {
  try {
    const { myName, partnerName, teachSkill, learnSkill } = req.body;

    if (!ai) {
      return res.json({
        starter: `Hi ${partnerName}! I noticed you're interested in learning ${teachSkill}. I'd love to help out! I also saw that you teach ${learnSkill}, which is exactly what I'm eager to learn. Would you be open to doing a weekly skill exchange?`,
        source: 'fallback',
      });
    }

    const prompt = `Write a polite, warm, and compelling conversation opener for a member on SkillSwap reaching out to a matched peer.
Sender: ${myName}
Recipient: ${partnerName}
Sender offers to teach: ${teachSkill}
Recipient offers to teach: ${learnSkill}

Keep it under 3 sentences. Express genuine interest in their skill and propose a collaborative exchange. Return only the message.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ starter: response.text?.trim() || '', source: 'gemini' });
  } catch (error: any) {
    console.error('Gemini conversation starter error:', error);
    return res.status(200).json({
      starter: `Hi ${req.body.partnerName || 'there'}! I'd love to exchange skills with you: I can help with ${req.body.teachSkill || 'my skills'}, and I'm very eager to learn ${req.body.learnSkill || 'your expertise'}. Would you like to connect?`,
      source: 'fallback-error',
    });
  }
});

// -------------------------------------------------------------
// 6. AI Skill Recommendations API
// -------------------------------------------------------------
app.post('/api/gemini/recommend-skills', async (req: Request, res: Response) => {
  try {
    const { currentSkills, desiredSkills, goals, careerInterests } = req.body;

    if (!ai) {
      return res.json({
        recommendations: [
          { name: 'TypeScript', category: 'Programming & Web Dev', reason: 'Pairs well with web engineering and full-stack development' },
          { name: 'Figma', category: 'UI/UX & Product Design', reason: 'Essential industry tool for UI prototyping and design systems' },
          { name: 'Prompt Engineering', category: 'AI & Machine Learning', reason: 'High-leverage capability for automating workflows with LLMs' },
          { name: 'Public Speaking', category: 'Communication & Speaking', reason: 'Amplifies leadership and technical presentation impact' },
        ],
        source: 'fallback',
      });
    }

    const prompt = `Recommend 4 high-value complementary skills for a learner on SkillSwap.
Current Skills: ${(currentSkills || []).join(', ')}
Skills they want to learn: ${(desiredSkills || []).join(', ')}
Goals: ${goals || 'Career growth and creative mastery'}
Interests: ${careerInterests || 'Modern digital product creation'}

Return ONLY valid JSON matching this schema:
{
  "recommendations": [
    {
      "name": "Skill Name",
      "category": "Category Name",
      "reason": "1-sentence reason why this is high leverage for them"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ ...parsed, source: 'gemini' });
  } catch (error: any) {
    console.error('Gemini recommend skills error:', error);
    return res.status(200).json({
      recommendations: [
        { name: 'TypeScript', category: 'Programming & Web Dev', reason: 'Adds strong typing to your frontend code' },
        { name: 'UI/UX Design', category: 'UI/UX & Product Design', reason: 'Helps turn engineering logic into intuitive user experiences' },
      ],
      source: 'fallback-error',
    });
  }
});

// -------------------------------------------------------------
// 7. AI Session Assistant (Summary, Takeaways, Homework)
// -------------------------------------------------------------
app.post('/api/gemini/summarize-session', async (req: Request, res: Response) => {
  try {
    const { skillName, teacherName, learnerName, notes, topicsCovered } = req.body;

    if (!ai) {
      return res.json({
        summary: `Productive peer-learning session in ${skillName || 'Applied Skills'} between ${teacherName || 'Teacher'} and ${learnerName || 'Learner'}. Practical hands-on examples were examined and core architectural fundamentals clarified.`,
        keyTakeaways: [
          'Deconstructed core mental models and avoided common anti-patterns',
          'Worked through live practical exercises and idiomatic syntax',
          'Identified key areas for asynchronous practice before the next session',
        ],
        practiceQuestions: [
          `How would you explain the core concept of ${skillName} in your own words?`,
          'What trade-offs should be evaluated when implementing this pattern in a production app?',
          'How does this approach optimize maintainability and performance?',
        ],
        homework: [
          'Build a mini-exercise applying today’s concepts',
          'Document two questions or edge cases encountered during self-study',
        ],
        nextTopics: [
          `Advanced ${skillName} optimizations`,
          'Integration with real-world APIs and external data',
        ],
        source: 'fallback',
      });
    }

    const prompt = `You are the AI Learning Assistant for SkillSwap.
A learning session has completed. Analyze the details and provide an educational review package.
Skill: ${skillName}
Teacher: ${teacherName}
Learner: ${learnerName}
Session Notes / Topics: ${notes || 'General paired session walkthrough'}
Topics Covered: ${(topicsCovered || []).join(', ')}

Return ONLY valid JSON matching this schema:
{
  "summary": "2-3 sentence overview of what was mastered",
  "keyTakeaways": ["key takeaway 1", "key takeaway 2", "key takeaway 3"],
  "practiceQuestions": ["practice question 1", "practice question 2", "practice question 3"],
  "homework": ["practical exercise 1", "practical exercise 2"],
  "nextTopics": ["suggested next topic 1", "suggested next topic 2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ ...parsed, source: 'gemini' });
  } catch (error: any) {
    console.error('Gemini summarize session error:', error);
    return res.status(200).json({
      summary: 'Collaborative peer swap session focused on core conceptual foundations and practical techniques.',
      keyTakeaways: ['Reinforced core paradigms', 'Paired debugging exercises completed'],
      practiceQuestions: ['What was the most challenging part of today’s exercise?'],
      homework: ['Refactor your code with modular structure'],
      nextTopics: ['Next level patterns'],
      source: 'fallback-error',
    });
  }
});

// -------------------------------------------------------------
// Dev & Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SkillSwap Full-Stack server running on port ${PORT} (Prod: ${isProd})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
