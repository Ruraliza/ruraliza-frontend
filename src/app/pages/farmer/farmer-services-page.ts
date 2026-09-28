import { Component, DestroyRef, computed, inject, input, linkedSignal } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { FarmerServiceItem } from '../../../models/service.model';
import { ServiceStatus } from '../../../models/status';
import { isExpired } from '../../shared/utils/expiry';
import { RemoteData } from '../../shared/utils/remote-data';
import { Button } from '../../shared/ui/button';
import { CategoryChip } from '../../shared/ui/category-chip';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { SegmentOption, SegmentedControl } from '../../shared/ui/segmented-control';
import { ServiceCard } from '../../shared/ui/service-card';
import { Skeleton } from '../../shared/ui/skeleton';

type Tab = 'abertos' | 'andamento' | 'concluidos' | 'cancelados';
type Sort = 'recentes' | 'candidatos' | 'valor' | 'prazo';

const TAB_STATUS: Record<Tab, ServiceStatus> = {
  abertos: 'Pending',
  andamento: 'In Progress',
  concluidos: 'Completed',
  cancelados: 'Cancelled'
};
const TAB_LABEL: Record<Tab, string> = { abertos: 'Abertos', andamento: 'Em andamento', concluidos: 'Concluídos', cancelados: 'Cancelados' };
const EMPTY_COPY: Record<Tab, { title: string; message: string }> = {
  abertos: { title: 'Nenhum serviço aberto', message: 'Publique um serviço para começar a receber candidaturas.' },
  andamento: { title: 'Nenhum serviço em andamento', message: 'Quando você aceitar um trabalhador, o serviço aparece aqui.' },
  concluidos: { title: 'Nenhum serviço concluído ainda', message: 'Serviços com pagamento liberado aparecem aqui.' },
  cancelados: { title: 'Nenhum serviço cancelado', message: 'Serviços que você cancelar ficam guardados aqui.' }
};
const SORTS: { value: Sort; label: string }[] = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'candidatos', label: 'Mais candidaturas para analisar' },
  { value: 'valor', label: 'Maior valor' },
  { value: 'prazo', label: 'Prazo mais próximo' }
];
const SEARCH_DELAY_MS = 300;

function searchable(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Serviços do produtor com abas por situação (com contagem) e filtros.
// Carrega todos os serviços dele uma vez e filtra na tela; a URL guarda aba e filtros.
// TODO(db): se um produtor passar a ter centenas de serviços, mover os filtros para a API (como nas vagas).
@Component({
  selector: 'app-farmer-services-page',
  imports: [RouterLink, Button, CategoryChip, EmptyState, ErrorState, Icon, SegmentedControl, ServiceCard, Skeleton],
  templateUrl: './farmer-services-page.html',
  styleUrl: './farmer-services-page.css'
})
export class FarmerServicesPage {
  // Query params (withComponentInputBinding).
  readonly aba = input<string>();
  readonly q = input<string>();
  readonly categoria = input<string>();
  readonly fazenda = input<string>();
  readonly ordem = input<string>();
  readonly so = input<string>(); // 'candidatos' | 'vencidos'

  private readonly farmerService = inject(FarmerService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly sorts = SORTS;
  readonly services = new RemoteData(() => this.farmerService.getFarmerServices(this.farmerId));

  readonly tab = computed<Tab>(() => (this.aba() && this.aba()! in TAB_STATUS ? (this.aba() as Tab) : 'abertos'));
  readonly sort = computed<Sort>(() => SORTS.find((s) => s.value === this.ordem())?.value ?? 'recentes');
  readonly emptyCopy = computed(() => EMPTY_COPY[this.tab()]);

  // Abas com a contagem de cada situação.
  readonly tabs = computed<SegmentOption<Tab>[]>(() => {
    const all = this.services.data() ?? [];
    return (Object.keys(TAB_STATUS) as Tab[]).map((tab) => {
      const count = all.filter((s) => s.status === TAB_STATUS[tab]).length;
      return { value: tab, label: `${TAB_LABEL[tab]} (${count})` };
    });
  });

  // Opções dos filtros a partir dos próprios serviços.
  readonly categories = computed(() => [...new Set((this.services.data() ?? []).map((s) => s.category))].sort());
  readonly farms = computed(() => {
    const byId = new Map<number, string>();
    for (const s of this.services.data() ?? []) byId.set(s.farm.id, `${s.farm.city}, ${s.farm.state}`);
    return [...byId].map(([id, label]) => ({ id, label }));
  });

  readonly draftQuery = linkedSignal(() => this.q() ?? '');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  readonly filtered = computed<FarmerServiceItem[]>(() => {
    const status = TAB_STATUS[this.tab()];
    const terms = searchable(this.q() ?? '').split(/\s+/).filter(Boolean);
    const farmId = Number(this.fazenda()) || null;
    const list = (this.services.data() ?? []).filter((s) => {
      if (s.status !== status) return false;
      if (this.categoria() && s.category !== this.categoria()) return false;
      if (farmId !== null && s.farm.id !== farmId) return false;
      if (this.so() === 'candidatos' && s.applications_pending === 0) return false;
      if (this.so() === 'vencidos' && !isExpired(s)) return false;
      if (terms.length) {
        const haystack = searchable(`${s.name} ${s.description ?? ''} ${s.category}`);
        if (!terms.every((t) => haystack.includes(t))) return false;
      }
      return true;
    });

    const byRecent = (a: FarmerServiceItem, b: FarmerServiceItem): number => b.insertion_date.localeCompare(a.insertion_date) || b.id - a.id;
    const compare: Record<Sort, (a: FarmerServiceItem, b: FarmerServiceItem) => number> = {
      recentes: byRecent,
      candidatos: (a, b) => b.applications_pending - a.applications_pending || byRecent(a, b),
      valor: (a, b) => b.price - a.price || byRecent(a, b),
      // Sem prazo vai para o fim.
      prazo: (a, b) => (a.expires_at ?? '9999').localeCompare(b.expires_at ?? '9999') || byRecent(a, b)
    };
    return list.sort(compare[this.sort()]);
  });

  readonly anyFilter = computed(() => !!(this.q() || this.categoria() || this.fazenda() || this.so() || this.ordem()));

  constructor() {
    this.services.load();
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
  }

  setTab(tab: Tab): void {
    // Os atalhos "com candidatos"/"vencidos" só fazem sentido nos abertos.
    this.setParams({ aba: tab === 'abertos' ? null : tab, so: tab === 'abertos' ? this.so() ?? null : null });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draftQuery.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.setParams({ q: value.trim() || null }), SEARCH_DELAY_MS);
  }

  setSelect(key: 'categoria' | 'fazenda' | 'ordem', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.setParams({ [key]: value && value !== 'recentes' ? value : null });
  }

  toggleOnly(value: 'candidatos' | 'vencidos'): void {
    this.setParams({ so: this.so() === value ? null : value });
  }

  clearFilters(): void {
    clearTimeout(this.searchTimer);
    this.draftQuery.set('');
    this.setParams({ q: null, categoria: null, fazenda: null, ordem: null, so: null });
  }

  private setParams(params: Params): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
