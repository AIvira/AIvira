const types = ['question ouverte', 'mise en situation', 'mini-diagnostic'];

export function generateExercise({ session }) {
  const chapter = session.plan.chapters[session.currentChapterIndex] || session.plan.chapters.at(-1);
  const attempt = session.completedExercises.length + 1;
  const type = types[(attempt + session.difficulty) % types.length];
  const complexity = session.difficulty <= 1 ? 'simple et guidée' : session.difficulty === 2 ? 'contextualisée' : 'complexe et transférable';

  return {
    id: `exercise-${Date.now()}`,
    chapter,
    difficulty: session.difficulty,
    exercise: `(${type}) Pour le chapitre « ${chapter.title} », réponds à cette consigne ${complexity} : explique un concept clé, donne un exemple concret, puis justifie comment il aide à atteindre l'objectif « ${chapter.objective} ».`,
    expectedSkills: chapter.skills,
    explanation: `Cet exercice vérifie ta capacité à ${chapter.skills.join(', ')} dans le contexte de ${session.topic}.`
  };
}
