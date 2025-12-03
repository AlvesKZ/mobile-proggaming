import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { FirebaseService, Usuario } from '../../services/firebase';

interface AvatarOption {
  path: string;
  requiredXp: number;
}

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  templateUrl: './editar-perfil.page.html',
  styleUrls: ['./editar-perfil.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class EditarPerfilPage implements OnInit, OnDestroy {

  usuarioBase: Usuario | null = null;
  usuarioDados: any = null;
  private subUsuario?: Subscription;
  private subDados?: Subscription;

  novoApelido = '';
  mensagemUsername = '';
  mensagemCor: 'success' | 'danger' | '' = '';

  availableAvatars: AvatarOption[] = [
    { path: 'assets/avatars/avatar.jpg', requiredXp: 0 },
    { path: 'assets/avatars/avatar2.jpg', requiredXp: 0 },
    { path: 'assets/avatars/avatar3.jpg', requiredXp: 0 },
    { path: 'assets/avatars/avatar4.jpg', requiredXp: 0 },
    { path: 'assets/avatars/avatar5.jpg', requiredXp: 0 },
    { path: 'assets/avatars/avatar6.jpg', requiredXp: 0 },
    { path: 'assets/avatars/avatar7.jpg', requiredXp: 0 },
    { path: 'assets/avatars/avatar8.jpg', requiredXp: 0 },
    { path: 'assets/avatars/avatar9.jpg', requiredXp: 1000 },
    { path: 'assets/avatars/avatar10.jpg', requiredXp: 2000 },
  ];

  selectedAvatarPath = '';
  currentUserXP = 0;
  statusAvatar = '';
  salvando = false;

  constructor(
    private firebase: FirebaseService,
    private firestore: Firestore,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subUsuario = this.firebase.usuario$.subscribe({
      next: (user) => {
        if (!user) {
          this.router.navigate(['/registrar']);
          return;
        }
        this.usuarioBase = user;
        this.carregarDadosUsuario(user.uid);
      },
      error: () => {
        this.router.navigate(['/registrar']);
      }
    });
  }

  private carregarDadosUsuario(uid: string) {
    this.subDados = this.firebase.getDadosUsuario(uid).subscribe(dados => {
      this.usuarioDados = dados;
      this.currentUserXP = dados?.xp ?? 0;
      this.selectedAvatarPath = dados?.avatarUrl || this.availableAvatars[0].path;
      this.novoApelido = dados?.apelido || dados?.nomeExibicao || dados?.email || '';
    });
  }

  selecionarAvatar(avatar: AvatarOption) {
    this.statusAvatar = '';
    if (this.currentUserXP < avatar.requiredXp) {
      this.statusAvatar = `Você precisa de ${avatar.requiredXp} XP para desbloquear este avatar.`;
      return;
    }
    this.selectedAvatarPath = avatar.path;
  }

  async salvarAlteracoes() {
    if (!this.usuarioBase) return;

    const uid = this.usuarioBase.uid;
    const ref = doc(this.firestore, `usuarios/${uid}`);

    const apelido = (this.novoApelido || '').trim();
    if (!apelido) {
      this.mensagemCor = 'danger';
      this.mensagemUsername = 'Digite um apelido válido!';
      return;
    }

    this.salvando = true;
    try {
      await updateDoc(ref, {
        apelido,
        avatarUrl: this.selectedAvatarPath
      });
      this.mensagemCor = 'success';
      this.mensagemUsername = 'Perfil atualizado com sucesso!';
    } catch (e) {
      console.error(e);
      this.mensagemCor = 'danger';
      this.mensagemUsername = 'Erro ao salvar alterações.';
    } finally {
      this.salvando = false;
    }
  }

  voltar() {
    this.router.navigate(['/inicial']);
  }

  ngOnDestroy(): void {
    if (this.subUsuario) this.subUsuario.unsubscribe();
    if (this.subDados) this.subDados.unsubscribe();
  }
}
