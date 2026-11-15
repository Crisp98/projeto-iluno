# iLuno

Plataforma em que estudantes consultam e compartilham avaliações de disciplinas feitas por quem já as cursou.

**Stack:** React (Vite) · API Python (FastAPI) · Firebase (Authentication + Firestore) · Vercel

## Onda 1 — o que está no código

| Tarefa | Issue | O que foi feito | Arquivos |
|---|---|---|---|
| T01 | #1 | Modelo de usuário no Firestore + login pelo Firebase Authentication | `src/services/usuarios.js`, `src/firebase.js`, `src/AuthContext.jsx` |
| T02 | #2 | Formulário de cadastro com validação | `src/pages/Cadastro.jsx` |
| T03 | #3 | Tela de perfil | `src/pages/Perfil.jsx` |
| T04 | #4 | Modelo de disciplina + disciplinas de teste | `scripts/carga_inicial.py` |
| T05 | #5 | Endpoint de busca por nome (ignora acentos e maiúsculas) | `api/index.py`, `api/busca.py`, `src/pages/Busca.jsx` |
| T06 | #6 | Tópicos de avaliação (dificuldade, carga extraclasse, aplicação prática, relevância) | `scripts/carga_inicial.py`, `src/services/avaliacoes.js` |
| T07 | #7 | Tela da disciplina com informações, tópicos e formulário de avaliação | `src/pages/Disciplina.jsx` |
| T08 | #8 | Regras de segurança do Firestore | `firestore.rules` |
| T15 | #9 | Arquivos de configuração do Firebase | `firebase.json`, `.env.example` |
| T16 | #10 | Configuração do deploy na Vercel | `vercel.json` |
| T17 | #11 | API FastAPI inicializada como função da Vercel | `api/index.py`, `requirements.txt` |

Testes da API em `tests/test_api.py`.

## Onda 2 — primeira entrega (T09 e T10)

A página de disciplina permite consultar os 50 comentários mais recentes em tempo real. Usuários autenticados com perfil podem enviar textos de até 1000 caracteres; o nome do perfil aparece publicamente, sem divulgar o e-mail. Comentários vazios são recusados. Edição e exclusão não fazem parte desta entrega.

Os documentos ficam em `disciplinas/{id}/comentarios/{comentarioId}`, com `texto`, `autorUid`, `autorNome` e `criadoEm`. As regras conferem o UID autenticado, o nome registrado no perfil, a existência da disciplina e o timestamp do servidor.

**Antes de testar ou publicar:** atualizar as regras do Firestore com o conteúdo de `firestore.rules`. O banco `iluno-dev` é compartilhado com a publicação original; a mudança adiciona acesso à subcoleção de comentários. Não é necessário executar a carga inicial.

Validação manual da entrega:

Testes do serviço: `node --experimental-vm-modules --test tests/comentarios.test.mjs`. Usam dependências simuladas para conferir autoria, validação do texto e assinatura da lista; não substituem os testes das regras no Firebase.

1. Sem login, abrir uma disciplina: a lista deve carregar e o formulário deve oferecer entrar/criar conta.
2. Entrar e enviar um comentário: conferir nome, texto e data; atualizar a página e confirmar persistência.
3. Abrir outra disciplina: o comentário não deve aparecer nela. Em outra sessão, confirmar a atualização da lista.
4. Testar texto vazio, somente espaços e mais de 1000 caracteres; conferir limite e bloqueio de envio duplicado enquanto a requisição está em andamento.
5. Com o simulador de regras do Firebase ou emulador, confirmar rejeição de criação anônima, UID/nome de outro usuário, data forjada, campos extras e disciplina inexistente; conferir que update/delete são negados.

## Estrutura do Firestore

```
usuarios/{uid}                         nome, email, curso, semestre, criadoEm
disciplinas/{id}                       nome, codigo, curso, cargaHoraria, modalidade, ementa
disciplinas/{id}/avaliacoes/{uid}      notas { dificuldade, carga_extraclasse, aplicacao_pratica, relevancia }, criadoEm
topicos_avaliacao/{id}                 titulo, descricao, ordem
```

Uma avaliação por aluno por disciplina (o ID do documento é o uid). Edição (F12) e exclusão (F15) ficam para ondas futuras e por isso estão bloqueadas nas regras.

## Rodando localmente

Pré-requisitos: Node 18+, Python 3.12, um projeto Firebase configurado (ver abaixo).

```bash
# 1. Variáveis de ambiente
cp .env.example .env.local        # preencha com os dados do Firebase

# 2. Frontend
npm install

# 3. API Python
python -m venv .venv
source .venv/bin/activate         # Windows (Git Bash): source .venv/Scripts/activate
pip install -r requirements-dev.txt

# 4. Carga inicial do Firestore (uma vez)
python scripts/carga_inicial.py caminho/para/serviceAccountKey.json

# 5. Subir (dois terminais)
set -a; source .env.local; set +a; uvicorn api.index:app --reload --port 8000
npm run dev                        # http://localhost:5173
```

Testes da API: `pytest`

### Windows (PowerShell)

Na primeira instalação, copie `.env.example` para `.env.local` e preencha as seis variáveis `VITE_FIREBASE_*`. Se `.env.local` já estiver configurado, preserve o arquivo.

