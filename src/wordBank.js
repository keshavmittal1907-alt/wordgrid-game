export const WORD_BANK = [
  // Easy (5 points)
  { id: 1, word: "Tree", difficulty: "easy", points: 5 },
  { id: 2, word: "Dog", difficulty: "easy", points: 5 },
  { id: 3, word: "Sun", difficulty: "easy", points: 5 },
  { id: 4, word: "Car", difficulty: "easy", points: 5 },
  { id: 5, word: "Book", difficulty: "easy", points: 5 },
  // Medium (15 points)
  { id: 6, word: "Elevator", difficulty: "medium", points: 15 },
  { id: 7, word: "Cart", difficulty: "medium", points: 15 },
  { id: 8, word: "Branch", difficulty: "medium", points: 15 },
  { id: 9, word: "Pillow", difficulty: "medium", points: 15 },
  { id: 10, word: "Bridge", difficulty: "medium", points: 15 },
  // Hard (30 points)
  { id: 11, word: "Filthy", difficulty: "hard", points: 30 },
  { id: 12, word: "Quilt", difficulty: "hard", points: 30 },
  { id: 13, word: "Absurd", difficulty: "hard", points: 30 },
  { id: 14, word: "Ephemeral", difficulty: "hard", points: 30 },
  { id: 15, word: "Shrink", difficulty: "hard", points: 30 },
];

export const generateGameWords = () => {
  // Simple random selection for a 3x3 or 4x4 grid (e.g., 12 words)
  const shuffled = [...WORD_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 12).map(w => ({
    ...w,
    status: 'neutral' // 'neutral', 'correct', 'incorrect'
  }));
};
