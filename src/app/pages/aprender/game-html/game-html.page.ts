import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { FirebaseService, Usuario } from '../../../services/firebase';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-html',
  templateUrl: './game-html.page.html',
  styleUrls: ['./game-html.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, RouterLink, CommonModule, FormsModule]
})
export class GameHTMLPage implements OnInit, OnDestroy {

  mostrarReinicio = false;
  carregandoReinicio = false;

  private usuarioSub?: Subscription;
  private dadosUsuarioSub?: Subscription;
  private usuarioAtual: Usuario | null = null;

  fase1 = { status: 'disponivel', nivelAtual: 0, progresso: 0 };
  fase2 = { status: 'bloqueada', nivelAtual: 0, progresso: 0 };
  fase3 = { status: 'bloqueada', nivelAtual: 0, progresso: 0 };

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
            const fasesHTML = (dados && dados['fasesHTML']) || {};
            const fase1 = fasesHTML.fase1 || {};
            const fase2 = fasesHTML.fase2 || {};
            const fase3 = fasesHTML.fase3 || {};

            this.fase1.status = fase1.status || 'disponivel';
            this.fase1.nivelAtual = typeof fase1.nivelAtual === 'number' ? fase1.nivelAtual : 0;
            this.fase1.progresso = this.calcularProgressoFase1(this.fase1.nivelAtual, this.fase1.status);

            this.fase2.status = fase2.status || 'bloqueada';
            this.fase2.nivelAtual = typeof fase2.nivelAtual === 'number' ? fase2.nivelAtual : 0;
            this.fase2.progresso = this.calcularProgressoGenerico(this.fase2.status, this.fase2.nivelAtual);

            this.fase3.status = fase3.status || 'bloqueada';
            this.fase3.nivelAtual = typeof fase3.nivelAtual === 'number' ? fase3.nivelAtual : 0;
            this.fase3.progresso = this.calcularProgressoGenerico(this.fase3.status, this.fase3.nivelAtual);
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

  private calcularProgressoFase1(nivelAtual: number, status: string): number {
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

  abrirReinicio() {
    this.mostrarReinicio = true;
  }

  cancelarReinicio() {
    this.mostrarReinicio = false;
  }

  async confirmarReinicio() {
    if (!this.usuarioAtual) {
      return;
    }

    this.carregandoReinicio = true;
    try {
      const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
      await updateDoc(ref, {
        'fasesHTML.fase1': { status: 'disponivel', nivelAtual: 0 },
        'fasesHTML.fase2': { status: 'bloqueada', nivelAtual: 0 }
      });
      this.mostrarReinicio = false;
      alert('Progresso em HTML reiniciado com sucesso!');
    } catch (e) {
      console.error('Erro ao reiniciar progresso HTML:', e);
      alert('Ocorreu um erro ao tentar reiniciar o progresso.');
    } finally {
      this.carregandoReinicio = false;
    }
  }
}