```powershell
npm.cmd ci
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

Para iniciar a API, use o caminho da chave privada guardada fora do repositório:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT = Get-Content -Raw "C:\caminho\serviceAccountKey.json"
.\.venv\Scripts\python.exe -m uvicorn api.index:app --reload --port 8000
```

A API não carrega `.env.local` automaticamente. Em outro terminal, execute `npm.cmd run dev` e abra http://localhost:5173. Encerre os servidores com Ctrl+C.

A carga de demonstração é feita com `.\.venv\Scripts\python.exe scripts/carga_inicial.py "C:\caminho\serviceAccountKey.json"`. Execute apenas no ambiente de desenvolvimento: o script sobrescreve as cinco disciplinas e os quatro tópicos de teste.

### Validação do ambiente de desenvolvimento

Em 01/11/2026, o ambiente `iluno-dev` foi configurado com Authentication por e-mail/senha, Firestore `(default)`, regras publicadas e dados de demonstração carregados. Foram validados manualmente cadastro, login, saída, consulta de perfil, busca e detalhes de disciplinas, envio de avaliação e persistência das notas após novo login. O build do frontend e os sete testes da API passaram; os testes automatizados usam dados simulados.

As credenciais ficam fora do repositório, no ambiente local ou nas variáveis de ambiente da hospedagem.

### Publicação de referência

O fork `Crisp98/projeto-iluno` foi publicado em https://projeto-iluno-eta.vercel.app com o Firebase `iluno-dev`. Foram verificadas as rotas de saúde, disciplinas, tópicos e detalhe de disciplina, e validados manualmente login, perfil, consulta e envio de avaliações, persistência das notas, saída e novo login.

A publicação original deve receber a mesma configuração de variáveis e ser validada separadamente. O deploy automático deve ser conferido em Deployments após um novo commit na branch de produção, comparando o commit publicado com o enviado ao GitHub.

## Etapas que não são código

Estas precisam ser feitas por alguém da equipe, no navegador ou no terminal, antes de o sistema funcionar.

**Firebase (T15)**
1. Criar o projeto em console.firebase.google.com (o Google Analytics pode ficar desligado).
2. *Authentication → Começar → E-mail/senha → Ativar* (é a parte de "habilitar" do T01).
3. *Firestore Database → Criar banco* em modo de produção, região `southamerica-east1` (São Paulo).
4. *Configurações do projeto → Seus apps → Web (`</>`)*: registrar o app e copiar os valores para o `.env.local`.
5. *Configurações do projeto → Contas de serviço → Gerar nova chave privada*: baixa o JSON da conta de serviço. **Nunca commitar esse arquivo** (já está no `.gitignore`); compartilhar só por canal privado.
6. Publicar as regras: copiar o conteúdo de `firestore.rules` em *Firestore → Regras → Publicar* (ou `npx firebase-tools deploy --only firestore:rules`).
7. Rodar `scripts/carga_inicial.py` uma vez para criar os tópicos e as disciplinas de teste.

**Vercel (T16)**
1. Em vercel.com, *Add New → Project* e importar o repositório `projeto-iluno` do GitHub.
2. Framework: **Vite**, diretório raiz `./`, comando de build `npm run build` e saída `dist`. Os comandos de build já estão no `vercel.json`. Conferir que a branch de produção é `main`.
3. Em *Settings → Environment Variables*, cadastrar as seis `VITE_FIREBASE_*` de `.env.example` com os valores do aplicativo Web Firebase. Selecionar **Production**; configurar Preview também se esse ambiente for utilizado.
4. Cadastrar `FIREBASE_SERVICE_ACCOUNT` com o conteúdo completo do JSON da conta de serviço, incluindo `{` e `}`, sem aspas externas. Não usar o caminho do arquivo nem o prefixo `VITE_`. A conta de serviço deve ter acesso ao mesmo projeto Firebase do frontend. Nunca adicionar essa chave ao Git.
5. Fazer o deploy. Se as variáveis forem alteradas depois, salvar e executar **Redeploy** em Deployments: a alteração não modifica uma publicação existente. As variáveis `VITE_*` são incorporadas ao frontend durante o build.
6. Conferir `/api/health` (deve retornar `{"status":"ok"}`), `/api/disciplinas` e `/api/topicos`. A rota de saúde não acessa o Firebase; se ela funcionar e as consultas retornarem 500, consultar os Logs da Vercel e conferir a credencial da API.
7. Testar login, perfil, busca e avaliações no endereço publicado. Se o Authentication indicar domínio não autorizado, adicionar o hostname exato (por exemplo, `meu-projeto.vercel.app`) em *Authentication → Configurações → Domínios autorizados*, sem protocolo ou caminhos.
8. Confirmar que um novo commit na `main` gera um deployment automático do commit esperado. As variáveis são próprias de cada projeto Vercel e precisam ser cadastradas novamente em outra publicação.

**GitHub**
1. Rodar `criar_issues_onda1.sh` para criar as issues #1 a #11.
2. Commitar `BACKLOG.xlsx` e `STACK.docx` na raiz, e preencher no STACK o link do repositório.
3. Ao fechar cada tarefa, citar a issue no commit ou no PR (ex.: `Closes #5`).
