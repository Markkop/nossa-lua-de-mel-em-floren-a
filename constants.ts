
import { GiftOption } from './types';

export const DOMAINS = {
  root: 'https://yoshaemark.com',
  presentes: 'https://presentes.yoshaemark.com',
  hospedagem: 'https://hospedagem.yoshaemark.com',
  karaoke: 'https://karaoke.yoshaemark.com',
};

export const GIFT_OPTIONS: GiftOption[] = [
  {
    id: 1,
    title: "Gelatos na Ponte Vecchio",
    description: "Um momento doce e refrescante em Florença.",
    amount: 50,
    imageUrl: "https://plus.unsplash.com/premium_photo-1661963277538-195c9d6b698b?q=80&w=2703&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    gallery: [
      {
        imageUrl: "https://images.unsplash.com/photo-1722141230743-f691370fdb01?q=80&w=2075&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Em uma das nossas tardes em Florença, vamos experimentar um clássico italiano: o Gelato!",
        emoji: "🤤"
      },
      {
        imageUrl: "https://plus.unsplash.com/premium_photo-1683147864503-e96f9b30db56?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Vamos até uma boa gelataria e pedir um para cada. Sua contribuição faz parte desse momento doce! <3",
        emoji: "🍦"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1543429257-2d5f563eb7dd?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Ficaremos até o pôr do sol saboreando essa experiência sem pressa.",
        emoji: "❤️"
      }
    ]
  },
  {
    id: 2,
    title: "Entrada para o Jardim de Boboli",
    description: "Um passeio romântico pelos jardins renascentistas repletos de esculturas e fontes.",
    amount: 100,
    imageUrl: "https://images.unsplash.com/photo-1713183236640-cddc3a9e96dd?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    gallery: [
      {
        imageUrl: "https://images.unsplash.com/photo-1683634059556-0116c3f28d82?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Vamos subir as colinas atrás do Palácio Pitti para conhecer os jardins mais famosos da cidade.",
        emoji: "🏛️"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1587250692642-7239fefcda22?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Vamos caminhar entre as estátuas e labirintos. Sua contribuição nos ajuda a conhecer esse refúgio verde.",
        emoji: "🌳"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1527353574138-c0324b9b66c8?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Depois é só relaxar na grama e curtir o silêncio e a paz desse lugar histórico.",
        emoji: "💕"
      }
    ]
  },
  {
    id: 3,
    title: "Jantar em uma Trattoria Típica",
    description: "Uma autêntica experiência gastronômica toscana com massas frescas e muito carinho.",
    amount: 250,
    imageUrl: "https://images.unsplash.com/photo-1625300064269-637cf8bf6ed0?q=80&w=1473&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    gallery: [
      {
        imageUrl: "https://images.unsplash.com/photo-1497397854478-0ec8e14e8096?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Quando a noite cair, vamos procurar uma daquelas portinhas charmosas escondidas nas ruelas.",
        emoji: "🚪"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1574969903809-3f7a1668ceb0?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Hora de pedir uma massa fresca e um vinho. Sua contribuição faz parte desse banquete toscano!",
        emoji: "🍝"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1642487593848-8812c1c08a50?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Sairemos de lá felizes e prontos para uma caminhada romântica sob a luz da lua.",
        emoji: "🌙"
      }
    ]
  },
  {
    id: 4,
    title: "Passeio de Barco no Rio Arno",
    description: "Ver o pôr do sol sob as pontes de Florença navegando suavemente pelo rio.",
    amount: 500,
    imageUrl: "https://images.unsplash.com/photo-1566209836870-ad84bf612155?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    gallery: [
      {
        imageUrl: "https://images.unsplash.com/photo-1639735494408-b70aae46e676?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Vamos descer até as margens do rio para encontrar o barco tradicional que faz o passeio pelas pontes.",
        emoji: "🌊"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1639735496037-45187df855d0?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Navegaremos devagar passando por baixo da Ponte Vecchio. Sua contribuição torna esse passeio possível!",
        emoji: "🚣"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1633529974768-0f501fbd510a?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "A vista da cidade das águas é outra coisa, um momento perfeito pra guardar na memória.",
        emoji: "🥰"
      }
    ]
  },
  {
    id: 5,
    title: "Tour de Vinhos em Chianti",
    description: "Um dia inteiro explorando as colinas da Toscana e degustando os melhores vinhos da região.",
    amount: 1000,
    imageUrl: "https://images.unsplash.com/photo-1760372055346-6eeb72076946?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    gallery: [
      {
        imageUrl: "https://images.unsplash.com/photo-1715270760965-e75c9ff7c92f?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Pegaremos a estrada rumo às colinas carregadas de parreiras que ficam logo ali ao lado de Florença.",
        emoji: "🍇"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80&w=1200",
        caption: "Vamos visitar uma vinícola familiar. Sua contribuição faz parte dessa experiência com degustação e queijos locais!",
        emoji: "🍷"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1732294888497-dfdd2379fefa?q=80&w=1476&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Voltaremos com o coração quente e muita história pra contar sobre os vinhos da região.",
        emoji: "🥰"
      }
    ]
  },
  {
    id: 6,
    title: "Noite de Gala com Vista para o Duomo",
    description: "Uma estadia inesquecível em um hotel boutique com a cúpula de Brunelleschi em nossa janela.",
    amount: 2000,
    imageUrl: "https://plus.unsplash.com/premium_photo-1661962743075-4f3df12cda88?q=80&w=2746&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    gallery: [
      {
        imageUrl: "https://images.unsplash.com/photo-1675409145919-277c0fc2aa7d?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Depois de tanto bater perna, tudo o que queremos é chegar num lugar confortável e abrir a cortina.",
        emoji: "😌"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1609534104699-203fe3de45e1?q=80&w=2076&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Imagine abrir a janela e dar de cara com o Duomo. Sua contribuição nos ajuda a realizar essa estadia especial!",
        emoji: "🏨"
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1731844737686-0165a586cf06?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        caption: "Nada supera o sentimento de acordar e dormir olhando para o cartão postal de Florença.",
        emoji: "❤️"
      }
    ]
  }
];
