import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'registrar',
    pathMatch: 'full',
  },
  {
    path: 'registrar',
    loadComponent: () => import('./pages/registrar/registrar.page').then( m => m.RegistrarPage)
  },
  {
    path: 'inicial',
    loadComponent: () => import('./pages/inicial/inicial.page').then( m => m.InicialPage)
  },
  {
    path: 'editar-perfil',
    loadComponent: () => import('./pages/editar-perfil/editar-perfil.page').then( m => m.EditarPerfilPage)
  },
  {
    path: 'aprender',
    loadComponent: () => import('./pages/aprender/aprender.page').then( m => m.AprenderPage)
  },
  {
    path: 'game-js',
    loadComponent: () => import('./pages/aprender/game-js/game-js.page').then( m => m.GameJSPage)
  },
  {
    path: 'game-html',
    loadComponent: () => import('./pages/aprender/game-html/game-html.page').then( m => m.GameHTMLPage)
  },
  {
    path: 'game-css',
    loadComponent: () => import('./pages/aprender/game-css/game-css.page').then( m => m.GameCSSPage)
  },
  {
    path: 'fase1',
    loadComponent: () => import('./pages/aprender/game-html/fase1/fase1.page').then( m => m.Fase1Page)
  },
  {
    path: 'fase2',
    loadComponent: () => import('./pages/aprender/game-html/fase2/fase2.page').then( m => m.Fase2Page)
  },
  {
    path: 'fase3',
    loadComponent: () => import('./pages/aprender/game-html/fase3/fase3.page').then( m => m.Fase3Page)
  },
  {
    path: 'css-fase1',
    loadComponent: () => import('./pages/aprender/game-css/fase1/fase1.page').then( m => m.Fase1CSSPage)
  },
  {
    path: 'js-fase1',
    loadComponent: () => import('./pages/aprender/game-js/fase1/fase1.page').then( m => m.Fase1Page)
  },
  {
    path: 'js-fase2',
    loadComponent: () => import('./pages/aprender/game-js/fase2/fase2.page').then( m => m.Fase2Page)
  },
  {
    path: 'js-fase3',
    loadComponent: () => import('./pages/aprender/game-js/fase3/fase3.page').then( m => m.Fase3Page)
  },
  {
    path: 'academy',
    loadComponent: () => import('./pages/academy/academy.page').then( m => m.AcademyPage)
  },
  {
    path: 'chatbot',
    loadComponent: () => import('./pages/academy/chatbot/chatbot.page').then( m => m.ChatbotPage)
  },
];
