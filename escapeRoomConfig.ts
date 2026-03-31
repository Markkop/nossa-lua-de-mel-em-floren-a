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
  title: 'Salão I — Onde tudo começou',
  prompt: 'Onde Yosha e Mark se conheceram?',
  /** Substitua por pistas reais; todas as variantes aceitas. */
  acceptedAnswers: ['udesc', 'didico', 'didicos', 'florianopolis', 'florianópolis', 'floripa'],
  /** Texto após acerto — confirma a resposta. */
  flavorText:
    'Foi no Didicos, um bar próximo à UDESC, em Floripa onde o primeiro olhar virou história.',
};

export const room2 = {
  title: 'Salão II — Um amor sob medida',
  prompt: 'Quantos centímetros Yosha e Mark têm de diferença?',
  options: [
    { id: 'a', label: '20 cm' },
    { id: 'b', label: '30 cm' },
    { id: 'c', label: '40 cm' },
  ] as const,
  correctId: 'c' as const,
  flavorText: 'E o nosso amor é gigante e do mesmo tamanho!',
};

export const room3 = {
  title: 'Salão III — O código',
  prompt: 'Última porta: digite o nosso nome de ship (juntos)',
  acceptedAnswers: ['yoshark'],
  flavorText: 'Yosha + Mark 😜',
};

export const finale = {
  title: 'Você agora é um Guardião!',
  /** Abertura da carta (acima do bloco “Faremos check-in…”). */
  opening:
    'Olá queridos! Estamos muito ansiosos, o dia está chegando!! Decidimos criar o grupo para já começarmos a nos organizar para este fim de semana tão especial.',
  /** Check-in / calendário — entre a abertura e o calendário; “Vocês são…” vem depois do calendário. */
  scheduleIntro:
    'Faremos check-in no dia 17 de abril (sexta-feira, que inclusive é aniversário do Noivo) às 14h e check-out no dia 19 de abril (domingo) às 18h. Estamos planejando um cronograma para aproveitarmos ao máximo esses dias, quando o tivermos mandaremos para vocês. Segue uma prévia:',
  /** Continuação após o calendário. */
  paragraphs: [
    'Vocês são pessoas muito especiais nas nossas vidas. Dos 100 convidados que estarão no dia da festa vocês todos foram escolhidos a dedo para estarem conosco no fim de semana e por esse motivo decidimos chamá-los de ✨GUARDIÕES✨.',
    'Sim, agora vocês tem um título hahaha. Não teremos os padrinhos tradicionais no nosso casamento, mas teremos os ✨GUARDIÕES✨, que são vocês, pessoas que fazem parte da nossa vida, acompanharam nosso relacionamento de pertinho e torcem por nós, vocês são muito importantes para nossas vidas individuais e juntos.',
    '✨GUARDIÕES✨, vocês tem a missão na festa de casamento de se divertirem MUITO e pedimos para que vocês possam ser as pessoas que estarão lá para nos ajudar em qualquer imprevisto. Durante nossa vida como casal esperamos continuar tendo vocês por perto sempre com muito amor, respeito e joguinhos, queremos acompanhar os passos de vocês e que vocês acompanhem os nossos.',
    'Agradecemos por tudo e amamos vocês, nossos ✨GUARDIÕES✨.',
    'Se você chegou até aqui, você completou a missão, mande uma "✨" no grupo e não diga mais nada hihi.',
  ],
  signature: 'Com amor Yosha e Mark.',
};
