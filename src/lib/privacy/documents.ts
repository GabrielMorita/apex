import type { PrivacyDocumentType } from "@/lib/privacy/types";

export const PRIVACY_DOCUMENT_VERSION = "2026-07-18.1";
export const PRIVACY_CONTACT_EMAIL = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL?.trim() || "";
export const DATA_CONTROLLER_NAME = process.env.NEXT_PUBLIC_DATA_CONTROLLER_NAME?.trim() || "";

export type LegalSection = { title: string; paragraphs?: string[]; bullets?: string[] };
export type LegalDocumentContent = {
  type: PrivacyDocumentType;
  path: string;
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalSection[];
};

const controller = DATA_CONTROLLER_NAME || "Controlador ainda não configurado";
const contact = PRIVACY_CONTACT_EMAIL || "Canal de privacidade ainda não configurado";

export const LEGAL_DOCUMENTS: Record<PrivacyDocumentType, LegalDocumentContent> = {
  privacy_notice: {
    type: "privacy_notice",
    path: "/privacidade",
    eyebrow: "Transparência",
    title: "Aviso de Privacidade do Apex",
    summary: "Como o Apex coleta, usa, protege e elimina dados pessoais, inclusive informações de saúde usadas na personalização.",
    sections: [
      { title: "1. Minuta e identificação", paragraphs: [`Esta é a versão ${PRIVACY_DOCUMENT_VERSION}, preparada para revisão jurídica antes do lançamento comercial. Controlador: ${controller}. Canal para direitos e dúvidas: ${contact}.`] },
      { title: "2. Dados tratados", bullets: ["Conta e identificação: nome, e-mail, autenticação e data de nascimento.", "Perfil e saúde: sexo biológico, altura, peso, gordura corporal, metas, alimentação, treinos, hábitos, check-ins e progresso.", "Produtividade: tarefas, metas, foco, leitura e planejamento inseridos pelo usuário.", "Assinatura: plano, estado da assinatura, faturas e identificadores do provedor; o Apex não armazena dados completos de cartão.", "Dados técnicos essenciais: sessão autenticada, registros de segurança e informações necessárias ao funcionamento do serviço."] },
      { title: "3. Finalidades e bases", paragraphs: ["Os dados de conta e uso são tratados para criar a conta, sincronizar informações, entregar recursos solicitados, proteger o serviço, atender direitos e cumprir obrigações aplicáveis. Dados referentes à saúde recebem proteção reforçada e, quando o consentimento for a base aplicável, são tratados conforme consentimento específico e destacado."], bullets: ["Prestação do serviço e procedimentos solicitados pelo usuário.", "Consentimento específico para personalização com dados sensíveis, quando aplicável.", "Cumprimento de obrigação legal ou regulatória.", "Exercício regular de direitos e prevenção a fraude ou abuso."] },
      { title: "4. Compartilhamento e operadores", paragraphs: ["O Apex não vende dados pessoais. Informações podem ser processadas por fornecedores necessários de autenticação, banco, armazenamento, hospedagem e pagamentos, sempre limitadas à finalidade do serviço. A relação definitiva de fornecedores, países e garantias contratuais deve ser confirmada antes do lançamento."] },
      { title: "5. Cookies e armazenamento local", paragraphs: ["O aplicativo usa sessão e armazenamento local essenciais para autenticação, preferências de interface e cache temporário. Recursos opcionais de análise permanecem desligados por padrão e só poderão ser ativados conforme a preferência registrada e a implementação correspondente."] },
      { title: "6. Retenção e eliminação", paragraphs: ["A retenção depende da finalidade e da necessidade. Em regra, dados funcionais permanecem durante a conta ativa e são excluídos com ela. Algumas informações podem ser conservadas quando houver obrigação legal, exercício regular de direitos ou outra hipótese prevista na LGPD. As regras atuais são apresentadas na Central de Privacidade."] },
      { title: "7. Segurança", paragraphs: ["O Apex usa autenticação, isolamento por usuário, Row Level Security, armazenamento privado e operações sensíveis no servidor. Nenhum sistema é infalível; incidentes confirmados com risco ou dano relevante serão avaliados e comunicados conforme a legislação e a regulamentação aplicável."] },
      { title: "8. Direitos do titular", bullets: ["Confirmação e acesso.", "Correção.", "Anonimização, bloqueio ou eliminação quando cabível.", "Portabilidade, conforme regulamentação.", "Informações sobre compartilhamento.", "Revogação de consentimento e oposição quando aplicáveis.", "Revisão de decisões automatizadas quando aplicável."] },
      { title: "9. Recomendações automatizadas", paragraphs: ["O Apex produz estimativas e sugestões editáveis de dieta, treino e progresso. Elas não são diagnóstico, prescrição clínica nem decisão com efeito jurídico ou de crédito. O usuário pode alterar informações e solicitar esclarecimentos ou revisão pelo canal de privacidade."] },
      { title: "10. Público e mudanças", paragraphs: ["Esta versão foi delimitada para adultos com 18 anos ou mais. Mudanças relevantes gerarão nova versão e novo destaque no aplicativo quando for necessário aceite, ciência ou consentimento atualizado."] },
    ],
  },
  terms_of_use: {
    type: "terms_of_use",
    path: "/termos",
    eyebrow: "Condições do serviço",
    title: "Termos de Uso do Apex",
    summary: "Regras para criação de conta, uso dos recursos de produtividade, saúde, treino, dieta e futuras assinaturas.",
    sections: [
      { title: "1. Minuta", paragraphs: [`Termos versão ${PRIVACY_DOCUMENT_VERSION}, sujeitos a revisão profissional antes da comercialização. Operador do serviço: ${controller}. Contato: ${contact}.`] },
      { title: "2. Elegibilidade", paragraphs: ["O Apex é destinado a pessoas com 18 anos ou mais. Ao criar a conta, o usuário declara possuir capacidade para aceitar estes Termos e fornecer informações verdadeiras."] },
      { title: "3. Natureza do Apex", paragraphs: ["O Apex organiza hábitos, tarefas, treinos, alimentação e progresso. Estimativas e sugestões são referências editáveis e não substituem médico, nutricionista, educador físico ou outro profissional habilitado. O aplicativo não presta atendimento de emergência."] },
      { title: "4. Conta e segurança", bullets: ["Mantenha credenciais seguras e não compartilhe a conta.", "Informe dados corretos e atualize-os quando necessário.", "Comunique suspeita de acesso indevido.", "Não tente acessar dados de outra pessoa ou contornar controles de segurança."] },
      { title: "5. Conteúdo do usuário", paragraphs: ["O usuário mantém seus direitos sobre os dados inseridos e concede apenas a autorização necessária para armazenar, processar, sincronizar e exibir essas informações dentro das finalidades do serviço."] },
      { title: "6. Uso responsável", paragraphs: ["É proibido usar o Apex para fraude, violação de direitos, engenharia reversa indevida, distribuição de código malicioso, sobrecarga intencional ou acesso não autorizado."] },
      { title: "7. Assinatura e teste gratuito", paragraphs: ["Quando a cobrança for ativada, preço, recorrência e condições serão apresentados antes da confirmação. O primeiro teste gratuito elegível dura sete dias; o método de pagamento é confirmado no início e a cobrança começa ao término, salvo cancelamento anterior. A exibição de Apple Pay depende da elegibilidade do dispositivo e do provedor."] },
      { title: "8. Disponibilidade e mudanças", paragraphs: ["O serviço pode receber correções, alterações ou interrupções necessárias. Mudanças materiais nos Termos serão apresentadas em nova versão. Funcionalidades pagas não serão ativadas sem informação prévia adequada."] },
      { title: "9. Encerramento", paragraphs: ["O usuário pode exportar dados e excluir a conta. A exclusão pode exigir o cancelamento prévio de assinatura para evitar cobranças sem conta ativa. Violações graves podem levar à suspensão, observadas as regras aplicáveis."] },
      { title: "10. Lei aplicável", paragraphs: ["Aplicam-se as leis brasileiras, inclusive regras de defesa do consumidor e proteção de dados quando cabíveis. O foro competente será determinado conforme a legislação aplicável, sem limitar direitos obrigatórios do consumidor."] },
    ],
  },
  health_data_consent: {
    type: "health_data_consent",
    path: "/dados-saude",
    eyebrow: "Consentimento destacado",
    title: "Dados de Saúde e Personalização",
    summary: "Explicação específica sobre o uso de informações corporais, alimentares, de treino e bem-estar.",
    sections: [
      { title: "1. Quais dados", bullets: ["Data de nascimento, sexo biológico, altura, peso e percentual de gordura.", "Objetivos, nível de atividade e frequência de treinos.", "Alimentação planejada e consumida, preferências, restrições e alergias informadas.", "Treinos, cargas, repetições, duração, hábitos, sono, humor, estresse, dor muscular e progresso."] },
      { title: "2. Para quais finalidades", bullets: ["Personalizar estimativas editáveis de energia e macronutrientes.", "Organizar planos, históricos e comparações de alimentação e treino.", "Exibir progresso e lembretes escolhidos pelo usuário.", "Sincronizar esses dados entre dispositivos autenticados."] },
      { title: "3. Declaração de consentimento", paragraphs: ["Ao aceitar, você consente de forma específica e destacada com o tratamento desses dados sensíveis para as finalidades acima. O Apex não usa esse consentimento para vender dados, publicidade comportamental ou disponibilização pública."] },
      { title: "4. Escolha e revogação", paragraphs: ["Você pode revogar o consentimento na Central de Privacidade. A revogação não altera a legitimidade do tratamento anterior e pode limitar recursos que dependem desses dados. Para eliminar informações já armazenadas, use a exportação, a exclusão da conta ou faça uma solicitação específica."] },
      { title: "5. Limites de saúde", paragraphs: ["O Apex não realiza diagnóstico, atendimento de emergência ou prescrição clínica. Gestantes, lactantes, menores de 18 anos e pessoas com condições que exigem acompanhamento devem procurar profissional habilitado antes de usar recomendações de saúde, dieta ou treino."] },
      { title: "6. Proteção e retenção", paragraphs: ["Os dados ficam vinculados à conta autenticada, protegidos por regras de isolamento e armazenados enquanto necessários às finalidades informadas. A eliminação observa a solicitação do titular e as hipóteses legais de conservação aplicáveis."] },
    ],
  },
};
