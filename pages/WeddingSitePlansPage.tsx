import React, { useEffect } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  Camera,
  Check,
  Database,
  Gift,
  Globe2,
  Headphones,
  HeartHandshake,
  Mail,
  MapPinned,
  Mic2,
  Minus,
  Sparkles,
  Users,
} from 'lucide-react';

type PlanKey = 'basic' | 'value' | 'premium';

type Plan = {
  key: PlanKey;
  name: string;
  price: string;
  tagline: string;
  description: string;
  highlights: string[];
  recommended?: boolean;
};

type Feature = {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  availability: Record<PlanKey, string | false>;
};

const plans: Plan[] = [
  {
    key: 'basic',
    name: 'Básico',
    price: 'R$ 1.900',
    tagline: 'Para sair do grupo do WhatsApp',
    description: 'Uma base elegante para reunir links, presentes, fotos e informações essenciais em um só lugar.',
    highlights: [
      'Domínio nomedocasal.markkop.dev (2 anos)',
      'Lista de presentes com Pix Copia-e-cola e QR Code',
      'Galeria de fotos completa protegida por senha mestra (até 1000 fotos)',
      'Gerenciador de lista de convidados (1 dispositivo, backup limitado)',
      'Sugestões de hospedagem com tabela comparativa',
    ],
  },
  {
    key: 'value',
    name: 'Custo-Benefício',
    price: 'R$ 3.500',
    tagline: 'O pacote mais equilibrado',
    description: 'Mais conforto para convidados, com domínio próprio, hospedagem organizada e suporte no fim de semana.',
    highlights: [
      'Domínio nomedocasal.com, .com.br ou .love',
      'Lista de presentes com Pix Copia-e-cola e QR Code',
      'Galeria de fotos completa protegida por senha mestra (até 2000 fotos)',
      'Gerenciador de lista de convidados (múltiplos dispositivos, backup na nuvem)',
      'Sugestões de hospedagem com mapa interativo e tabela comparativa',
    ],
    recommended: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 'R$ 6.900',
    tagline: 'Experiência completa para o evento',
    description: 'Para casais que querem uma plataforma mais completa antes, durante e depois da festa.',
    highlights: [
      'Domínio nomedocasal.com, .com.br ou .love (10 anos)',
      'Lista de presentes com Pix e marcação de presentes já escolhidos',
      'Galeria de fotos completa protegida por senha mestra (até 5000 fotos)',
      'Gerenciador de lista de convidados completo e com confirmação de presença online',
      'Sugestões de hospedagem com mapa interativo e tabela comparativa',
    ],
  },
];

const features: Feature[] = [
  {
    name: 'Domínio do site',
    description: 'Endereço usado pelos convidados para acessar o site do casal.',
    icon: Globe2,
    availability: {
      basic: 'nomedocasal.markkop.dev (2 anos)',
      value: 'nomedocasal.com, .com.br ou .love',
      premium: 'nomedocasal.com, .com.br ou .love (10 anos)',
    },
  },
  {
    name: 'Lista de presentes',
    description: 'Experiência de contribuição para presentes e cotas do casal.',
    icon: Gift,
    availability: {
      basic: 'Pix Copia-e-cola e QR Code',
      value: 'Pix Copia-e-cola e QR Code',
      premium: 'Pix com marcação de presentes já escolhidos',
    },
  },
  {
    name: 'Galeria de fotos',
    description: 'Galeria completa protegida por senha mestra para o pós-casamento.',
    icon: Camera,
    availability: {
      basic: 'Até 1000 fotos',
      value: 'Até 2000 fotos',
      premium: 'Até 5000 fotos',
    },
  },
  {
    name: 'Gerenciador de convidados',
    description: 'Organização da lista de convidados, acesso e backup conforme o pacote.',
    icon: Users,
    availability: {
      basic: '1 dispositivo, backup limitado',
      value: 'Múltiplos dispositivos, backup na nuvem',
      premium: 'Completo, com confirmação de presença online',
    },
  },
  {
    name: 'Sugestões de hospedagem',
    description: 'Lista organizada para ajudar convidados a escolherem onde ficar.',
    icon: MapPinned,
    availability: {
      basic: 'Tabela comparativa',
      value: 'Mapa interativo e tabela comparativa',
      premium: 'Mapa interativo e tabela comparativa',
    },
  },
  {
    name: 'Confirmação de presença online',
    description: 'RSVP online para centralizar respostas dos convidados.',
    icon: CalendarCheck,
    availability: { basic: false, value: false, premium: 'Incluída' },
  },
  {
    name: 'Fila de karaokê',
    description: 'Fila digital para convidados sugerirem e acompanharem músicas da festa.',
    icon: Mic2,
    availability: { basic: false, value: false, premium: 'Incluída' },
  },
  {
    name: 'Suporte remoto no fim de semana',
    description: 'Acompanhamento para incidentes críticos e pequenos ajustes durante o evento.',
    icon: Headphones,
    availability: { basic: false, value: 'Incluído', premium: 'Incluído' },
  },
  {
    name: 'Funcionalidade extra simples',
    description: 'Conteúdo estático ou interatividade leve no próprio navegador.',
    icon: HeartHandshake,
    availability: { basic: false, value: '1 incluída', premium: '1 incluída' },
  },
  {
    name: 'Funcionalidade extra média',
    description: 'Recurso com banco de dados, login, armazenamento ou integração externa.',
    icon: Database,
    availability: { basic: false, value: false, premium: '1 incluída' },
  },
];

