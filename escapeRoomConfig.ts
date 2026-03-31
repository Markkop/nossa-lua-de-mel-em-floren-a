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
  title: 'Missão Secreta',
  body:
    'Você acaba de receber uma missão secreta digna de poucos. Responda às nossas perguntas e receba um chamado.',
  cta: 'Entrar no primeiro salão',
};

export const room1 = {
  title: 'Salão I — O Chapéu Falante',
  prompt:
    'Quando você entra no primeiro salão, vê um chapéu e um mapa bem grande.\nEle diz: "Se você indicar corretamente o local onde tudo começou, eu lhe deixarei passar."',
  submitLabel: 'Apontar',
  /** Substitua por pistas reais; todas as variantes aceitas. */
  acceptedAnswers: ['udesc', 'didico', 'didicos', 'florianopolis', 'florianópolis', 'floripa'],
  /** Texto após acerto — confirma a resposta. */
  flavorText:
    '"Isso mesmo!" - responde o chapéu. "O local onde o primeiro olhar virou história foi em Floripa, em um bar chamado Didicos que ficava próximo da UDESC".\nVocê acena e abre a próxima porta.',
};

export const room2 = {
  title: 'Salão II — Um amor sob medida',
  prompt:
    'No segundo salão, você percebe que há dois manequins dos noivos exatamente na mesma altura.\nVocê percebe que pode regular a diferença de altura.\nPara quanto você ajusta?',
  options: [
    { id: 'a', label: '20 cm' },
    { id: 'b', label: '30 cm' },
    { id: 'c', label: '40 cm' },
  ] as const,
  correctId: 'c' as const,
  flavorText:
    'Ao ajustar o segundo manequim, você ouve um "click" e os manequins se abraçam, um na ponta dos pés e o outro com a coluna curvada.\nUma porta abre aos fundos.\nÉ chegado o desafio final.',
};

export const room3 = {
  title: 'Salão III — O código',
  prompt:
    'Após entrar pela terceira e última porta, você avista um boneco de pano bem no meio do salão.\nEle aparenta ser metade noivo e metade noiva.\nAo lado, um baú que só abre com um código.',
  submitLabel: 'Abrir o baú',
  acceptedAnswers: ['yoshark'],
  flavorText:
    'Você abre o baú e o salão se enche de coraçõezinhos.\nDentro há uma carta...',
};

export const finale = {
  title: 'Você agora é um Guardião!',
  /** Abertura da carta (acima do bloco “Faremos check-in…”). */
  opening:
    'Olá, queridos! Estamos muito ansiosos, o dia está chegando!! Decidimos criar o grupo para já começarmos a nos organizar para este fim de semana tão especial.',
  /** Check-in / calendário — entre a abertura e o calendário; “Vocês são…” vem depois do calendário. */
  scheduleIntro:
    'Faremos check-in no dia 17 de abril (sexta-feira, que inclusive é aniversário do noivo) às 14h e check-out no dia 19 de abril (domingo) às 18h. Estamos planejando um cronograma para aproveitarmos ao máximo esses dias, quando o tivermos, mandaremos para vocês. Segue uma prévia:',
  /** Continuação após o calendário. */
  paragraphs: [
    'Vocês são pessoas muito especiais nas nossas vidas. Dos 100 convidados que estarão no dia da festa todos vocês foram escolhidos a dedo para estarem conosco no fim de semana e por esse motivo decidimos chamá-los de ✨GUARDIÕES✨.',
    'Sim, agora vocês têm um título hahaha. Não teremos os padrinhos tradicionais no nosso casamento, mas teremos os ✨GUARDIÕES✨, que são vocês, pessoas que fazem parte da nossa vida, acompanharam nosso relacionamento de pertinho e torcem por nós, vocês são muito importantes para nossas vidas individuais e juntos.',
    '✨GUARDIÕES✨, vocês têm a missão na festa de casamento de se divertirem MUITO e pedimos para que vocês possam ser as pessoas que estarão lá para nos ajudar em qualquer imprevisto. Durante nossa vida como casal esperamos continuar tendo vocês por perto sempre com muito amor, respeito e joguinhos, queremos acompanhar os passos de vocês e que vocês acompanhem os nossos.',
    'Agradecemos por tudo e amamos vocês, nossos ✨GUARDIÕES✨.',
    'Se você chegou até aqui, você completou a missão, mande uma "✨" no grupo e não diga mais nada hihi.',
  ],
  signature: 'Com amor Yosha e Mark.',
};
