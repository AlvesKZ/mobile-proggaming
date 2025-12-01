import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, initializeAuth, browserLocalPersistence } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

import { environment } from './environments/environment';

import { provideIonicAngular } from '@ionic/angular/standalone';
import { inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';


bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular(),
    provideRouter(routes),

    provideFirebaseApp(() => initializeApp(environment.firebase)),

    provideAuth(() => {
      const app = inject(FirebaseApp);

      return initializeAuth(app, {
        persistence: browserLocalPersistence
      });
    }),

    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ]
});