const addOns = [
  'Domínio premium por 1 ano',
  'Funcionalidade extra complexa com IA, processos de alto custo ou escopo especial',
];

const formatSubject = (planName: string) => encodeURIComponent(`Quero o plano ${planName}`);

const planHref = (planName: string) => `mailto:me@markkop.dev?subject=${formatSubject(planName)}`;

const AvailabilityValue: React.FC<{ value: string | false }> = ({ value }) => {
  if (!value) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Minus className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <div className="mx-auto flex max-w-[170px] flex-col items-center gap-2 text-center">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-xs font-bold leading-5 text-slate-700">{value}</span>
    </div>
  );
};

const WeddingSitePlansPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Markkop Dev | Sites de casamento';
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-slate-900">
      <header className="relative min-h-[76dvh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2200&auto=format&fit=crop"
            alt="Mesa de casamento com flores e velas"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-rose-950/25" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fbfaf6] to-transparent" />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
          <a href="/" className="font-serif text-2xl text-white">
            Markkop Dev
          </a>
          <a
            href="mailto:me@markkop.dev?subject=Quero%20um%20site%20de%20casamento"
            className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white hover:text-slate-900"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Conversar
          </a>
        </nav>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col justify-center px-5 pb-14 pt-10 md:px-8 md:pt-14">
          <div className="max-w-3xl animate-fadeIn">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-rose-200" aria-hidden="true" />
              Sites para casamento
            </div>
            <h1 className="max-w-3xl font-serif text-5xl text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)] md:text-7xl">
              Sites de casamento sob medida
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 md:text-xl">
              Recursos úteis para convidados antes, durante e depois do evento: presentes, hospedagem,
              RSVP, galeria, karaokê e funcionalidades feitas para a história de cada casal.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#planos"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-sm font-bold text-slate-950 transition hover:bg-rose-100"
              >
                Ver planos
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#comparativo"
                className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Comparar recursos
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="planos" className="px-5 pb-20 pt-12 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Escolha seu plano</p>
              <h2 className="mt-3 font-serif text-4xl text-slate-950 md:text-5xl">
                Uma estrutura pronta para deixar o casamento mais simples de acompanhar.
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.key}
                  className={`relative flex min-h-[520px] flex-col rounded-lg border bg-white p-6 shadow-sm ${
                    plan.recommended
                      ? 'border-emerald-500 shadow-emerald-900/10 ring-2 ring-emerald-500'
                      : 'border-slate-200'
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-6 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white">
                      Recomendado
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-rose-700">{plan.tagline}</p>
                    <h3 className="mt-3 font-serif text-3xl text-slate-950">{plan.name}</h3>
                    <p className="mt-4 text-4xl font-bold tracking-normal text-slate-950">{plan.price}</p>
                    <p className="mt-4 min-h-[84px] text-sm leading-6 text-slate-600">{plan.description}</p>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-3 text-sm leading-6 text-slate-700">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={planHref(plan.name)}
                    className={`mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 py-4 text-sm font-bold transition ${
                      plan.recommended
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                        : 'bg-slate-950 text-white hover:bg-slate-800'
                    }`}
                  >
                    Quero este plano
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-5 py-16 text-white md:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-200">Adicionais sob consulta</p>
              <h2 className="mt-3 font-serif text-4xl md:text-5xl">
                Para pedidos fora do pacote, o escopo é decidido caso a caso.
              </h2>
            </div>
            <div className="grid gap-3">
              {addOns.map((addOn) => (
                <div key={addOn} className="flex items-start gap-3 rounded-lg border border-white/20 bg-white/10 p-4">
                  <Sparkles className="mt-1 h-5 w-5 shrink-0 text-rose-200" aria-hidden="true" />
                  <p className="text-sm leading-6 text-white/85">{addOn}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="comparativo" className="px-5 py-20 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Comparativo</p>
                <h2 className="mt-3 font-serif text-4xl text-slate-950 md:text-5xl">O que entra em cada plano</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-slate-600">
                Os recursos foram organizados para cobrir desde uma presença digital simples até uma
                experiência completa para convidados.
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-[46%] px-5 py-4 text-left text-sm font-bold text-slate-950">Recurso</th>
                    {plans.map((plan) => (
                      <th key={plan.key} className="px-5 py-4 text-center text-sm font-bold text-slate-950">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <tr key={feature.name} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="flex gap-3">
                            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                              <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                            </span>
                            <div>
                              <p className="font-bold text-slate-950">{feature.name}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{feature.description}</p>
                            </div>
                          </div>
                        </td>
                        {plans.map((plan) => (
                          <td key={plan.key} className="px-5 py-4 text-center">
                            <AvailabilityValue value={feature.availability[plan.key]} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 md:px-8">
          <div className="mx-auto max-w-6xl rounded-lg bg-gradient-to-r from-emerald-800 via-slate-900 to-rose-900 px-6 py-12 text-center text-white md:px-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Próximo passo</p>
            <h2 className="mx-auto mt-3 max-w-3xl font-serif text-4xl md:text-5xl">
              Vamos montar o site do casamento com o nível certo de detalhe.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/80">
              Suporte remoto para incidentes críticos, pequenos ajustes e acompanhamento do site no fim de
              semana do evento. Não inclui desenvolvimento de novas funcionalidades.
            </p>
            <a
              href="mailto:me@markkop.dev?subject=Quero%20um%20site%20de%20casamento"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-sm font-bold text-slate-950 transition hover:bg-rose-100"
            >
              Falar sobre meu casamento
              <Mail className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WeddingSitePlansPage;
