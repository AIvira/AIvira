const positiveSignals = ['exemple', 'parce', 'donc', 'objectif', 'concept', 'méthode', 'solution', 'analyse'];

export function evaluateAnswer({ exercise, answer }) {
  const normalized = answer.toLowerCase();
  const lengthScore = Math.min(4, Math.floor(answer.trim().length / 70));
  const signalScore = positiveSignals.filter((signal) => normalized.includes(signal)).length;
  const structureScore = normalized.includes('exemple') && (normalized.includes('parce') || normalized.includes('car')) ? 2 : 0;
  const score = Math.max(1, Math.min(10, lengthScore + signalScore + structureScore));
  const strengths = [];
  const weaknesses = [];

  if (answer.length > 120) strengths.push('Réponse développée avec effort d’explication.');
  if (normalized.includes('exemple')) strengths.push('Présence d’un exemple concret.');
  if (normalized.includes('parce') || normalized.includes('car')) strengths.push('Justification explicite du raisonnement.');
  if (!strengths.length) strengths.push('Tu as tenté de répondre au problème posé.');

  if (answer.length < 120) weaknesses.push('Développer davantage les étapes du raisonnement.');
  if (!normalized.includes('exemple')) weaknesses.push('Ajouter un exemple concret pour ancrer la notion.');
  if (!normalized.includes('parce') && !normalized.includes('car')) weaknesses.push('Rendre la justification plus explicite.');

  return {
    score,
    strengths,
    weaknesses,
    feedback: score >= 7
      ? `Très bon travail : tu peux consolider en reliant ta réponse aux compétences ${exercise.expectedSkills.join(', ')}.`
      : `Réponse prometteuse : reprends la notion, ajoute un exemple et explique pourquoi ta solution répond à l’objectif.`
  };
}
