import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase';

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './registrar.page.html',
  styleUrls: ['./registrar.page.scss']
})
export class RegistrarPage implements OnInit {

  email = '';
  senha = '';
  ehLogin = true;
  carregando = false;
  mensagemErro = '';
  mostrarOverlayCarregamento = false;
  mostrarModalBemVindo = false;

  constructor(
    private firebase: FirebaseService,
    private router: Router,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
  }

  alternarModoAuth() {
    this.ehLogin = !this.ehLogin;
    this.mensagemErro = '';
  }

  async processarAuth() {
    this.carregando = true;
    this.mostrarOverlayCarregamento = true;
    this.mensagemErro = '';

    try {
      if (this.ehLogin) {
        await this.firebase.loginEmailSenha(this.email, this.senha);
      } else {
        await this.firebase.cadastrarEmailSenha(this.email, this.senha);
      }

      this.router.navigateByUrl('/inicial', { replaceUrl: true });

    } catch (erro: any) {
      this.mensagemErro = this.traduzirErro(erro?.message || erro);
    }

    this.carregando = false;
    this.mostrarOverlayCarregamento = false;
  }

  redefinirSenha() {
    this.mensagemErro = 'A redefinição de senha será adicionada futuramente.';
  }

  traduzirErro(erro: string): string {
    if (erro.includes('auth/email-already-in-use')) return 'Este e-mail já está em uso.';
    if (erro.includes('auth/invalid-email')) return 'E-mail inválido.';
    if (erro.includes('auth/wrong-password')) return 'Senha incorreta.';
    if (erro.includes('auth/user-not-found')) return 'Usuário não encontrado.';
    if (erro.includes('auth/weak-password')) return 'A senha deve ter pelo menos 6 caracteres.';
    return 'Ocorreu um erro. Tente novamente.';
  }

  fecharModalBemVindo() {
    this.mostrarModalBemVindo = false;
  }
}
