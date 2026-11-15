// T07 — exibe as informações e os tópicos de avaliação da disciplina,
// com o formulário de avaliação (F03), protegido pelas regras do T08.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { listarTopicos, obterDisciplina } from "../services/api";
import { enviarAvaliacao, obterMinhaAvaliacao } from "../services/avaliacoes";
import Comentarios from "../components/Comentarios";

function Escala({ valor, onChange, rotulo }) {
  return (
    <div className="escala" role="radiogroup" aria-label={rotulo}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={valor === n}
          className={valor === n ? "ativo" : ""}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function Disciplina() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [disciplina, setDisciplina] = useState(null);
  const [topicos, setTopicos] = useState([]);
  const [notas, setNotas] = useState({});
  const [jaAvaliou, setJaAvaliou] = useState(false);
  const [estado, setEstado] = useState({ carregando: true, erro: "", enviando: false, ok: false });

  useEffect(() => {
    Promise.all([obterDisciplina(id), listarTopicos()])
      .then(([d, t]) => {
        setDisciplina(d);
        setTopicos(t.topicos);
        setEstado((s) => ({ ...s, carregando: false }));
      })
      .catch((e) =>
        setEstado((s) => ({
          ...s,
          carregando: false,
          erro: e.status === 404 ? "Disciplina não encontrada." : "Não foi possível carregar a disciplina.",
        }))
      );
  }, [id]);

  useEffect(() => {
    if (!usuario) return;
    obterMinhaAvaliacao(id, usuario.uid).then((a) => {
      if (a) {
        setJaAvaliou(true);
        setNotas(a.notas);
      }
    });
  }, [id, usuario]);

  const completo = topicos.length > 0 && topicos.every((t) => notas[t.id]);

  async function enviar(e) {
    e.preventDefault();
    if (!completo) return;
    setEstado((s) => ({ ...s, enviando: true, erro: "" }));
    try {
      await enviarAvaliacao(id, usuario.uid, notas);
      setJaAvaliou(true);
      setEstado((s) => ({ ...s, enviando: false, ok: true }));
    } catch {
      setEstado((s) => ({ ...s, enviando: false, erro: "Não foi possível enviar a avaliação." }));
    }
  }

  if (estado.carregando) return <p className="aviso">Carregando…</p>;
  if (!disciplina) return <p className="erro bloco">{estado.erro}</p>;

  return (
    <section className="grade">
      <article className="cartao">
        <Link to="/" className="voltar">
          ← Voltar à busca
        </Link>
        <h1>{disciplina.nome}</h1>
        <p className="sub">{disciplina.curso}</p>
        <dl className="dados linha">
          <div>
            <dt>Carga horária</dt>
            <dd>{disciplina.cargaHoraria}h</dd>
          </div>
          <div>
            <dt>Modalidade</dt>
            <dd>{disciplina.modalidade}</dd>
          </div>
          <div>
            <dt>Código</dt>
            <dd>{disciplina.codigo}</dd>
          </div>
        </dl>
        <h2>Ementa</h2>
        <p>{disciplina.ementa}</p>
      </article>

      <aside className="cartao">
        <h2>{jaAvaliou ? "Sua avaliação" : "Avaliar esta disciplina"}</h2>
        {!usuario && (
          <p className="sub">
            <Link to="/entrar">Entre</Link> ou <Link to="/cadastro">crie uma conta</Link> para avaliar.
          </p>
        )}

        <form onSubmit={enviar}>
          {topicos.map((t) => (
            <fieldset key={t.id} className="topico" disabled={!usuario || jaAvaliou}>
              <legend>{t.titulo}</legend>
              <small>{t.descricao}</small>
              <Escala
                rotulo={t.titulo}
                valor={notas[t.id]}
                onChange={(n) => setNotas({ ...notas, [t.id]: n })}
              />
            </fieldset>
          ))}

          {estado.erro && <p className="erro bloco">{estado.erro}</p>}
          {estado.ok && <p className="sucesso">Avaliação enviada. Obrigado!</p>}

          {usuario && !jaAvaliou && (
            <button className="botao" disabled={!completo || estado.enviando}>
              {estado.enviando ? "Enviando…" : "Enviar avaliação"}
            </button>
          )}
        </form>
      </aside>
      <Comentarios key={id} disciplinaId={id} />
    </section>
  );
}
