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
  usuario: Usuario | null = null;
  private usuarioSubscription: Subscription | undefined;

  constructor(
    private firebase: FirebaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.usuarioSubscription = this.firebase.usuario$.subscribe({
      next: (user) => {
        console.log('Usuário atualizado:', user);
        this.usuario = user;
      },
      error: (error) => {
        console.error('Erro ao carregar usuário:', error);
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
  }
}
