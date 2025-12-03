import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon } from '@ionic/angular/standalone';
import { FirebaseService, Usuario } from '../../services/firebase';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-metas',
  templateUrl: './metas.page.html',
  styleUrls: ['./metas.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, CommonModule, FormsModule]
})
export class MetasPage implements OnInit, OnDestroy {
  usuario: Usuario | null = null;
  usuarioSub?: Subscription;
  metasSub?: Subscription;
  dadosUsuarioSub?: Subscription;

  metas: any[] = [];

  novaMeta = {
    titulo: '',
    xpAlvo: null as number | null,
    dataInicio: '',
    dataFim: ''
  };

  editandoId: string | null = null;
  carregando = false;

  xpAtual = 0;
  hoje = '';

  constructor(private firebase: FirebaseService, private firestore: Firestore) {}

  ngOnInit() {
    this.usuarioSub = this.firebase.usuario$.subscribe((u) => {
      this.usuario = u;
      if (u) {
        this.inscreverMetas(u.uid);
        if (this.dadosUsuarioSub) {
          this.dadosUsuarioSub.unsubscribe();
        }
        this.dadosUsuarioSub = this.firebase.getDadosUsuario(u.uid).subscribe((dados) => {
          this.xpAtual = dados?.xp || 0;
        });
      } else {
        this.metas = [];
        if (this.metasSub) {
          this.metasSub.unsubscribe();
          this.metasSub = undefined;
        }
        if (this.dadosUsuarioSub) {
          this.dadosUsuarioSub.unsubscribe();
          this.dadosUsuarioSub = undefined;
        }
      }
    });

    const hojeData = new Date();
    const ano = hojeData.getFullYear();
    const mes = String(hojeData.getMonth() + 1).padStart(2, '0');
    const dia = String(hojeData.getDate()).padStart(2, '0');
    this.hoje = `${ano}-${mes}-${dia}`;
  }

  inscreverMetas(uid: string) {
    if (this.metasSub) {
      this.metasSub.unsubscribe();
    }
    const colRef = collection(this.firestore, `usuarios/${uid}/metas`);
    this.metasSub = collectionData(colRef, { idField: 'id' }).subscribe((lista) => {
      this.metas = lista as any[];
    });
  }

  async salvarMeta() {
    if (!this.usuario) return;
    const titulo = this.novaMeta.titulo.trim();
    if (!titulo || !this.novaMeta.xpAlvo) return;

    this.carregando = true;
    const uid = this.usuario.uid;
    const colRef = collection(this.firestore, `usuarios/${uid}/metas`);

    try {
      await addDoc(colRef, {
        titulo,
        xpAlvo: this.novaMeta.xpAlvo,
        dataInicio: this.ajustarDataValida(this.novaMeta.dataInicio),
        dataFim: this.ajustarDataValida(this.novaMeta.dataFim),
        concluida: false,
        podeDarXp: true,
        criadoEm: new Date().toISOString()
      });
      this.novaMeta = {
        titulo: '',
        xpAlvo: null,
        dataInicio: '',
        dataFim: ''
      };
    } finally {
      this.carregando = false;
    }
  }

  selecionarEdicao(meta: any) {
    this.editandoId = meta.id;
    const novoTitulo = window.prompt('Novo título da meta:', meta.titulo || '');
    if (novoTitulo === null) return;
    const novoXp = window.prompt('Novo XP alvo:', String(meta.xpAlvo || ''));
    if (novoXp === null) return;
    const novoInicio = window.prompt('Nova data de início (AAAA-MM-DD):', meta.dataInicio || '');
    if (novoInicio === null) return;
    const novoFim = window.prompt('Nova data de fim (AAAA-MM-DD):', meta.dataFim || '');
    if (novoFim === null) return;

    meta.titulo = novoTitulo.trim();
    meta.xpAlvo = Number(novoXp);
    meta.dataInicio = this.ajustarDataValida(novoInicio);
    meta.dataFim = this.ajustarDataValida(novoFim);
    this.salvarEdicao(meta);
  }

  async salvarEdicao(meta: any) {
    if (!this.usuario || !meta.id) return;
    const uid = this.usuario.uid;
    const ref = doc(this.firestore, `usuarios/${uid}/metas/${meta.id}`);
    await updateDoc(ref, {
      titulo: (meta.titulo || '').trim(),
      xpAlvo: Number(meta.xpAlvo) || 0,
      dataInicio: this.ajustarDataValida(meta.dataInicio),
      dataFim: this.ajustarDataValida(meta.dataFim),
      concluida: !!meta.concluida,
      podeDarXp: false
    });
    this.editandoId = null;
  }

  async excluirMeta(meta: any) {
    if (!this.usuario || !meta.id) return;
    const uid = this.usuario.uid;
    const ref = doc(this.firestore, `usuarios/${uid}/metas/${meta.id}`);
    await deleteDoc(ref);
  }

  async alternarConcluida(meta: any) {
    if (!this.usuario || !meta.id) return;
    const uid = this.usuario.uid;
    const ref = doc(this.firestore, `usuarios/${uid}/metas/${meta.id}`);
    await updateDoc(ref, { concluida: !meta.concluida });
  }

  async concluirMeta(meta: any) {
    if (!this.usuario || !meta.id) return;
    if (!meta.podeDarXp) return;
    const alvo = Number(meta.xpAlvo) || 0;
    if (this.xpAtual < alvo) return;

    const uid = this.usuario.uid;
    const usuarioRef = doc(this.firestore, `usuarios/${uid}`);
    const metaRef = doc(this.firestore, `usuarios/${uid}/metas/${meta.id}`);

    await updateDoc(usuarioRef, { xp: (this.xpAtual || 0) + 100 });
    this.xpAtual = (this.xpAtual || 0) + 100;
    await deleteDoc(metaRef);
  }

  private ajustarDataValida(data: string | null | undefined): string | null {
    if (!data) return null;
    const valor = String(data).slice(0, 10);
    if (valor < this.hoje) {
      return this.hoje;
    }
    return valor;
  }

  ngOnDestroy() {
    if (this.usuarioSub) this.usuarioSub.unsubscribe();
    if (this.metasSub) this.metasSub.unsubscribe();
    if (this.dadosUsuarioSub) this.dadosUsuarioSub.unsubscribe();
  }
}
