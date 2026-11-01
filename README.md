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

As credenciais ficam somente no ambiente local. O deploy e a integração contínua na Vercel ainda estão pendentes de validação.

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
2. Framework: **Vite**. Os comandos de build já estão no `vercel.json`.
3. Em *Settings → Environment Variables*, cadastrar as seis `VITE_FIREBASE_*` e a `FIREBASE_SERVICE_ACCOUNT` (o JSON inteiro da conta de serviço, colado em uma linha).
4. Fazer o deploy e conferir `https://<seu-projeto>.vercel.app/api/health` — deve responder `{"status":"ok"}`.
5. No Firebase, em *Authentication → Configurações → Domínios autorizados*, adicionar o domínio `*.vercel.app` do projeto, senão o login falha em produção.

**GitHub**
1. Rodar `criar_issues_onda1.sh` para criar as issues #1 a #11.
2. Commitar `BACKLOG.xlsx` e `STACK.docx` na raiz, e preencher no STACK o link do repositório.
3. Ao fechar cada tarefa, citar a issue no commit ou no PR (ex.: `Closes #5`).
