import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { acompanharComentarios, enviarComentario, LIMITE_COMENTARIO } from "../services/comentarios";

export default function Comentarios({ disciplinaId }) {
  const { usuario } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erroEnvio, setErroEnvio] = useState("");
  const bloqueado = useRef(false);

  useEffect(() => acompanharComentarios(disciplinaId, (itens) => {
    setComentarios(itens);
    setCarregando(false);
    setErroLista("");
  }, () => {
    setCarregando(false);
    setErroLista("Não foi possível carregar os comentários.");
  }), [disciplinaId]);

  useEffect(() => {
    setTexto("");
    setMensagem("");
    setErroEnvio("");
  }, [usuario?.uid]);

  async function enviar(e) {
    e.preventDefault();
    if (!usuario || !texto.trim() || bloqueado.current) return;
    bloqueado.current = true;
    setEnviando(true);
    setErroEnvio("");
    setMensagem("");
    try {
      await enviarComentario(disciplinaId, texto);
      setTexto("");
      setMensagem("Comentário enviado.");
    } catch {
      setErroEnvio("Não foi possível enviar o comentário. Confira sua conexão e tente novamente.");
    } finally {
      bloqueado.current = false;
      setEnviando(false);
    }
  }

  return (
    <section className="cartao comentarios" aria-labelledby="titulo-comentarios">
      <h2 id="titulo-comentarios">Comentários da disciplina</h2>
      <p className="sub">Compartilhe sua experiência com respeito. Seu nome ficará visível junto ao comentário.</p>
      {usuario ? (
        <form onSubmit={enviar}>
          <label className="campo" htmlFor="comentario-texto">
            <span>Seu comentário</span>
            <textarea id="comentario-texto" rows={4} value={texto} maxLength={LIMITE_COMENTARIO}
              disabled={enviando} onChange={(e) => setTexto(e.target.value)} aria-describedby="comentario-limite" required />
          </label>
          <p id="comentario-limite" className="sub">{texto.length}/{LIMITE_COMENTARIO} caracteres</p>
          {erroEnvio && <p className="erro" role="alert">{erroEnvio}</p>}
          <p className="sucesso" role="status">{mensagem}</p>
          <button className="botao" disabled={enviando || !texto.trim()}>{enviando ? "Enviando…" : "Enviar comentário"}</button>
        </form>
      ) : <p><Link to="/entrar">Entre</Link> ou <Link to="/cadastro">crie uma conta</Link> para comentar.</p>}
      {carregando && <p role="status">Carregando comentários…</p>}
      {erroLista && <p className="erro" role="alert">{erroLista}</p>}
      {!carregando && !erroLista && !comentarios.length && <p>Ainda não há comentários nesta disciplina.</p>}
      {!!comentarios.length && <>
        <p className="sub">Até 50 comentários mais recentes.</p>
        <ul className="comentarios-lista">{comentarios.map((comentario) => {
          const data = comentario.criadoEm?.toDate?.();
          return <li key={comentario.id}>
            <strong>{comentario.autorNome}</strong>
            {data && <> · <time dateTime={data.toISOString()}>{data.toLocaleString("pt-BR")}</time></>}
            <p>{comentario.texto}</p>
          </li>;
        })}</ul>
      </>}
    </section>
  );
}
