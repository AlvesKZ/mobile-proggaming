import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { FirebaseService, Usuario } from '../../../services/firebase';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-css',
  templateUrl: './game-css.page.html',
  styleUrls: ['./game-css.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, CommonModule, FormsModule, RouterLink]
})
export class GameCSSPage implements OnInit, OnDestroy {

  mostrarReinicio = false;
  carregandoReinicio = false;

  private usuarioSub?: Subscription;
  private dadosUsuarioSub?: Subscription;
  private usuarioAtual: Usuario | null = null;

  fases = [
    { numero: 1, descricao: 'Introdução ao CSS', status: 'disponivel', progresso: 0 },
    { numero: 2, descricao: 'Disponível em breve', status: 'bloqueada', progresso: 0 },
    { numero: 3, descricao: 'Disponível em breve', status: 'bloqueada', progresso: 0 },
    { numero: 4, descricao: 'Disponível em breve', status: 'bloqueada', progresso: 0 },
    { numero: 5, descricao: 'Disponível em breve', status: 'bloqueada', progresso: 0 },
    { numero: 6, descricao: 'Disponível em breve', status: 'bloqueada', progresso: 0 },
    { numero: 7, descricao: 'Disponível em breve', status: 'bloqueada', progresso: 0 },
    { numero: 8, descricao: 'Disponível em breve', status: 'bloqueada', progresso: 0 },
    { numero: 9, descricao: 'Disponível em breve', status: 'bloqueada', progresso: 0 },
    { numero: 10, descricao: 'Disponível em breve', status: 'bloqueada', progresso: 0 },
  ];

  constructor(
    private firebase: FirebaseService,
    private firestore: Firestore
  ) { }

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
            const fasesCSS = (dados && dados['fasesCSS']) || {};
            const fase1 = fasesCSS.fase1 || {};

            // Atualiza status e progresso da fase 1 de CSS
            this.fases[0].status = fase1.status || 'disponivel';
            const nivelAtual = typeof fase1.nivelAtual === 'number' ? fase1.nivelAtual : 0;
            this.fases[0].progresso = this.calcularProgressoFase1CSS(nivelAtual, this.fases[0].status);
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

  private calcularProgressoFase1CSS(nivelAtual: number, status: string): number {
    if (status === 'concluida') {
      return 100;
    }

    const totalNiveis = 10;
    const progresso = (nivelAtual / totalNiveis) * 100;
    return Math.max(0, Math.min(100, progresso));
  }

  async confirmarReinicio() {
    if (!this.usuarioAtual) {
      alert('Você precisa estar logado para reiniciar o progresso de CSS.');
      return;
    }

    this.carregandoReinicio = true;
    try {
      const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
      await updateDoc(ref, {
        'fasesCSS.fase1': { status: 'disponivel', nivelAtual: 0 },
        'fasesCSS.fase2': { status: 'bloqueada', nivelAtual: 0 },
        codigoCSSAtual: '',
        fase1CSSConcluida: false
      });

      alert('Progresso em CSS reiniciado com sucesso!');
    } catch (e) {
      console.error('Erro ao reiniciar progresso CSS:', e);
      alert('Ocorreu um erro ao tentar reiniciar o progresso de CSS.');
    } finally {
      this.carregandoReinicio = false;
    }
  }

}
