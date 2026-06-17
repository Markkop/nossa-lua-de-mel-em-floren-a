import React, { useEffect } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Gift,
  Globe2,
  HandCoins,
  HeartHandshake,
  Hotel,
  Mail,
  MapPinned,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

type Plan = {
  name: string;
  price: string;
  label: string;
  description: string;
  highlights: string[];
  bestFor: string;
  recommended?: boolean;
};

type Feature = {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent: string;
};

type AddOn = {
  name: string;
  price: string;
  description: string;
};

const plans: Plan[] = [
  {
    name: 'Essencial',
    price: 'R$ 790',
    label: 'Convite digital premium',
    description: 'Uma página elegante para reunir as informações que todo convidado precisa acessar rápido.',
    highlights: [
      'Landing page one-page com fotos do casal',
      'Data, local, horário, dress code e links úteis',
      'Mapa simples e instruções de chegada',
      'Site ativo por 6 meses',
      '1 rodada de ajustes',
    ],
    bestFor: 'Casais que querem sair do convite estático sem contratar um portal completo.',
  },
  {
    name: 'Completo',
    price: 'R$ 1.900',
    label: 'Experiência dos convidados',
    description: 'O pacote principal: site sob medida com logística, presentes via Pix e conteúdo organizado.',
    highlights: [
      'Tudo do Essencial',
      'Página detalhada do evento e FAQ',
      'Hospedagens recomendadas com tabela comparativa',
      'Mapa interativo para localização e deslocamento',
      'Lista de presentes via Pix direto, sem taxa por presente',
      'Domínio configurado e site ativo por 12 meses',
      'Até 3 rodadas de ajustes',
    ],
    bestFor: 'Casamentos com convidados de fora, destination wedding ou muitas informações para centralizar.',
    recommended: true,
  },
  {
    name: 'Premium',
    price: 'R$ 3.900',
    label: 'Antes e depois do casamento',
    description: 'Uma experiência digital mais completa, com acabamento visual avançado e galeria pós-evento.',
    highlights: [
      'Tudo do Completo',
      'Design mais avançado com microinterações',
      'Identidade visual digital leve',
      'Galeria pós-casamento protegida por senha',
      'Download das fotos para convidados',
      'Seção de agradecimento pós-evento',
      'Manutenção até 3 meses depois do casamento',
    ],
    bestFor: 'Casais que querem uma entrega boutique, bonita antes do evento e útil depois dele.',
  },
];

const differentiators: Feature[] = [
  {
    title: 'Pix direto para o casal',
    body: 'A lista de presentes pode enviar o valor direto para a conta do casal, sem intermediar pagamento e sem taxa percentual sobre cada presente.',
    icon: HandCoins,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Logística de verdade',
    body: 'Hospedagens, mapa, deslocamento, roteiro do fim de semana e FAQ entram como parte da experiência, não como nota de rodapé.',
    icon: MapPinned,
    accent: 'bg-sky-50 text-sky-700',
  },
  {
    title: 'Design sob medida',
    body: 'Fotos, cores, tom e hierarquia visual são pensados para o casal, em vez de partir de um template genérico difícil de adaptar.',
    icon: Palette,
    accent: 'bg-rose-50 text-rose-700',
  },
  {
    title: 'Valor depois da festa',
    body: 'A galeria protegida por senha transforma o site em ponto de entrega das fotos, com acesso simples para convidados.',
    icon: Camera,
    accent: 'bg-amber-50 text-amber-700',
  },
];

