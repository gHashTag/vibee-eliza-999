/**
 * KOLS Plugin - Providers exports
 */

// KolsKnowledgeProvider - основной провайдер знаний (заменяет VibeCodingKnowledgeProvider)
export {
  KolsKnowledgeProvider,
  kolsKnowledgeProvider,
  kolsKnowledgeElizaProvider
} from './KolsKnowledgeProvider';

// KolsLearningProvider
export { kolsLearningProvider } from './KolsLearningProvider';

// VibeCodingKnowledgeProvider - deprecated, используйте KolsKnowledgeProvider
// export { VibeCodingKnowledgeProvider, vibeCodingKnowledgeProvider } from './VibeCodingKnowledgeProvider';
