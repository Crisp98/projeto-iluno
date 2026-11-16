import { addDoc, collection, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export const LIMITE_COMENTARIO = 1000;

export function acompanharComentarios(disciplinaId, receber, falhar) {
  const consulta = query(collection(db, "disciplinas", disciplinaId, "comentarios"), orderBy("criadoEm", "desc"), limit(50));
  return onSnapshot(consulta, (snapshot) => receber(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))), falhar);
}

export async function enviarComentario(disciplinaId, texto) {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error("Entre para comentar.");
  const conteudo = texto.trim();
  if (!conteudo || conteudo.length > LIMITE_COMENTARIO) throw new Error("Escreva entre 1 e 1000 caracteres.");
  const perfil = await getDoc(doc(db, "usuarios", usuario.uid));
  if (!perfil.exists()) throw new Error("Perfil não encontrado.");
  return addDoc(collection(db, "disciplinas", disciplinaId, "comentarios"), {
    texto: conteudo,
    autorUid: usuario.uid,
    autorNome: perfil.data().nome,
    criadoEm: serverTimestamp(),
  });
}
