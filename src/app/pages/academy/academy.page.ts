import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton } from '@ionic/angular/standalone';

interface AcademyItem {
  titulo: string;
  imagem: string;
  category: string;
  link: string;
  by?: string;
}

@Component({
  selector: 'app-academy',
  templateUrl: './academy.page.html',
  styleUrls: ['./academy.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
  ]
})
export class AcademyPage implements OnInit {

  itensHtml: AcademyItem[] = [];
  itensCss: AcademyItem[] = [];
  itensJs: AcademyItem[] = [];
  itensMoreTech: AcademyItem[] = [];

  activeSection: 'filehtml' | 'filecss' | 'filejs' | 'moretech' | 'nada' = 'nada';
  loading = true;
  errorMessage = '';
  modalAberto = false;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.carregarItens();
  }

  private carregarItens() {
    // caminho esperado: assets/data.json (raiz de assets)
    this.http.get<AcademyItem[]>('assets/data.json').subscribe({
      next: (data) => {
        this.loading = false;
        this.errorMessage = '';
        this.itensHtml = data.filter((i) => i.category === 'html');
        this.itensCss = data.filter((i) => i.category === 'css');
        this.itensJs = data.filter((i) => i.category === 'js');
        this.itensMoreTech = data.filter((i) => i.category !== 'html' && i.category !== 'css' && i.category !== 'js');
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Não foi possível carregar os materiais da Academy.';
      },
    });
  }

  setSection(sec: 'filehtml' | 'filecss' | 'filejs' | 'moretech' | 'nada') {
    this.activeSection = sec;
  }

  abrirModal() {
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  getAnoAtual(): number {
    return new Date().getFullYear();
  }

  getImagemPath(nome: string): string {
    // imagens/pdfs estão em assets/files
    return `assets/files/${nome}`;
  }

  getArquivoPath(link: string): string {
    // links podem vir como 'files/arquivo.pdf' ou só 'arquivo.pdf'
    if (!link) return '#';
    const clean = link.startsWith('files/') ? link.substring(6) : link;
    return `assets/files/${clean}`;
  }
}
