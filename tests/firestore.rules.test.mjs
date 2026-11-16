import { before, beforeEach, after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";

let ambiente;
before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("Execute npm run test:rules para iniciar o emulador local.");
  ambiente = await initializeTestEnvironment({
    projectId: "demo-iluno-rules",
    firestore: { host: "127.0.0.1", port: 8080, rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
});
beforeEach(async () => {
  await ambiente.clearFirestore();
  await ambiente.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "usuarios/aluno-1"), { nome: "Ana" });
    await setDoc(doc(db, "disciplinas/calculo-i"), { nome: "Cálculo I" });
    await setDoc(doc(db, "disciplinas/calculo-i/comentarios/existente"), {
      texto: "Experiência", autorUid: "aluno-1", autorNome: "Ana", criadoEm: Timestamp.now(),
    });
  });
});
after(async () => { await ambiente?.cleanup(); });

const banco = (uid = "aluno-1") => ambiente.authenticatedContext(uid).firestore();
const ref = (db, id = "novo", disciplina = "calculo-i") => doc(db, `disciplinas/${disciplina}/comentarios/${id}`);
const dados = (extras = {}) => ({ texto: "Gostei da disciplina", autorUid: "aluno-1", autorNome: "Ana", criadoEm: serverTimestamp(), ...extras });

test("autor autenticado com perfil cria comentário válido, inclusive multilinha", async () => {
  const db = banco();
  await assertSucceeds(setDoc(ref(db), dados({ texto: "Primeira linha\nSegunda linha" })));
});
test("visitante lê comentários, mas não pode criar", async () => {
  const db = ambiente.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(ref(db, "existente")));
  await assertSucceeds(getDocs(collection(db, "disciplinas/calculo-i/comentarios")));
  await assertFails(setDoc(ref(db), dados()));
});
test("rejeita UID de outro usuário", async () => {
  const db = banco();
  await assertFails(setDoc(ref(db), dados({ autorUid: "outro" })));
});
test("rejeita nome diferente do perfil", async () => {
  const db = banco();
  await assertFails(setDoc(ref(db), dados({ autorNome: "Outra pessoa" })));
});
test("rejeita usuário sem perfil e disciplina inexistente", async () => {
  const db = banco("sem-perfil");
  await assertFails(setDoc(ref(db), dados({ autorUid: "sem-perfil" })));
  await assertFails(setDoc(ref(banco(), "novo", "inexistente"), dados()));
});
test("rejeita data forjada, campo extra e campo ausente", async () => {
  const db = banco();
  await assertFails(setDoc(ref(db), dados({ criadoEm: Timestamp.fromMillis(0) })));
  await assertFails(setDoc(ref(db), dados({ administrador: true })));
  const incompleto = dados();
  delete incompleto.autorNome;
  await assertFails(setDoc(ref(db), incompleto));
});
test("valida texto nas regras, incluindo vazio, espaços, tipo e tamanho", async () => {
  const db = banco();
  for (const texto of ["", "   ", "\n\t ", "a".repeat(1001), 123]) {
    await assertFails(setDoc(ref(db), dados({ texto })));
  }
  await assertSucceeds(setDoc(ref(db), dados({ texto: "a".repeat(1000) })));
});
test("nem o próprio autor pode editar, excluir ou sobrescrever", async () => {
  const db = banco();
  await assertFails(updateDoc(ref(db, "existente"), { texto: "Alterado" }));
  await assertFails(deleteDoc(ref(db, "existente")));
  await assertFails(setDoc(ref(db, "existente"), dados()));
});
