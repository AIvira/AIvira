const levelDurations = { débutant: 35, intermédiaire: 45, avancé: 55 };

export function createLearningPlan({ topic, level }) {
  const cleanTopic = topic.trim();
  const chapters = [
    { title: `Fondations de ${cleanTopic}`, objective: 'Construire le vocabulaire et les principes essentiels.', skills: ['définir', 'identifier', 'relier'] },
    { title: `Méthodes et raisonnements`, objective: 'Appliquer les concepts à des situations guidées.', skills: ['appliquer', 'expliquer', 'comparer'] },
    { title: `Cas pratiques`, objective: 'Résoudre des problèmes réalistes avec justification.', skills: ['résoudre', 'argumenter', 'vérifier'] },
    { title: `Maîtrise autonome`, objective: 'Transférer les connaissances vers un nouveau contexte.', skills: ['synthétiser', 'critiquer', 'créer'] }
  ].map((chapter, index) => ({ id: `chapter-${index + 1}`, order: index + 1, ...chapter }));

  return {
    topic: cleanTopic,
    level,
    objectives: [`Comprendre ${cleanTopic}`, 'Progresser avec des exercices adaptatifs', 'Atteindre une maîtrise démontrable'],
    chapters,
    estimatedDuration: `${chapters.length * (levelDurations[level] || 40)} min`
  };
}
