import { Component } from '@angular/core';
import { 
  IonApp, 
  IonRouterOutlet,
  IonMenu,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonButton,
  IonFooter,
  IonSplitPane
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FirebaseService } from './services/firebase';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonToolbar,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonButton,
    IonFooter,
    IonSplitPane
  ]
})
export class AppComponent {
  usuario$ = this.firebase.usuario$;
  xpTotal$: Observable<number> = new Observable<number>();
  novasMensagens$: Observable<number> = new Observable<number>();
  metasCompletas$: Observable<number> = new Observable<number>();

  constructor(private firebase: FirebaseService) {}

  async sair() {
    try {
      await this.firebase.logout();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  }
}