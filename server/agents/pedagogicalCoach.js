export function coachSession({ session }) {
  const history = session.completedExercises;
  const last = history.at(-1);
  const recent = history.slice(-3).map((item) => item.evaluation.score);
  const average = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  let decision = 'repeat';
  let reason = 'Le coach attend davantage de preuves de maîtrise.';
  let nextChapter = session.currentChapterIndex;
  let nextDifficulty = session.difficulty;

  if (last?.evaluation.score >= 8 && average >= 7.5) {
    decision = session.currentChapterIndex < session.plan.chapters.length - 1 ? 'advance' : 'increase_difficulty';
    reason = 'Les dernières réponses montrent une maîtrise suffisante pour avancer automatiquement.';
    nextChapter = Math.min(session.currentChapterIndex + 1, session.plan.chapters.length - 1);
    nextDifficulty = Math.min(session.difficulty + 1, 5);
  } else if (last?.evaluation.score <= 4) {
    decision = session.difficulty > 1 ? 'simplify' : 'review_previous_chapter';
    reason = 'Des lacunes récurrentes nécessitent une remédiation guidée avant de continuer.';
    nextChapter = decision === 'review_previous_chapter' ? Math.max(session.currentChapterIndex - 1, 0) : session.currentChapterIndex;
    nextDifficulty = Math.max(session.difficulty - 1, 1);
  } else if (last?.evaluation.score >= 6) {
    decision = 'repeat';
    reason = 'La compréhension progresse, mais un second exercice consolidera le chapitre.';
  }

  return {
    decision,
    reason,
    nextChapter,
    nextDifficulty,
    recommendations: [
      'Relire le feedback avant le prochain exercice.',
      'Formuler une réponse avec définition, exemple et justification.',
      decision === 'advance' ? 'Préparer le chapitre suivant.' : 'Consolider la notion ciblée.'
    ]
  };
}
