import { UserProfile, LearningPlanWeek } from '../types';

export interface ExplainMatchResponse {
  explanation: string;
  source: string;
}

export interface LearningPlanResponse {
  overview: string;
  weeks: LearningPlanWeek[];
  source: string;
}

export interface RecommendedSkill {
  name: string;
  category: string;
  reason: string;
}

export class GeminiService {
  /**
   * Explain why two users are an exceptional skill match
   */
  static async explainMatch(
    currentUser: UserProfile,
    candidateUser: UserProfile,
    deterministicReasons: string[]
  ): Promise<string> {
    try {
      const res = await fetch('/api/gemini/explain-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUser, candidateUser, deterministicReasons }),
      });
      const data = await res.json();
      return data.explanation || 'You share reciprocal skills and matching availability for an ideal learning partnership!';
    } catch (err) {
      console.error('Error fetching explainMatch:', err);
      return `You and ${candidateUser.fullName} have complementary knowledge goals: you offer skills they are looking for, and they specialize in skills you want to learn. With matching ${candidateUser.learningMode} availability, you can make fast collaborative progress!`;
    }
  }

  /**
   * Generate a 4-week structured learning plan
   */
  static async generateLearningPlan(params: {
    skillName: string;
    currentLevel: string;
    goal: string;
    hoursPerWeek: number;
    durationWeeks: number;
  }): Promise<LearningPlanResponse> {
    try {
      const res = await fetch('/api/gemini/learning-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error generating learning plan:', err);
      throw err;
    }
  }

  /**
   * Generate an engaging personal profile bio
   */
  static async generateProfileBio(params: {
    fullName: string;
    skillsTeach: string[];
    skillsLearn: string[];
    experience: string;
    goals: string;
    style?: string;
  }): Promise<string> {
    try {
      const res = await fetch('/api/gemini/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data.bio || '';
    } catch (err) {
      console.error('Error generating bio:', err);
      return `Passionate lifelong learner and practitioner in ${params.experience || 'technology'}. Excited to exchange hands-on knowledge in ${(params.skillsTeach || []).join(', ')} while collaborating with peers to learn ${(params.skillsLearn || []).join(', ')}.`;
    }
  }

  /**
   * AI Chat Assistant actions:
   * improve | suggest_reply | professional | friendly | suggest_schedule | translate
   */
  static async assistantAction(params: {
    action: 'improve' | 'suggest_reply' | 'professional' | 'friendly' | 'suggest_schedule' | 'translate';
    draft?: string;
    conversationContext?: any[];
    partnerName?: string;
    targetLanguage?: string;
  }): Promise<string> {
    try {
      const res = await fetch('/api/gemini/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data.result || params.draft || '';
    } catch (err) {
      console.error('Error with chat assistant:', err);
      return params.draft || 'Looking forward to our upcoming learning session!';
    }
  }

  /**
   * Generate conversation opener
   */
  static async generateConversationStarter(params: {
    myName: string;
    partnerName: string;
    teachSkill: string;
    learnSkill: string;
  }): Promise<string> {
    try {
      const res = await fetch('/api/gemini/conversation-starter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data.starter || '';
    } catch (err) {
      console.error('Error generating starter:', err);
      return `Hi ${params.partnerName}! I saw that you want to learn ${params.teachSkill}, which I specialize in. I'm very excited to learn ${params.learnSkill} from you as well. Would you be open to a weekly skill swap?`;
    }
  }

  /**
   * Recommend complementary skills
   */
  static async recommendSkills(params: {
    currentSkills: string[];
    desiredSkills: string[];
    goals: string;
    careerInterests?: string;
  }): Promise<RecommendedSkill[]> {
    try {
      const res = await fetch('/api/gemini/recommend-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data.recommendations || [];
    } catch (err) {
      console.error('Error recommending skills:', err);
      return [
        { name: 'TypeScript', category: 'Programming & Web Dev', reason: 'Adds rock-solid type safety to your code' },
        { name: 'Figma', category: 'UI/UX & Product Design', reason: 'Turn wireframes into clean design systems' },
        { name: 'Prompt Engineering', category: 'AI & Machine Learning', reason: 'Automate tasks with modern LLMs' },
      ];
    }
  }

  /**
   * Summarize completed learning session & generate homework/takeaways
   */
  static async summarizeSession(params: {
    skillName: string;
    teacherName: string;
    learnerName: string;
    notes?: string;
    topicsCovered?: string[];
  }): Promise<{
    summary: string;
    keyTakeaways: string[];
    practiceQuestions: string[];
    homework: string[];
    nextTopics: string[];
  }> {
    try {
      const res = await fetch('/api/gemini/summarize-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return {
        summary: data.summary || 'Insightful paired learning session completed.',
        keyTakeaways: data.keyTakeaways || ['Explored core patterns', 'Practical paired exercise completed'],
        practiceQuestions: data.practiceQuestions || ['How would you apply this in a real project?'],
        homework: data.homework || ['Review notes and build a small test component'],
        nextTopics: data.nextTopics || ['Architecture patterns'],
      };
    } catch (err) {
      console.error('Error summarizing session:', err);
      return {
        summary: `Productive session in ${params.skillName} covering hands-on examples and best practices.`,
        keyTakeaways: ['Deepened understanding of core fundamentals', 'Walked through real-world exercises'],
        practiceQuestions: ['What trade-offs did you observe today?'],
        homework: ['Complete the practice challenge'],
        nextTopics: ['Next milestone topics'],
      };
    }
  }
}
