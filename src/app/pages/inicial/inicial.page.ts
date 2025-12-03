import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService, Usuario } from '../../services/firebase';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-inicial',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './inicial.page.html',
  styleUrls: ['./inicial.page.scss']
})
export class InicialPage implements OnInit, OnDestroy {
  usuario: (Usuario & { xp?: number; apelido?: string; avatarUrl?: string }) | null = null;
  private usuarioSubscription: Subscription | undefined;
  private dadosUsuarioSubscription: Subscription | undefined;
  ranking: (Usuario & { xp?: number; apelido?: string; avatarUrl?: string })[] = [];

  constructor(
    private firebase: FirebaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.usuarioSubscription = this.firebase.usuario$.subscribe({
      next: (user) => {
        if (!user) {
          this.usuario = null;
          if (this.dadosUsuarioSubscription) {
            this.dadosUsuarioSubscription.unsubscribe();
            this.dadosUsuarioSubscription = undefined;
          }
          return;
        }

        if (this.dadosUsuarioSubscription) {
          this.dadosUsuarioSubscription.unsubscribe();
        }

        this.dadosUsuarioSubscription = this.firebase.getDadosUsuario(user.uid).subscribe({
          next: (dados) => {
            this.usuario = {
              ...user,
              ...(dados || {})
            };
          },
          error: (error) => {
            console.error('Erro ao carregar dados do usuário no Firestore:', error);
            this.usuario = user;
          }
        });
      },
      error: (error) => {
        console.error('Erro ao carregar usuário:', error);
      }
    });

    this.firebase.getRankingTop10().subscribe({
      next: (lista) => {
        this.ranking = lista as (Usuario & { xp?: number; apelido?: string; avatarUrl?: string })[];
      },
      error: (error) => {
        console.error('Erro ao carregar ranking:', error);
      }
    });
  }

  editarPerfil() {
    this.router.navigate(['/editar-perfil']);
  }

  ngOnDestroy() {
    if (this.usuarioSubscription) {
      this.usuarioSubscription.unsubscribe();
    }
    if (this.dadosUsuarioSubscription) {
      this.dadosUsuarioSubscription.unsubscribe();
    }
  }
}
