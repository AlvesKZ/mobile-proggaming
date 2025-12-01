import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  user
} from '@angular/fire/auth';

import { Firestore, doc, setDoc, docData, getDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface Usuario {
  uid: string;
  email: string;
  nomeExibicao?: string;
  fotoUrl?: string;
  apelido?: string;
  avatarUrl?: string;
  nivelAtual?: number;
  xp?: number;
  fasesHTML?: any;
  codigoAtual?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);

  constructor() {}

  usuario$: Observable<Usuario | null> = user(this.auth).pipe(
    map(usuario => {
      if (!usuario) return null;

      return {
        uid: usuario.uid,
        email: usuario.email ?? '',
        nomeExibicao: usuario.displayName ?? '',
        fotoUrl: usuario.photoURL ?? ''
      };
    })
  );

  async loginEmailSenha(email: string, senha: string): Promise<Usuario> {
    const cred = await signInWithEmailAndPassword(this.auth, email, senha);
    const usuario = cred.user;

    await this.criarDocumentoSeNaoExistir(usuario.uid, usuario.email ?? '');

    return {
      uid: usuario.uid,
      email: usuario.email ?? '',
      nomeExibicao: usuario.displayName ?? '',
      fotoUrl: usuario.photoURL ?? ''
    };
  }

  async cadastrarEmailSenha(email: string, senha: string): Promise<Usuario> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, senha);
    const usuario = cred.user;

    await this.criarDocumentoSeNaoExistir(usuario.uid, usuario.email ?? '');

    return {
      uid: usuario.uid,
      email: usuario.email ?? ''
    };
  }

  async loginGoogleRedirect() {
    const provedor = new GoogleAuthProvider();
    await signInWithRedirect(this.auth, provedor);
  }

  async verificarRetornoGoogle(): Promise<Usuario | null> {
    const result = await getRedirectResult(this.auth);
    if (!result) return null;

    const usuario = result.user;

    await this.criarDocumentoSeNaoExistir(usuario.uid, usuario.email ?? '');

    return {
      uid: usuario.uid,
      email: usuario.email ?? '',
      nomeExibicao: usuario.displayName ?? '',
      fotoUrl: usuario.photoURL ?? ''
    };
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async criarDocumentoSeNaoExistir(uid: string, email: string) {
    const ref = doc(this.firestore, `usuarios/${uid}`);
    const snap = await getDoc(ref);

    // Se o documento já existe, não resetar os campos (xp, fasesHTML, etc.)
    if (snap.exists()) {
      return;
    }

    await setDoc(
      ref,
      {
        uid,
        email,
        nivelAtual: 1,
        xp: 0,
        fasesHTML: {},
        codigoAtual: '',
        status: 'ativo'
      },
      { merge: true }
    );
  }

  getDadosUsuario(uid: string): Observable<any> {
    const ref = doc(this.firestore, `usuarios/${uid}`);
    return docData(ref);
  }
}
