import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-aprender',
  templateUrl: './aprender.page.html',
  styleUrls: ['./aprender.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, RouterLink, CommonModule, FormsModule]
})
export class AprenderPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
