/**
 * Edite aqui as pistas, respostas e textos do jogo — sem mudar a lógica da página.
 * Respostas de texto são comparadas com normalizeAnswer() (minúsculas, sem acentos).
 */

export type GamePhase = 'intro' | 'room1' | 'room2' | 'room3' | 'finale';

/** Remove acentos e padroniza para comparação. */
export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export const intro = {
  title: 'Antes de tudo…',
  body:
    'Esta página é um segredo só para alguns amigos. Se você chegou até aqui, é porque confiamos em você. Três salões te esperam — e no fim, uma surpresa.',
  cta: 'Entrar no primeiro salão',
};

export const room1 = {
  title: 'Salão I — A cidade do sonho',
  prompt:
    'Onde Yosha e Mark vão celebrar a lua de mel com gelato na Ponte Vecchio? (uma palavra, cidade)',
  hint: 'Começa com F e fica na Toscana.',
  /** Substitua por pistas reais; todas as variantes aceitas. */
  acceptedAnswers: ['florenca', 'florença'],
};

export const room2 = {
  title: 'Salão II — Duas terras',
  prompt: 'O amor deles atravessa dois lugares. Qual frase descreve melhor a história deles?',
  hint: 'Pense na lua de mel e no casamento no Brasil.',
  options: [
    { id: 'a', label: 'Florença na Itália e Florianópolis no Brasil' },
    { id: 'b', label: 'Roma e Paris' },
    { id: 'c', label: 'Veneza e São Paulo' },
  ] as const,
  correctId: 'a' as const,
};

export const room3 = {
  title: 'Salão III — O código',
  prompt:
    'Última porta: digite o código simbólico. (Dica dos salões: a inicial dos noivos em ordem alfabética, seguida da letra que começa a cidade da lua de mel — tudo junto, sem espaços.)',
  hint: 'Y vem antes de M; depois a primeira letra da cidade em Florença.',
  /** Placeholder: Y + M + F = YMF — ajuste se mudar as pistas acima. */
  acceptedAnswers: ['ymf'],
};

export const finale = {
  title: 'Você desvendou tudo',
  paragraphs: [
    'Obrigado por ter jogado com a gente — e por fazer parte da nossa história mesmo antes do grande dia.',
    'Convidamos você a ser um Guardião do Casamento: alguém especial que estará ao nosso lado para apoiar, animar e cuidar dos detalhes quando chegar a hora. É um papel de confiança e de carinho.',
    'Em breve falamos com você com mais detalhes. Até lá, guarda esse segredo com carinho.',
  ],
  signature: 'Com amor, Yosha & Mark',
};
