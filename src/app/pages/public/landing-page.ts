import { Component } from '@angular/core';
import { AudienceSection } from './landing/audience-section';
import { CategoriesBento } from './landing/categories-bento';
import { CategoryMarquee } from './landing/category-marquee';
import { FaqSection } from './landing/faq-section';
import { FinalCta } from './landing/final-cta';
import { HeroSection } from './landing/hero-section';
import { HowItWorks } from './landing/how-it-works';
import { JobBuilder } from './landing/job-builder';
import { PlatformSection } from './landing/platform-section';
import { ProblemSection } from './landing/problem-section';
import { TalhaoDefs } from './landing/talhao';
import { TracksSection } from './landing/tracks-section';

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
