import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { FirebaseService, Usuario } from '../../../../services/firebase';
import { Firestore, doc, getDoc, runTransaction, setDoc, updateDoc, increment } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

interface NivelCSS {
  titulo: string;
  descricao: string;
  teoria: string;
  extra: string;
  respostaEsperada: RegExp;
}

@Component({
  selector: 'app-fase1-css',
  templateUrl: './fase1.page.html',
  styleUrls: ['./fase1.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class Fase1CSSPage implements OnInit, OnDestroy {

  private usuarioSub?: Subscription;
  private usuarioAtual: Usuario | null = null;

  somAtivo = true;
  nivelAtual = 0;
  faseJaConcluida = false;
  faseConcluida = false;
  mensagemConclusao = '';
  private ultimoCodigoAceito = '';
  private precisaAlterarCodigo = false;
  botaoDesabilitado = false;
  private extraVisivel = false;
  private extraHtmlAtual = '';

  niveisCSS: NivelCSS[] = [
    {
      titulo: 'Nível 1/10: A Cor Base',
      descricao:
        "Mude a cor de fundo (background-color) do bloco-teoria para 'black' (preto) para começar a 'hackear' o tema.",
      teoria:
        'A classe .bloco-teoria é o contêiner de tudo que é visível. Modificar seu background é a forma mais rápida de mudar o tema visual do site.',
      extra:
        'Use a propriedade <code>{ background-color: black; }</code> no seletor <code>.bloco-teoria</code>.',
      respostaEsperada: /\.bloco-teoria{background-color:black;}/i
    },
    {
      titulo: 'Nível 2/10: Hackeando a Classe',
      descricao:
        "Selecione o bloco de Teoria (classe .bloco-teoria) e defina sua largura (width) para '500px'.",
      teoria:
        'Classes (.nome) permitem estilizar grupos de elementos. Mudar a largura (width) é fundamental no layout, mas cuidado com a quebra da responsividade!',
      extra: 'Ex: .bloco-teoria { width: 500px; }',
      respostaEsperada: /\.bloco-teoria{width:500px;}/i
    },
    {
      titulo: 'Nível 3/10: O Título Monstro',
      descricao:
        "Selecione o título do nível (ID #titulo-nivel) e aumente seu tamanho para '40px'.",
      teoria:
        'IDs (#nome) selecionam um elemento único. Modificar o font-size pode quebrar o layout, mas é essencial para dar destaque!',
      extra: 'Use o seletor #titulo-nivel e font-size.',
      respostaEsperada: /#titulo-nivel{font-size:40px;}/i
    },
    {
      titulo: 'Nível 4/10: A Margem Invisível',
      descricao: "Modifique a margem externa (margin) do BODY, definindo-a como '20'.",
      teoria:
        'O navegador aplica uma margem padrão ao body. Alterar isso é o primeiro passo de qualquer CSS reset para ter controle total sobre o layout.',
      extra: 'Use margin: 20px; no seletor body.',
      respostaEsperada: /body{margin:20px;}/i
    },
    {
      titulo: 'Nível 5/10: Botão de Ação!',
      descricao:
        "Mude a cor de fundo dos botões (button) para o verde da barra de progresso: '#4CAF50'.",
      teoria:
        'Seletores de tag (button) afetam todos os botões. Cores chamativas são usadas para Ação e Sucesso na gamificação.',
      extra: 'Use o seletor button e background-color.',
      respostaEsperada: /button{background-color:#4CAF50;}/i
    },
    {
      titulo: 'Nível 6/10: Borda de Hacker',
      descricao:
        "Adicione uma borda (border) de '3px solid white' ao contêiner do Editor (classe .editor-container).",
      teoria:
        'A propriedade border é parte do Box Model. Ajuda a destacar áreas importantes e a dar aquele visual de terminal ou hacker.',
      extra: 'Lembre-se: { border: 3px solid white; }',
      respostaEsperada: /\.editor-container{border:3px solid white;}/i
    },
    {
      titulo: 'Nível 7/10: Sumiço da Barra',
      descricao:
        "Selecione a barra de progresso (classe .progresso) e defina sua altura (height) para '5px'.",
      teoria:
        'Mudar a height (altura) é vital para layout. Neste caso, você está disfarçando a barra para dar um toque sutil de progresso.',
      extra: 'Use o seletor .progresso para encolher a barra.',
      respostaEsperada: /\.progresso{height:5px;}/i
    },
    {
      titulo: 'Nível 8/10: Hackeando a Fonte',
      descricao:
        "Mude a família da fonte (font-family) de todo o BODY para 'Roboto'.",
      teoria:
        'A propriedade font-family é herdada por quase todos os elementos. Mudar a fonte base afeta o visual de todo o site.',
      extra: "A fonte 'Roboto' é mais limpa.",
      respostaEsperada: /body{font-family:'Roboto';}/i
    },
    {
      titulo: 'Nível 9/10: Centralização na Caixa',
      descricao:
        'Tente centralizar a caixa de Teoria (.bloco-teoria) horizontalmente. Defina a largura para 500px e use margin: 0 auto;.',
      teoria:
        'Para centralizar um bloco: 1. Defina largura (width); 2. Use margin: auto (ou 0 auto) para distribuir o espaço lateral.',
      extra: 'Combine width: 500px; e margin: 0 auto; em .bloco-teoria.',
      respostaEsperada: /\.bloco-teoria{width:500px;margin:0auto;}/i
    },
    {
      titulo: 'Nível 10/10: O Container Flexível',
      descricao:
        'Remova o display: flex do resultado (.resultado) definindo display: none; e também esconda o botão .sumir.',
      teoria:
        'O display: flex é o que alinha as caixas lado a lado. Mudar para none deve desaparecer o item, deixando sem nada na tela.',
      extra: 'Use .resultado,.sumir { display: none; }',
      respostaEsperada: /\.resultado,.sumir{display:none;}/i
    }
  ];

  constructor(
    private firebase: FirebaseService,
    private firestore: Firestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.usuarioSub = this.firebase.usuario$.subscribe(async (usuario) => {
      this.usuarioAtual = usuario;
      if (!usuario) {
        this.router.navigate(['/registrar']);
        return;
      }
      await this.carregarProgresso(usuario.uid);
    });

    this.mostrarTela('bloco-teoria');
  }

  ngOnDestroy() {
    if (this.usuarioSub) {
      this.usuarioSub.unsubscribe();
    }
  }

  mostrarTela(classe: 'bloco-teoria' | 'resultado' | 'editor-container') {
    const seletores = ['bloco-teoria', 'resultado', 'editor-container'];
    seletores.forEach((c) => {
      const el = document.querySelector('.' + c) as HTMLElement | null;
      if (el) {
        el.classList.remove('active');
      }
    });

    const alvo = document.querySelector('.' + classe) as HTMLElement | null;
    if (alvo) {
      alvo.classList.add('active');
    }
  }

  toggleSom() {
    this.somAtivo = !this.somAtivo;
    const botaoSom = document.getElementById('botao-som');
    if (botaoSom) {
      botaoSom.innerText = this.somAtivo ? '🔊' : '🔇';
    }
  }

  private normalizeCode(code: string): string {
    let normalized = code.replace(/[\n\r\t]/g, ' ');
    normalized = normalized.replace(/\s*([<>{}()\[\];:])\s*/g, '$1');
    normalized = normalized.replace(/\s+/g, ' ');
    return normalized.trim();
  }

  private async carregarProgresso(uid: string) {
    const ref = doc(this.firestore, `usuarios/${uid}`);
    const snap = await getDoc(ref);

    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    const preview = document.getElementById('preview');

    if (snap.exists()) {
      const data: any = snap.data();
      const xp = data.xp ?? 0;

      const fasesCSS = data.fasesCSS || {};
      const fase1 = fasesCSS.fase1 || {};

      this.nivelAtual = typeof fase1.nivelAtual === 'number' ? fase1.nivelAtual : 0;
      this.faseJaConcluida = fase1.status === 'concluida';

      const xpTotalSpan = document.getElementById('xp-total');
      if (xpTotalSpan) {
        xpTotalSpan.textContent = `XP: ${xp}`;
      }

      this.atualizarNivelCSS();

      if (data.codigoCSSAtual && entradaCodigo && preview) {
        entradaCodigo.value = data.codigoCSSAtual;
        preview.innerHTML = `<style>${data.codigoCSSAtual}</style>A visualização aparecerá aqui.`;
      }

      if (this.faseJaConcluida) {
        alert('⚠️ Você já concluiu esta fase.');
        this.router.navigate(['/game-css']);
      }
    } else {
      await setDoc(
        ref,
        {
          fasesCSS: {
            fase1: { status: 'disponivel', nivelAtual: 0 },
            fase2: { status: 'bloqueada', nivelAtual: 0 }
          },
          fase1CSSConcluida: false
        },
        { merge: true }
      );
      this.nivelAtual = 0;
      this.faseJaConcluida = false;
      this.atualizarNivelCSS();
    }
  }

  onCodigoChange() {
    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    const preview = document.getElementById('preview');
    if (!entradaCodigo || !preview) return;

    this.precisaAlterarCodigo = false;
    this.botaoDesabilitado = false;

    const input = entradaCodigo.value;
    preview.innerHTML = `<style>${input}</style>A visualização aparecerá aqui.`;
    this.salvarCodigoCSS(entradaCodigo.value);
  }

  async verificarNivel() {
    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    if (!entradaCodigo) return;

    const entradaOriginal = entradaCodigo.value;
    const entradaNormalizada = this.normalizeCode(entradaOriginal);

    if (this.precisaAlterarCodigo && this.ultimoCodigoAceito === entradaNormalizada) {
      alert('Você já usou esse código para avançar. Ajuste o código para o próximo nível antes de testar novamente.');
      return;
    }

    const audio = document.getElementById('audio-sucesso') as HTMLAudioElement | null;
    const nivel = this.niveisCSS[this.nivelAtual];
    if (!nivel) return;

    const regex = nivel.respostaEsperada;

    if (regex.test(entradaNormalizada)) {
      this.botaoDesabilitado = true;
      if (this.somAtivo && audio) {
        audio.play();
      }

      if (!this.faseJaConcluida) {
        await this.adicionarXP(10);
      }

      this.ultimoCodigoAceito = entradaNormalizada;
      this.precisaAlterarCodigo = true;

      this.nivelAtual++;
      await this.salvarProgressoCSS(this.nivelAtual);

      if (this.nivelAtual < this.niveisCSS.length) {
        this.atualizarNivelCSS();
      } else {
        this.faseConcluida = true;
        this.mensagemConclusao = `Você concluiu a Fase 1 de CSS! ${
          this.faseJaConcluida ? 'Pode refazer, mas não ganhará XP extra.' : '+100XP'
        }`;
      }
    } else {
      alert('Resposta incorreta! Tente novamente. Lembre-se de fechar as chaves e usar ponto e vírgula.');
    }
  }

  private atualizarNivelCSS() {
    if (this.nivelAtual >= this.niveisCSS.length) return;
    const nivel = this.niveisCSS[this.nivelAtual];

    const tituloNivel = document.getElementById('titulo-nivel');
    const descricaoNivel = document.getElementById('descricao-nivel');
    const textoTeoria = document.getElementById('texto-teoria');
    const extraTeoria = document.getElementById('extra-teoria');
    const botaoExemplo = document.getElementById('btn-extra-exemplo') as HTMLButtonElement | null;
    const preview = document.getElementById('preview');
    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    const barra = document.getElementById('barra-progresso') as HTMLDivElement | null;

    if (tituloNivel) tituloNivel.textContent = nivel.titulo;
    if (descricaoNivel) descricaoNivel.textContent = nivel.descricao;
    if (textoTeoria) textoTeoria.textContent = nivel.teoria;

    let extra = nivel.extra || '';
    extra = extra.replace('Exemplo: ', 'Exemplo:<br>');
    extra = extra.replace('Ex.: ', 'Ex.:<br>');
    this.extraHtmlAtual = extra;
    this.extraVisivel = false;
    const extraEl = extraTeoria as HTMLElement | null;
    if (extraEl) extraEl.innerHTML = '';
    if (botaoExemplo) {
      if (this.extraHtmlAtual) {
        botaoExemplo.style.display = 'inline-flex';
        botaoExemplo.innerText = 'Exibir exemplo';
      } else {
        botaoExemplo.style.display = 'none';
      }
    }

    if (entradaCodigo) entradaCodigo.value = '';
    if (preview) preview.innerHTML = 'A visualização aparecerá aqui.';
    if (barra) barra.style.width = `${(this.nivelAtual / this.niveisCSS.length) * 100}%`;
  }

  toggleExemplo() {
    const extraTeoria = document.getElementById('extra-teoria');
    const botaoExemplo = document.getElementById('btn-extra-exemplo') as HTMLButtonElement | null;
    if (!extraTeoria || !botaoExemplo || !this.extraHtmlAtual) return;

    this.extraVisivel = !this.extraVisivel;
    extraTeoria.innerHTML = this.extraVisivel ? this.extraHtmlAtual : '';
    botaoExemplo.innerText = this.extraVisivel ? 'Ocultar exemplo' : 'Exibir exemplo';
  }

  private async adicionarXP(qtd: number) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);

    await runTransaction(this.firestore, async (transaction) => {
      const snap = await transaction.get(ref);
      const data: any = snap.exists() ? snap.data() : {};
      const xpAtual = data.xp ?? 0;
      transaction.set(ref, { xp: xpAtual + qtd }, { merge: true });

      const xpTotalSpan = document.getElementById('xp-total');
      if (xpTotalSpan) {
        xpTotalSpan.textContent = `XP: ${xpAtual + qtd}`;
      }
    });
  }

  private async salvarProgressoCSS(nivel: number) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      'fasesCSS.fase1.nivelAtual': nivel
    });
  }

  private async salvarCodigoCSS(codigo: string) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      codigoCSSAtual: codigo
    });
  }

  async concluirFase1CSS() {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);

    if (!this.faseJaConcluida) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data: any = snap.data();
        const fases = data.fasesCSS || {};

        fases.fase1 = {
          ...(fases.fase1 || {}),
          status: 'concluida',
          nivelAtual: this.nivelAtual
        };
        fases.fase2 = {
          ...(fases.fase2 || {}),
          status: 'disponivel',
          nivelAtual: 0
        };

        await updateDoc(ref, {
          fasesCSS: fases,
          xp: increment(100),
          fase1CSSConcluida: true
        });

        this.faseJaConcluida = true;
        alert('✅ Fase 1 CSS concluída! Fase 2 CSS desbloqueada.');
        this.router.navigate(['/game-css']);
      }
    } else {
      alert('⚠️ Você já concluiu esta fase. Pode revisar, mas não ganha XP.');
      this.router.navigate(['/game-css']);
    }
  }

  voltarParaSelecao() {
    this.router.navigate(['/game-css']);
  }
}