const deliverables: Feature[] = [
  {
    title: 'Landing page do casal',
    body: 'Abertura emocional, fotos, história curta, data, local e informações essenciais.',
    icon: HeartHandshake,
    accent: 'bg-rose-50 text-rose-700',
  },
  {
    title: 'Página do evento',
    body: 'Local, horários, dress code, orientações, links de navegação e respostas rápidas.',
    icon: CalendarDays,
    accent: 'bg-indigo-50 text-indigo-700',
  },
  {
    title: 'Hospedagem e mapa',
    body: 'Recomendações organizadas, tabela comparativa e mapa interativo para convidados.',
    icon: Hotel,
    accent: 'bg-sky-50 text-sky-700',
  },
  {
    title: 'Lista de presentes Pix',
    body: 'Presentes simbólicos, QR Code e Pix copia-e-cola direto para a conta informada.',
    icon: Gift,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Galeria protegida',
    body: 'Área pós-casamento com senha mestra para visualizar e baixar fotos.',
    icon: ShieldCheck,
    accent: 'bg-violet-50 text-violet-700',
  },
  {
    title: 'Convidados como add-on',
    body: 'RSVP e gerenciador de convidados podem entrar como extra, sem virar o núcleo do produto.',
    icon: Users,
    accent: 'bg-orange-50 text-orange-700',
  },
];

const addOns: AddOn[] = [
  {
    name: 'RSVP simples',
    price: 'R$ 300 a R$ 700',
    description: 'Formulário de confirmação e planilha/base para acompanhar respostas.',
  },
  {
    name: 'Gerenciador de convidados',
    price: 'R$ 800 a R$ 2.000',
    description: 'Fluxo mais completo para organizar convidados, famílias e confirmação.',
  },
  {
    name: 'Página bilíngue',
    price: '+30% a +60%',
    description: 'Versão em outro idioma para casamentos com convidados internacionais.',
  },
  {
    name: 'Galeria avulsa',
    price: 'R$ 900 a R$ 1.500',
    description: 'Entrega pós-evento protegida por senha, mesmo para quem contratou outro pacote.',
  },
  {
    name: 'Convite digital animado',
    price: 'R$ 400 a R$ 1.200',
    description: 'Uma abertura animada e compartilhável para WhatsApp e redes sociais.',
  },
  {
    name: 'Manutenção estendida',
    price: 'R$ 150 a R$ 400/ano',
    description: 'Renovação opcional para manter o site ou a galeria ativos por mais tempo.',
  },
];

const competitors = [
  'Portais oferecem site grátis, mas costumam monetizar domínio, planos premium e taxa sobre presentes.',
  'Builders genéricos dão liberdade visual, mas deixam RSVP, Pix, hospedagem e pós-casamento por conta do casal.',
  'Projeto sob medida vale quando o casal quer acabamento, curadoria e menos trabalho operacional.',
];

const processSteps = [
  '50% para iniciar e reservar agenda',
  '30% na primeira versão navegável',
  '20% na publicação',
  'Hospedagem inclusa conforme pacote, com renovação opcional',
];

const formatSubject = (subject: string) => encodeURIComponent(subject);

const planHref = (planName: string) =>
  `mailto:me@markkop.dev?subject=${formatSubject(`Quero conversar sobre o pacote ${planName}`)}`;

