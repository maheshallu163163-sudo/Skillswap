import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'],
    });
  } catch (err) {
    // Graceful fallback if canvas is not supported in environment
    console.log('Confetti triggered', err);
  }
}
