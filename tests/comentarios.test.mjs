import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { SourceTextModule, SyntheticModule } from "node:vm";

async function preparar() {
  const auth = { currentUser: { uid: "aluno-1" } };
  const gravacoes = [];
  let existe = true;
  const cancelar = () => {};
  const firestore = {
    addDoc: async (ref, dados) => { gravacoes.push({ ref, dados }); },
    collection: (_db, ...partes) => partes.join("/"),
    doc: (_db, ...partes) => partes.join("/"),
    getDoc: async () => ({ exists: () => existe, data: () => ({ nome: "Ana" }) }),
    limit: (valor) => ({ limite: valor }),
    orderBy: (...valor) => ({ ordem: valor }),
    query: (...valor) => valor,
    onSnapshot: (consulta, receber) => {
      receber({ docs: [{ id: "comentario-1", data: () => ({ texto: "Experiência" }) }] });
      assert.equal(consulta[0], "disciplinas/calculo-i/comentarios");
      assert.equal(consulta[2].limite, 50);
      return cancelar;
    },
    serverTimestamp: () => "timestamp-servidor",
  };
  const modulo = new SourceTextModule(await readFile(new URL("../src/services/comentarios.js", import.meta.url), "utf8"));
  await modulo.link(async (nome) => {
    const valores = nome === "firebase/firestore" ? firestore : { auth, db: {} };
    return new SyntheticModule(Object.keys(valores), function () {
      for (const [chave, valor] of Object.entries(valores)) this.setExport(chave, valor);
    });
  });
  await modulo.evaluate();
  return { api: modulo.namespace, auth, gravacoes, cancelar, semPerfil: () => { existe = false; } };
}

test("comentário usa autor autenticado, nome do perfil, texto aparado e timestamp do servidor", async () => {
  const { api, gravacoes } = await preparar();
  await api.enviarComentario("calculo-i", "  Uma experiência útil  ");
  assert.equal(gravacoes[0].ref, "disciplinas/calculo-i/comentarios");
  assert.deepEqual(gravacoes[0].dados, { texto: "Uma experiência útil", autorUid: "aluno-1", autorNome: "Ana", criadoEm: "timestamp-servidor" });
});

test("recusa visitante, perfil ausente, espaços e texto acima do limite sem gravar", async () => {
  const contexto = await preparar();
  for (const texto of ["", " \n ", "a".repeat(1001)]) await assert.rejects(contexto.api.enviarComentario("calculo-i", texto));
  contexto.semPerfil();
  await assert.rejects(contexto.api.enviarComentario("calculo-i", "Texto"));
  contexto.auth.currentUser = null;
  await assert.rejects(contexto.api.enviarComentario("calculo-i", "Texto"));
  assert.equal(contexto.gravacoes.length, 0);
});

test("assinatura retorna comentários e função para cancelar a escuta", async () => {
  const { api, cancelar } = await preparar();
  let itens;
  assert.equal(api.acompanharComentarios("calculo-i", (dados) => { itens = dados; }, () => {}), cancelar);
  assert.deepEqual(itens, [{ id: "comentario-1", texto: "Experiência" }]);
});
