import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearningPlan } from '../server/agents/learningPlanner.js';
import { generateExercise } from '../server/agents/exerciseGenerator.js';
import { evaluateAnswer } from '../server/agents/evaluator.js';
import { coachSession } from '../server/agents/pedagogicalCoach.js';

test('agent pipeline plans, generates, evaluates and coaches', () => {
  const plan = createLearningPlan({ topic: 'Fractions', level: 'débutant' });
  const session = { plan, topic: 'Fractions', currentChapterIndex: 0, difficulty: 1, completedExercises: [] };
  const exercise = generateExercise({ session });
  const evaluation = evaluateAnswer({ exercise, answer: 'Je définis le concept avec un exemple parce que cela explique la méthode et l’objectif de solution. Mon analyse relie les étapes.' });
  session.completedExercises.push({ exercise: exercise.exercise, chapter: exercise.chapter, difficulty: 1, evaluation });
  const decision = coachSession({ session });
  assert.equal(plan.chapters.length, 4);
  assert.ok(exercise.expectedSkills.length > 0);
  assert.ok(evaluation.score >= 1 && evaluation.score <= 10);
  assert.ok(['advance','repeat','simplify','increase_difficulty','review_previous_chapter'].includes(decision.decision));
});
