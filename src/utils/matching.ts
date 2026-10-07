import { UserProfile, MatchScoreResult } from '../types';

/**
 * Calculates a deterministic compatibility match score between the current user and a candidate.
 * Combines mutual skill overlap, availability, learning modes, and language synergy.
 */
export function calculateMatchScore(currentUser: UserProfile, candidate: UserProfile): MatchScoreResult {
  if (currentUser.id === candidate.id) {
    return {
      userId: candidate.id,
      user: candidate,
      score: 0,
      reasons: [],
      complementaryTeach: [],
      complementaryLearn: [],
      learningModeMatch: false,
      availabilityMatch: false,
      languageMatch: false,
    };
  }

  const userTeaches = (currentUser.skills || []).filter(s => s.type === 'teach').map(s => s.name.toLowerCase());
  const userWants = (currentUser.skills || []).filter(s => s.type === 'learn').map(s => s.name.toLowerCase());

  const candTeaches = (candidate.skills || []).filter(s => s.type === 'teach').map(s => s.name.toLowerCase());
  const candWants = (candidate.skills || []).filter(s => s.type === 'learn').map(s => s.name.toLowerCase());

  // Skills current user teaches that candidate wants to learn
  const matchedTeaches = userTeaches.filter(skill => candWants.some(w => w.includes(skill) || skill.includes(w)));
  // Skills candidate teaches that current user wants to learn
  const matchedWants = candTeaches.filter(skill => userWants.some(w => w.includes(skill) || skill.includes(w)));

  let score = 0;
  const reasons: string[] = [];

  // 1. Skill compatibility (Highest priority - up to 75 points)
  const isMutual = matchedTeaches.length > 0 && matchedWants.length > 0;
  if (isMutual) {
    score += 70;
    // Add additional points for multi-skill breadth
    score += Math.min(10, (matchedTeaches.length - 1 + matchedWants.length - 1) * 5);
  } else if (matchedTeaches.length > 0 || matchedWants.length > 0) {
    score += 40;
  } else {
    // Secondary keyword affinity fallback
    const sharedCategories = (currentUser.skills || []).some(s1 =>
      (candidate.skills || []).some(s2 => s1.category === s2.category)
    );
    if (sharedCategories) {
      score += 15;
    }
  }

  // 2. Learning Mode compatibility (up to 8 points)
  const modeMatch =
    currentUser.learningMode === 'both' ||
    candidate.learningMode === 'both' ||
    currentUser.learningMode === candidate.learningMode;

  if (modeMatch) {
    score += 8;
  }

  // 3. Availability compatibility (up to 10 points)
  const overlappingAvail = (currentUser.availability || []).filter(a =>
    (candidate.availability || []).includes(a)
  );
  const availabilityMatch = overlappingAvail.length > 0;
  if (availabilityMatch) {
    score += Math.min(10, overlappingAvail.length * 5);
  }

  // 4. Language compatibility (up to 7 points)
  const overlappingLang = (currentUser.languages || []).filter(l =>
    (candidate.languages || []).some(cl => cl.toLowerCase() === l.toLowerCase())
  );
  const languageMatch = overlappingLang.length > 0;
  if (languageMatch) {
    score += 7;
  }

  // Profile completeness & rating bonus
  if (candidate.rating >= 4.8) {
    score += 3;
  }
  if (candidate.completedSwapsCount > 3) {
    score += 2;
  }

  // Bound between 15% and 98%
  const finalScore = Math.min(98, Math.max(15, Math.round(score)));

  // Generate structured reasons
  if (matchedTeaches.length > 0) {
    const teachSkillName = (currentUser.skills || []).find(s => s.type === 'teach' && matchedTeaches.some(m => m === s.name.toLowerCase()))?.name || matchedTeaches[0];
    reasons.push(`You can teach ${teachSkillName}`);
    reasons.push(`${candidate.fullName.split(' ')[0]} wants to learn ${teachSkillName}`);
  }
  if (matchedWants.length > 0) {
    const wantSkillName = (candidate.skills || []).find(s => s.type === 'teach' && matchedWants.some(m => m === s.name.toLowerCase()))?.name || matchedWants[0];
    reasons.push(`${candidate.fullName.split(' ')[0]} can teach ${wantSkillName}`);
    reasons.push(`You want to learn ${wantSkillName}`);
  }
  if (modeMatch) {
    const modeDesc = candidate.learningMode === 'online' ? 'online sessions' : candidate.learningMode === 'in-person' ? 'in-person meetings' : 'flexible online/in-person';
    reasons.push(`You both prefer ${modeDesc}`);
  }
  if (overlappingAvail.length > 0) {
    reasons.push(`Available simultaneously on ${overlappingAvail.join(', ').toLowerCase()}`);
  }
  if (languageMatch) {
    reasons.push(`Both speak ${overlappingLang.join(', ')}`);
  }

  return {
    userId: candidate.id,
    user: candidate,
    score: finalScore,
    reasons,
    complementaryTeach: matchedTeaches,
    complementaryLearn: matchedWants,
    learningModeMatch: modeMatch,
    availabilityMatch,
    languageMatch,
  };
}
