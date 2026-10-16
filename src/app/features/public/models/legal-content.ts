// Termos de Uso e Política de Privacidade (issue #18), em linguagem simples.
// ATENÇÃO: textos-base escritos para a fase de testes; precisam da revisão de um advogado antes do lançamento
// (razão social, CNPJ, endereço e encarregado de dados ainda não existem e não foram inventados).
// Mudou um texto? Troque TERMS_VERSION (core/models/legal.ts) e a do backend.

export type LegalBlock = { p: string } | { list: readonly string[] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: readonly LegalBlock[];
}

export interface LegalDocument {
  title: string;
  intro: string;
  summary: readonly string[];
  sections: readonly LegalSection[];
}

export const TERMS_OF_USE: LegalDocument = {
  title: 'Termos de Uso',
  intro:
    'Estes termos explicam como funciona o Ruraliza e o que cabe a cada um. Ao criar sua conta, você concorda com eles. ' +
    'Esta versão acompanha a fase de testes do app e pode mudar antes do lançamento; se mudar, avisamos e pedimos um novo aceite.',
  summary: [
    'O Ruraliza aproxima produtores rurais de trabalhadores, prestadores de serviço e estudantes. Não é empregador nem agência de emprego.',
    'O trabalho, as condições de segurança e o pagamento são combinados e garantidos diretamente entre o produtor e o trabalhador.',
    'É preciso ter 18 anos ou mais e informar dados verdadeiros.',
    'Respeito é regra: ofensas, discriminação, fraude e assédio levam à remoção do conteúdo e da conta.',
    'Nesta fase de testes, os pagamentos são simulados e os dados podem ser apagados.'
  ],
  sections: [
    {
      id: 'o-que-e',
      title: 'O que é o Ruraliza',
      blocks: [
        { p: 'O Ruraliza é uma plataforma digital que aproxima quem precisa de um serviço no campo (o produtor) de quem sabe fazer (o trabalhador, prestador de serviço ou estudante). No app, o produtor publica vagas, o trabalhador se candidata, os dois conversam, combinam os detalhes e, ao final, avaliam um ao outro.' },
        { p: 'O app também oferece trilhas de estudo com certificado de conclusão emitido pela Ruraliza.' }
      ]
    },
    {
      id: 'papel',
      title: 'O papel do Ruraliza: só a aproximação',
      blocks: [
        { p: 'O Ruraliza atua apenas como intermediador da conexão entre os usuários. Por isso:' },
        {
          list: [
            'o Ruraliza não é empregador, tomador de serviço nem agência de emprego, e não há vínculo de trabalho entre o Ruraliza e os usuários;',
            'o Ruraliza não executa os serviços, não escolhe quem é contratado e não garante que uma vaga será preenchida ou que um trabalhador será aceito;',
            'a relação de trabalho (diária, empreitada, prestação de serviço ou outra forma) é combinada diretamente entre o produtor e o trabalhador, que respondem pelas obrigações trabalhistas, previdenciárias e fiscais que a lei exigir;',
            'o Ruraliza não fiscaliza as propriedades nem acompanha a execução dos serviços.'
          ]
        }
      ]
    },
    {
      id: 'quem-pode',
      title: 'Quem pode usar',
      blocks: [
        { p: 'Podem criar conta pessoas com 18 anos ou mais, com CPF válido. Cada pessoa tem uma conta, que pode ter um perfil de produtor e um de trabalhador.' },
        { p: 'Você se compromete a informar dados verdadeiros e atualizados (nome, telefone, experiência, certificados, localização das fazendas) e a não se passar por outra pessoa.' }
      ]
    },
    {
      id: 'produtor',
      title: 'Responsabilidades do produtor',
      blocks: [
        {
          list: [
            'Descrever cada vaga com honestidade: o que será feito, onde, por quantas horas e por quanto.',
            'Oferecer condições de trabalho seguras e adequadas, cumprindo a legislação, inclusive a Norma Regulamentadora de segurança e saúde no trabalho rural (NR-31), com os equipamentos de proteção individual (EPIs) necessários.',
            'Cumprir o que foi combinado, inclusive o pagamento, e as obrigações trabalhistas, previdenciárias e fiscais que a relação exigir.',
            'Tratar os trabalhadores com respeito, sem discriminação de qualquer tipo.'
          ]
        }
      ]
    },
    {
      id: 'trabalhador',
      title: 'Responsabilidades do trabalhador',
      blocks: [
        {
          list: [
            'Informar com honestidade a sua experiência, os seus certificados e os seus cursos.',
            'Cumprir o que foi combinado: horário, local e qualidade do serviço. Se precisar desistir, avisar o quanto antes.',
            'Usar os equipamentos de proteção e seguir as orientações de segurança da propriedade.',
            'Tratar o produtor e a equipe da fazenda com respeito.'
          ]
        }
      ]
    },
    {
      id: 'seguranca',
      title: 'Segurança, acidentes e prejuízos',
      blocks: [
        { p: 'Como o Ruraliza não executa, não supervisiona e não fiscaliza os serviços, os riscos da execução (acidentes, danos a pessoas, animais, máquinas, lavouras ou bens, e prejuízos de qualquer natureza) são de responsabilidade de quem contratou e de quem executou o serviço, conforme a lei e o que eles combinaram.' },
        { p: 'Na medida permitida pela legislação, o Ruraliza não responde por esses fatos. Recomendamos que produtor e trabalhador combinem por escrito as condições do serviço e avaliem a contratação de seguro.' }
      ]
    },
    {
      id: 'pagamentos',
      title: 'Pagamentos',
      blocks: [
        { p: 'Nesta fase de testes, o pagamento no app é simulado: o botão "Liberar pagamento" só registra que o serviço foi pago. Nenhum dinheiro passa pelo Ruraliza.' },
        { p: 'O pagamento de verdade é combinado e feito diretamente entre o produtor e o trabalhador. Se um dia o app passar a movimentar pagamentos, haverá regras próprias, apresentadas antes.' }
      ]
    },
    {
      id: 'conduta',
      title: 'Conversas, avaliações e conduta',
      blocks: [
        { p: 'A conversa do app serve para combinar o serviço. As avaliações devem refletir a experiência real. Não é permitido:' },
        {
          list: [
            'publicar vagas falsas, enganosas ou ilegais, inclusive trabalho em condições degradantes ou análogas à escravidão, ou trabalho infantil;',
            'ofender, ameaçar, assediar ou discriminar qualquer pessoa;',
            'usar palavrões ou conteúdo ofensivo em vagas, perfis e mensagens;',
            'tentar fraudar avaliações, pagamentos ou a identidade de alguém.'
          ]
        },
        { p: 'O Ruraliza pode recusar textos com palavras ofensivas, remover conteúdos que desrespeitem estas regras e suspender ou encerrar contas, depois de analisar denúncias ou situações de risco. Se você vir algo errado, denuncie pelo app.' }
      ]
    },
    {
      id: 'trilhas',
      title: 'Trilhas de estudo e certificados',
      blocks: [
        { p: 'As trilhas são cursos livres oferecidos pela Ruraliza. O certificado de conclusão comprova que você concluiu todas as aulas da trilha; ele não é diploma nem certificação profissional oficial.' },
        { p: 'Cada certificado tem um código que qualquer pessoa pode conferir na página de validação do Ruraliza.' }
      ]
    },
    {
      id: 'conta',
      title: 'Sua conta',
      blocks: [
        { p: 'Sua senha é pessoal: não a compartilhe. Você é responsável pelo que for feito com a sua conta. Se perceber uso indevido, troque a senha e avise a equipe.' },
        { p: 'Você pode excluir a conta quando quiser, em Perfil. Serviços em andamento precisam ser concluídos (ou a desistência combinada) antes.' }
      ]
    },
    {
      id: 'testes',
      title: 'Fase de testes e disponibilidade',
      blocks: [
        { p: 'O Ruraliza está em fase de testes. Os dados ficam na memória do servidor e podem ser apagados a qualquer momento, por exemplo quando o servidor reinicia. O app pode ficar fora do ar ou mudar sem aviso.' },
        { p: 'Por isso, evite usar dados reais nesta fase e não dependa só do app para guardar informações importantes.' }
      ]
    },
    {
      id: 'propriedade',
      title: 'Marca e conteúdo',
      blocks: [
        { p: 'A marca, o nome e o desenho do Ruraliza pertencem ao projeto Ruraliza. O que você publica (fotos, textos, vagas) continua sendo seu; ao publicar, você autoriza o Ruraliza a exibir esse conteúdo no app enquanto ele estiver publicado.' }
      ]
    },
    {
      id: 'mudancas',
      title: 'Mudanças nestes termos',
      blocks: [
        { p: 'Se estes termos mudarem, avisaremos no app. Mudanças importantes pedirão um novo aceite; se você não concordar, pode excluir a sua conta.' }
      ]
    },
    {
      id: 'lei',
      title: 'Lei aplicável e contato',
      blocks: [
        { p: 'Estes termos seguem as leis do Brasil. Para resolver qualquer conflito, vale o foro do domicílio do usuário, como prevê o Código de Defesa do Consumidor quando ele se aplicar.' },
        { p: 'Dúvidas? Consulte a Central de Ajuda do app.' }
      ]
    }
  ]
};

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Política de Privacidade',
  intro:
    'Esta política explica quais dados o Ruraliza usa, para quê, com quem compartilha e quais são os seus direitos, ' +
    'de acordo com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018). Esta versão acompanha a fase de testes do app.',
  summary: [
    'Usamos seus dados para fazer o app funcionar: cadastro, vagas, candidaturas, conversas, avaliações e trilhas.',
    'Outros usuários veem seu CPF mascarado. Seu telefone só aparece na conversa, quando os dois liberam o WhatsApp.',
    'A localização exata da fazenda só aparece para o trabalhador aceito no serviço.',
    'Não vendemos seus dados. Avisos por WhatsApp e notificações no celular só com o seu sim.',
    'Você pode ver, corrigir e apagar seus dados no próprio app.'
  ],
  sections: [
    {
      id: 'controlador',
      title: 'Quem cuida dos seus dados',
      blocks: [
        { p: 'O Ruraliza é o controlador dos dados tratados no app. Para dúvidas sobre privacidade ou para exercer os seus direitos, use a Central de Ajuda do app; a equipe responde por lá.' }
      ]
    },
    {
      id: 'dados',
      title: 'Quais dados usamos',
      blocks: [
        {
          list: [
            'Cadastro: nome, e-mail, telefone (WhatsApp), CPF e senha (guardada só como código, o hash, nunca o texto).',
            'Perfil do trabalhador: foto, apresentação, experiência, certificados, cursos e currículo em PDF, se você enviar.',
            'Perfil do produtor e fazendas: foto, endereço, cidade, estado, o ponto marcado no mapa e as fotos das fazendas.',
            'Uso do app: vagas publicadas, candidaturas, serviços, pagamentos simulados, avaliações, mensagens das conversas, avisos (notificações), progresso nas trilhas e certificados.',
            'Preferências: tema, tamanho das letras, contraste e se você quer avisos no WhatsApp.',
            'Dados técnicos: a inscrição do navegador para notificações, quando você ativa, e registros de funcionamento do servidor.'
          ]
        },
        { p: 'Antes de guardar uma foto, o app remove os dados escondidos da imagem, como a localização (GPS) de onde ela foi tirada.' }
      ]
    },
    {
      id: 'finalidades',
      title: 'Para que usamos e com qual base legal',
      blocks: [
        {
          list: [
            'Para fazer o app funcionar e cumprir o que você pediu ao se cadastrar (execução de contrato): mostrar vagas, enviar candidaturas, abrir conversas, registrar serviços, avaliações e certificados.',
            'Para manter a plataforma segura, evitar fraudes e analisar denúncias (legítimo interesse).',
            'Para enviar avisos no WhatsApp e notificações no celular, só quando você ativa (consentimento, que você pode retirar a qualquer momento).',
            'Para cumprir obrigações legais, quando houver.'
          ]
        }
      ]
    },
    {
      id: 'compartilhamento',
      title: 'Com quem compartilhamos',
      blocks: [
        {
          list: [
            'Com outros usuários, na medida do necessário: o produtor vê o perfil de quem se candidata (com CPF, telefone e e-mail mascarados); o trabalhador vê a vaga com cidade e estado, e o ponto exato da fazenda só depois de aceito. O telefone só é mostrado na conversa quando os dois liberam o WhatsApp.',
            'Com fornecedores que fazem o app funcionar: hospedagem, mapas (Google Maps), o serviço de notificações do seu navegador e, se você ativar e a integração estiver ligada, o provedor de mensagens de WhatsApp.',
            'Com autoridades, quando a lei exigir.'
          ]
        },
        { p: 'Não vendemos seus dados e não os usamos para publicidade de terceiros. Espaços de patrocínio no app não recebem seus dados pessoais.' }
      ]
    },
    {
      id: 'armazenamento',
      title: 'Onde e por quanto tempo guardamos',
      blocks: [
        { p: 'Nesta fase de testes, os dados ficam na memória do servidor e são apagados quando ele reinicia. Quando o app passar a usar um banco de dados, esta política será atualizada.' },
        { p: 'Fora isso, guardamos os dados enquanto sua conta existir. Ao excluir a conta, apagamos seu perfil, suas fotos, seu currículo e o histórico ligado a ele, salvo o que a lei obrigar a manter.' }
      ]
    },
    {
      id: 'direitos',
      title: 'Seus direitos',
      blocks: [
        { p: 'A LGPD garante que você pode, a qualquer momento:' },
        {
          list: [
            'confirmar se tratamos seus dados e acessá-los (eles estão no seu Perfil);',
            'corrigir dados incompletos ou errados (em Editar perfil);',
            'pedir a exclusão dos seus dados (em Excluir conta);',
            'retirar consentimentos, como os avisos no WhatsApp e as notificações no celular;',
            'pedir a portabilidade dos dados e informações sobre com quem eles foram compartilhados.'
          ]
        },
        { p: 'Para o que não estiver disponível direto no app, peça pela Central de Ajuda.' }
      ]
    },
    {
      id: 'navegador',
      title: 'Armazenamento no seu aparelho',
      blocks: [
        { p: 'O app guarda no navegador a sua sessão (enquanto a aba estiver aberta), as suas preferências de aparência e, no app instalado, uma cópia das telas para abrir mais rápido. Não usamos cookies de rastreamento ou de publicidade.' }
      ]
    },
    {
      id: 'idade',
      title: 'Menores de idade',
      blocks: [
        { p: 'O Ruraliza é para maiores de 18 anos. Se soubermos que uma conta é de um menor de idade, ela será encerrada.' }
      ]
    },
    {
      id: 'seguranca',
      title: 'Segurança',
      blocks: [
        { p: 'As senhas são guardadas com hash (scrypt), as sessões usam tokens assinados que vencem em 12 horas e cada pessoa só acessa os próprios dados. Nenhum sistema é 100% seguro: se suspeitar de algo, troque sua senha e avise a equipe.' }
      ]
    },
    {
      id: 'mudancas',
      title: 'Mudanças nesta política',
      blocks: [
        { p: 'Se esta política mudar, avisaremos no app, e mudanças importantes pedirão um novo aceite.' }
      ]
    }
  ]
};