const SectionIntro: React.FC<{
  eyebrow: string;
  title: string;
  body?: string;
  align?: 'left' | 'center';
}> = ({ eyebrow, title, body, align = 'left' }) => (
  <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
    <p className="text-sm font-bold uppercase tracking-normal text-[#8b4d3e]">{eyebrow}</p>
    <h2 className="mt-3 font-serif text-4xl leading-tight text-[#241915] md:text-5xl">{title}</h2>
    {body && <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">{body}</p>}
  </div>
);

const FeatureTile: React.FC<{ feature: Feature }> = ({ feature }) => {
  const Icon = feature.icon;

  return (
    <article className="rounded-lg border border-[#eadfd5] bg-white p-5 shadow-sm">
      <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg ${feature.accent}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h3 className="font-serif text-2xl text-[#241915]">{feature.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{feature.body}</p>
    </article>
  );
};

const WeddingSitePlansPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Markkop Dev | Site de casamento sob medida';
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#241915]">
      <header className="relative min-h-[88dvh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2200&auto=format&fit=crop"
            alt="Mesa de casamento com flores, velas e taças"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1b110e]/90 via-[#1b110e]/65 to-[#6f3a47]/25" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#fbfaf6] to-transparent" />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
          <a href="/" className="font-serif text-2xl text-white">
            Markkop Dev
          </a>
          <a
            href="mailto:me@markkop.dev?subject=Quero%20um%20site%20de%20casamento"
            className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white hover:text-[#241915]"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Conversar
          </a>
        </nav>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-5 pb-24 pt-16 md:px-8 md:pt-24">
          <div className="max-w-3xl animate-fadeIn">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-normal text-white backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-[#ffd8a8]" aria-hidden="true" />
              Site boutique para casamento
            </div>
            <h1 className="max-w-3xl font-serif text-5xl leading-none text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)] md:text-7xl">
              Um site com cara de casamento, não de formulário.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 md:text-xl">
              Site sob medida para centralizar informações, orientar convidados, receber presentes via Pix
              sem taxa por presente e entregar a galeria depois da festa.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#planos"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-sm font-bold text-[#241915] transition hover:bg-[#ffe8d0]"
              >
                Ver pacotes
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#diferenciais"
                className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Entender diferencial
              </a>
            </div>
          </div>

          <div className="mt-16 grid gap-3 sm:grid-cols-3">
            {[
              ['Sem taxa no Pix', 'Presentes vão direto para o casal'],
              ['Sob medida', 'Visual, fotos e conteúdo do jeito certo'],
              ['Pós-casamento', 'Galeria protegida para convidados'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-white/25 bg-white/12 p-4 text-white backdrop-blur-md">
                <p className="font-bold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-white/75">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section id="diferenciais" className="px-5 pb-20 pt-8 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
              <SectionIntro
                eyebrow="Posicionamento"
                title="Não é um site builder. É uma experiência digital feita para o casal."
                body="A proposta não é competir com portais gigantes em CMS, marketplace ou pagamento integrado. O foco é acabamento visual, organização das informações e recursos úteis que já resolvem dores reais."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {differentiators.map((feature) => (
                  <FeatureTile key={feature.title} feature={feature} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#241915] px-5 py-16 text-white md:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_0.9fr] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-normal text-[#ffd8a8]">Argumento comercial</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
                O site pode se pagar quando a lista não cobra percentual.
              </h2>
              <p className="mt-5 text-base leading-8 text-white/78">
                Em uma lista de R$ 30.000, uma taxa de 3,89% representa R$ 1.167. Com Pix direto,
                esse valor continua com o casal e ajuda a justificar um projeto pago e personalizado.
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-6">
              <p className="text-sm font-bold uppercase tracking-normal text-white/55">Exemplo simples</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/65">Presentes recebidos</p>
                  <p className="mt-2 text-3xl font-bold text-white">R$ 30.000</p>
                </div>
                <div>
                  <p className="text-sm text-white/65">Taxa evitada</p>
                  <p className="mt-2 text-3xl font-bold text-[#ffd8a8]">R$ 1.167</p>
                </div>
              </div>
              <p className="mt-6 text-sm leading-6 text-white/70">
                O casal paga pelo site, mas não perde uma porcentagem de cada contribuição.
              </p>
            </div>
          </div>
        </section>

        <section id="entregas" className="px-5 py-20 md:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Entregas"
              title="O que pode entrar na experiência"
              body="A base aproveita recursos já validados: landing page, hospedagens, mapa, presentes via Pix e galeria pós-casamento."
              align="center"
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {deliverables.map((feature) => (
                <FeatureTile key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="bg-[#f4eee7] px-5 py-20 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <SectionIntro
                eyebrow="Pacotes"
                title="Preço fechado, escopo claro e ciclo de casamento."
                body="A cobrança principal é por projeto, com hospedagem inclusa por período definido. Sem mensalidade obrigatória no começo."
              />
              <a
                href="mailto:me@markkop.dev?subject=Quero%20um%20or%C3%A7amento%20de%20site%20de%20casamento"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#241915] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#3f2b23] md:mb-2"
              >
                Pedir orçamento
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative flex min-h-[620px] flex-col rounded-lg border bg-white p-6 shadow-sm ${
                    plan.recommended
                      ? 'border-[#8b4d3e] shadow-[#8b4d3e]/15 ring-2 ring-[#8b4d3e]'
                      : 'border-[#eadfd5]'
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-6 rounded-full bg-[#8b4d3e] px-4 py-2 text-xs font-bold uppercase tracking-normal text-white">
                      Mais vendável
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-bold text-[#8b4d3e]">{plan.label}</p>
                    <h3 className="mt-3 font-serif text-3xl text-[#241915]">{plan.name}</h3>
                    <p className="mt-4 text-4xl font-bold text-[#241915]">{plan.price}</p>
                    <p className="mt-4 min-h-[96px] text-sm leading-6 text-slate-600">{plan.description}</p>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-3 text-sm leading-6 text-slate-700">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-lg bg-[#fbfaf6] p-4">
                    <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Ideal para</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{plan.bestFor}</p>
                  </div>

                  <a
                    href={planHref(plan.name)}
                    className={`mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 py-4 text-sm font-bold transition ${
                      plan.recommended
                        ? 'bg-[#8b4d3e] text-white hover:bg-[#743f33]'
                        : 'bg-[#241915] text-white hover:bg-[#3f2b23]'
                    }`}
                  >
                    Quero este pacote
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-dashed border-[#c9b8aa] bg-white/60 p-5">
              <p className="font-bold text-[#241915]">Luxo / muito customizado: R$ 6.000+</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Para projetos com identidade mais profunda, interações especiais, múltiplas páginas,
                integrações incomuns ou escopo definido com o casal e fornecedores.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <SectionIntro
                  eyebrow="Adicionais"
                  title="Extras entram quando fazem sentido para o casamento."
                  body="A ideia é evitar virar um portal gigante. Recursos de organização podem ser adicionados, mas o núcleo continua sendo site, experiência dos convidados, Pix e pós-evento."
                />

                <div className="mt-8 space-y-3">
                  {competitors.map((item) => (
                    <div key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#8b4d3e]" aria-hidden="true" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {addOns.map((addOn) => (
                  <article key={addOn.name} className="rounded-lg border border-[#eadfd5] bg-white p-5 shadow-sm">
                    <p className="font-bold text-[#241915]">{addOn.name}</p>
                    <p className="mt-2 text-lg font-bold text-[#8b4d3e]">{addOn.price}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{addOn.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 md:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_0.9fr] md:items-center">
            <SectionIntro
              eyebrow="Contratação"
              title="Um processo simples para o casal saber o custo total."
              body="Projeto fechado combina melhor com o ciclo do casamento: o casal aprova escopo, acompanha uma versão navegável e publica quando as informações estiverem prontas."
            />

            <div className="rounded-lg border border-[#eadfd5] bg-[#fbfaf6] p-6">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Globe2 className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </div>
              <h3 className="font-serif text-2xl text-[#241915]">Modelo recomendado</h3>
              <ul className="mt-5 space-y-3">
                {processSteps.map((step) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 md:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-lg bg-[#241915] text-white">
            <div className="grid md:grid-cols-[1.1fr_0.9fr]">
              <div className="p-8 md:p-12">
                <p className="text-sm font-bold uppercase tracking-normal text-[#ffd8a8]">Próximo passo</p>
                <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
                  Vamos transformar o casamento em uma experiência digital bem resolvida.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-white/75">
                  O melhor ponto de partida é entender data, local, quantidade de convidados, se há pessoas
                  viajando e se a lista de presentes será via Pix.
                </p>
                <a
                  href="mailto:me@markkop.dev?subject=Quero%20um%20site%20de%20casamento%20sob%20medida"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-sm font-bold text-[#241915] transition hover:bg-[#ffe8d0]"
                >
                  Falar sobre meu casamento
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <div className="min-h-[300px]">
                <img
                  src="https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=1400&auto=format&fit=crop"
                  alt="Casal em uma cerimônia de casamento ao ar livre"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WeddingSitePlansPage;
