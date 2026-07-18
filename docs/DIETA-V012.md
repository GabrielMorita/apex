# Apex v0.12.0 — Fundação da Dieta

## Escopo entregue

- Onboarding em sete etapas, com objetivo, rotina, refeições, preferências, praticidade, metas e revisão.
- Bloqueio específico para menores de 18 anos e confirmação de elegibilidade para adultos saudáveis.
- Estimativa inicial editável e explicitamente provisória de calorias e macronutrientes.
- Preferências e metas persistidas por usuário no Supabase.
- Escrita atômica das preferências e metas pela função `save_diet_foundation`.
- RLS em todas as novas tabelas com isolamento por `auth.uid()`.
- Dashboard sem refeições fictícias: exibe apenas a configuração real ou o estado pendente.
- Tela inicial da Dieta com estado vazio honesto enquanto não existe plano semanal.

## Cálculo provisório

A estimativa utiliza Mifflin–St Jeor para metabolismo basal, multiplicadores de nível de atividade e um ajuste percentual conforme objetivo e ritmo. A divisão energética dos macronutrientes permanece dentro das faixas de distribuição aceitáveis para adultos. A versão do cálculo e as entradas utilizadas são armazenadas em `nutrition_targets.calculation_inputs`.

O cálculo não é prescrição clínica. O fluxo não atende menores, gestantes, lactantes ou pessoas que precisem de acompanhamento nutricional clínico. Antes de comercialização, as regras devem passar por revisão profissional e jurídica.

Referências técnicas:

- Mifflin MD et al. *A new predictive equation for resting energy expenditure in healthy individuals*. American Journal of Clinical Nutrition, 1990: https://pubmed.ncbi.nlm.nih.gov/2305711/
- National Academies. *Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids*: https://www.nationalacademies.org/publications/10490

## Executar a migration no Supabase

1. Abra o projeto correto no painel do Supabase.
2. Entre em **SQL Editor** e crie uma nova consulta.
3. Copie todo o conteúdo de `supabase/migrations/20260717020000_diet_foundation.sql`.
4. Clique em **Run query**. O resultado esperado é `Success. No rows returned`.
5. Não execute a migration com `service_role` no navegador e não exponha chaves secretas.

## Teste local

1. Mantenha as variáveis públicas do Supabase no `.env.local`; esse arquivo não acompanha o ZIP.
2. Execute `npm install` e `npm run dev`.
3. Entre com uma conta de teste e abra **Dieta**.
4. Conclua as sete etapas e confirme que a tela passa a exibir as metas salvas.
5. Atualize a página e confirme que preferências e metas persistem.
6. Edite uma meta, salve e confirme o selo **Ajustadas por você**.
7. Use **Recalcular com o Perfil** e confirme o retorno à estimativa calculada.
8. Entre com outra conta e confirme que ela não enxerga os dados da primeira.

## Dependências de validação em Supabase real

- Aplicação da migration e disponibilidade da função RPC.
- Persistência após atualização e novo login.
- RLS e isolamento com duas contas.
- Comportamento de rede e sessão expirada.
- Validação do fluxo em telas mobile e desktop com dados reais.

## Próxima entrega

O plano semanal ainda não é gerado nesta versão. A próxima etapa adicionará banco real de alimentos, modelo de refeições, regras determinísticas de geração, substituições e plano de sete dias persistido.
