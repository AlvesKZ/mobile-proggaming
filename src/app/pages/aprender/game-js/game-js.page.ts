import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { FirebaseService, Usuario } from '../../../services/firebase';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-js',
  templateUrl: './game-js.page.html',
  styleUrls: ['./game-js.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    RouterLink,
    CommonModule,
    FormsModule,
  ],
})
export class GameJSPage implements OnInit, OnDestroy {
  mostrarReinicio = false;
  carregandoReinicio = false;

  private usuarioSub?: Subscription;
  private dadosUsuarioSub?: Subscription;
  private usuarioAtual: Usuario | null = null;

  fases = [
    { numero: 1, descricao: 'Introdução à linguagem', status: 'disponivel', progresso: 0 },
    { numero: 2, descricao: 'Variáveis e Tipos de Dados', status: 'bloqueada', progresso: 0 },
    { numero: 3, descricao: 'Operadores e expressões', status: 'bloqueada', progresso: 0 },
    { numero: 4, descricao: 'Estruturas condicionais', status: 'bloqueada', progresso: 0 },
    { numero: 5, descricao: 'Laços de repetição', status: 'bloqueada', progresso: 0 },
    { numero: 6, descricao: 'Vetores', status: 'bloqueada', progresso: 0 },
    { numero: 7, descricao: 'Funções', status: 'bloqueada', progresso: 0 },
    { numero: 8, descricao: 'Objetos e manipulação de DOM', status: 'bloqueada', progresso: 0 },
    { numero: 9, descricao: 'Eventos', status: 'bloqueada', progresso: 0 },
    { numero: 10, descricao: 'Projeto final', status: 'bloqueada', progresso: 0 },
  ];

  constructor(
    private firebase: FirebaseService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    this.usuarioSub = this.firebase.usuario$.subscribe((usuario) => {
      this.usuarioAtual = usuario;

      if (this.dadosUsuarioSub) {
        this.dadosUsuarioSub.unsubscribe();
        this.dadosUsuarioSub = undefined;
      }

      if (usuario) {
        this.dadosUsuarioSub = this.firebase
          .getDadosUsuario(usuario.uid)
          .subscribe((dados) => {
            const fasesJS = (dados && dados['fasesJS']) || {};

            const map = (faseKey: string) => fasesJS[faseKey] || {};
            const f1 = map('fase1');
            const f2 = map('fase2');
            const f3 = map('fase3');

            this.fases[0].status = f1.status || 'disponivel';
            const n1 = typeof f1.nivelAtual === 'number' ? f1.nivelAtual : 0;
            this.fases[0].progresso = this.calcularProgressoFase1JS(n1, this.fases[0].status);

            this.fases[1].status = f2.status || 'bloqueada';
            const n2 = typeof f2.nivelAtual === 'number' ? f2.nivelAtual : 0;
            this.fases[1].progresso = this.calcularProgressoGenerico(this.fases[1].status, n2);

            this.fases[2].status = f3.status || 'bloqueada';
            const n3 = typeof f3.nivelAtual === 'number' ? f3.nivelAtual : 0;
            this.fases[2].progresso = this.calcularProgressoGenerico(this.fases[2].status, n3);

            for (let i = 3; i < this.fases.length; i++) {
              this.fases[i].status = 'bloqueada';
              this.fases[i].progresso = 0;
            }
          });
      }
    });
  }

  ngOnDestroy() {
    if (this.usuarioSub) {
      this.usuarioSub.unsubscribe();
    }
    if (this.dadosUsuarioSub) {
      this.dadosUsuarioSub.unsubscribe();
    }
  }

  private calcularProgressoFase1JS(nivelAtual: number, status: string): number {
    if (status === 'concluida') {
      return 100;
    }
    const totalNiveis = 6;
    const progresso = (nivelAtual / totalNiveis) * 100;
    return Math.max(0, Math.min(100, progresso));
  }

  private calcularProgressoGenerico(status: string, nivelAtual: number): number {
    if (status === 'concluida') {
      return 100;
    }
    if (status === 'disponivel' && nivelAtual > 0) {
      return 20;
    }
    return 0;
  }

  async confirmarReinicio() {
    if (!this.usuarioAtual) {
      alert('Você precisa estar logado para reiniciar o progresso de JavaScript.');
      return;
    }

    this.carregandoReinicio = true;
    try {
      const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
      await updateDoc(ref, {
        'fasesJS.fase1': { status: 'disponivel', nivelAtual: 0 },
        'fasesJS.fase2': { status: 'bloqueada', nivelAtual: 0 },
        'fasesJS.fase3': { status: 'bloqueada', nivelAtual: 0 },
      });

      alert('Progresso em JavaScript reiniciado com sucesso!');
    } catch (e) {
      console.error('Erro ao reiniciar progresso JS:', e);
      alert('Ocorreu um erro ao tentar reiniciar o progresso de JavaScript.');
    } finally {
      this.carregandoReinicio = false;
    }
  }

  getLinkFase(numero: number): string {
    switch (numero) {
      case 1:
        return '/js-fase1';
      case 2:
        return '/js-fase2';
      case 3:
        return '/js-fase3';
      default:
        return '/game-js';
    }
  }
}