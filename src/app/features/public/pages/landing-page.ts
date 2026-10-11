import { Component } from '@angular/core';
import { AudienceSection } from '../ui/audience-section';
import { CategoriesBento } from '../ui/categories-bento';
import { CategoryMarquee } from '../ui/category-marquee';
import { FaqSection } from '../ui/faq-section';
import { FinalCta } from '../ui/final-cta';
import { HeroSection } from '../ui/hero-section';
import { HowItWorks } from '../ui/how-it-works';
import { JobBuilder } from '../ui/job-builder';
import { PlatformSection } from '../ui/platform-section';
import { ProblemSection } from '../ui/problem-section';
import { TalhaoDefs } from '../ui/talhao';
import { TracksSection } from '../ui/tracks-section';

// Landing v2: revista do campo, fotos reais e a própria UI como prova.
// Hero e faixa de categorias hidratam na hora. As demais seções vêm completas no
// HTML pré-renderizado (SEO), mas o JS de cada uma só carrega quando ela aparece
// na tela (hidratação incremental). Em navegação no browser, carregam no idle.
@Component({
  selector: 'app-landing-page',
  imports: [
    AudienceSection, CategoriesBento, CategoryMarquee, FaqSection, FinalCta, HeroSection,
    HowItWorks, JobBuilder, PlatformSection, ProblemSection, TalhaoDefs, TracksSection
  ],
  template: `
    <app-talhao-defs />
    <app-hero-section />
    <app-category-marquee />
    @defer (on idle; hydrate on viewport) { <app-problem-section /> }
    @defer (on idle; hydrate on viewport) { <app-how-it-works /> }
    @defer (on idle; hydrate on viewport) { <app-audience-section audience="farmer" /> }
    @defer (on idle; hydrate on viewport) { <app-audience-section audience="worker" /> }
    @defer (on idle; hydrate on viewport) { <app-categories-bento /> }
    @defer (on idle; hydrate on viewport) { <app-job-builder /> }
    @defer (on idle; hydrate on viewport) { <app-tracks-section /> }
    @defer (on idle; hydrate on viewport) { <app-platform-section /> }
    @defer (on idle; hydrate on viewport) { <app-faq-section /> }
    @defer (on idle; hydrate on viewport) { <app-final-cta /> }
  `
})
export class LandingPage {}
