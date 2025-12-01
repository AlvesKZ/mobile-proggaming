import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { FirebaseService, Usuario } from '../../../../services/firebase';
import { Firestore, doc, getDoc, runTransaction, setDoc, updateDoc, increment } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

interface Nivel {
  titulo: string;
  descricao: string;
  teoria: string;
  extra: string;
  respostaEsperada: RegExp;
}

@Component({
  selector: 'app-fase3',
  templateUrl: './fase3.page.html',
  styleUrls: ['./fase3.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class Fase3Page implements OnInit, OnDestroy {

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

  niveis: Nivel[] = [
    {
      titulo: 'Nível 1/7',
      descricao: "Crie um link simples usando <a href='...'>.",
      teoria: 'A tag <a> (âncora) é usada para criar links. O atributo href define o destino do link. O texto entre <a> e </a> é o que será exibido para o usuário.',
      extra: "Exemplo: <code>&lt;a href='https://www.exemplo.com'&gt;Clique aqui&lt;/a&gt;</code>",
      respostaEsperada: /<a\b[^>]*\bhref\s*=\s*(['"])?[\s\S]*?\1[^>]*>[\s\S]*?<\/a>/i
    },
    {
      titulo: 'Nível 2/7',
      descricao: 'Use os atributos target, title e download no link.',
      teoria:
        "O atributo target='_blank' abre o link em uma nova aba. O title mostra uma dica quando o usuário passa o mouse. O download força baixar o arquivo.",
      extra:
        "Exemplo: <code>&lt;a href='arquivo.pdf' target='_blank' title='Baixar PDF' download&gt;Baixar&lt;/a&gt;</code>",
      respostaEsperada:
        /<a\b(?=[\s\S]*\bhref\s*=\s*(['"])[\s\S]*?\1)(?=[\s\S]*\btarget\s*=\s*(['"])_blank\2)(?=[\s\S]*\btitle\s*=\s*(['"])[\s\S]*?\3)(?=[\s\S]*\bdownload(?:\s*=\s*(['"])[\s\S]*?\4)?)[^>]*>[\s\S]*?<\/a>/i
    },
    {
      titulo: 'Nível 3/7',
      descricao: 'Crie um link interno (âncora) que leve até uma seção com id.',
      teoria: 'Para navegar na mesma página: href="#id" e no destino id="id".',
      extra:
        "Exemplo: <code>&lt;a href='#secao'&gt;Ir&lt;/a&gt;  &lt;div id='secao'&gt;Conteúdo&lt;/div&gt;</code>",
      respostaEsperada:
        /(<a\b[^>]*\bhref\s*=\s*(['"])#[^'\"]+\2[^>]*>[\s\S]*?<\/a>)|(\bid\s*=\s*(['"])[^'\"]+\4)/i
    },
    {
      titulo: 'Nível 4/7',
      descricao: 'Crie um menu de navegação simples com 3 links.',
      teoria: 'Use <nav> com múltiplos <a>. Normalmente organizados em listas.',
      extra:
        'Ex.: <code>&lt;nav&gt;<br>  &lt;a href="#"&gt;1&lt;/a&gt;<br>&lt;/nav&gt;</code>',
      respostaEsperada: /<nav\b[^>]*>[\s\S]*?(?:<a\b[^>]*>[\s\S]*?<\/a>){3,}[\s\S]*?<\/nav>/i
    },
    {
      titulo: 'Nível 5/7',
      descricao: 'Quiz: Qual atributo usamos para abrir um link em nova aba?',
      teoria: "O atributo correto é target='_blank'.",
      extra: 'Digite exatamente: <code>target="_blank"</code>',
      respostaEsperada: /\btarget\s*=\s*(['"])_blank\1/i
    },
    {
      titulo: 'Nível 6/7',
      descricao: 'Desafio: Crie um menu com 3 links funcionando.',
      teoria: 'Combine tudo: <nav> + pelo menos 3 <a>.',
      extra:
        "Ex.: <code>&lt;nav&gt;&lt;a href='https://google.com'&gt;Google&lt;/a&gt;...&lt;/nav&gt;</code>",
      respostaEsperada: /<nav\b[^>]*>[\s\S]*?(?:<a\b[^>]*>[\s\S]*?<\/a>){3,}[\s\S]*?<\/nav>/i
    },
    {
      titulo: 'Nível 7/7 (Extra)',
      descricao: 'Desafio: Adicione uma imagem com um link de sua escolha.',
      teoria:
        'A tag <img> é usada para inserir imagens. O atributo src aponta para o caminho da imagem. Pode ser um link ou um caminho relativo.',
      extra:
        "Exemplo: <code>&lt;img src='https://via.placeholder.com/150' alt='Uma imagem de exemplo'&gt;</code>",
      respostaEsperada: /<img\b[^>]*\bsrc\s*=\s*(['"])[^'\"]+\1[^>]*>/i
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

  async carregarProgresso(uid: string) {
    const ref = doc(this.firestore, `usuarios/${uid}`);
    const snap = await getDoc(ref);

    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    const preview = document.getElementById('preview');

    if (snap.exists()) {
      const data: any = snap.data();
      const xp = data.xp ?? 0;

      const fasesHTML = data.fasesHTML || {};
      const fase3 = fasesHTML.fase3 || {};

      this.nivelAtual = typeof fase3.nivelAtual === 'number' ? fase3.nivelAtual : 0;
      this.faseJaConcluida = fase3.status === 'concluida';

      const xpTotalSpan = document.getElementById('xp-total');
      if (xpTotalSpan) {
        xpTotalSpan.textContent = `XP: ${xp}`;
      }

      this.atualizarNivel();

      if (fase3.codigoAtual && entradaCodigo && preview) {
        entradaCodigo.value = fase3.codigoAtual;
        preview.innerHTML = fase3.codigoAtual;
      }

      if (this.faseJaConcluida) {
        alert('⚠️ Você já concluiu esta fase.');
        this.router.navigate(['/game-html']);
      }
    } else {
      await setDoc(
        ref,
        {
          fasesHTML: {
            fase1: { status: 'concluida', nivelAtual: 6 },
            fase2: { status: 'concluida', nivelAtual: 5 },
            fase3: { status: 'disponivel', nivelAtual: 0 }
          }
        },
        { merge: true }
      );
      this.nivelAtual = 0;
      this.faseJaConcluida = false;
      this.atualizarNivel();
    }
  }

  onCodigoChange() {
    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    const preview = document.getElementById('preview');
    if (!entradaCodigo || !preview) return;

    this.precisaAlterarCodigo = false;
    this.botaoDesabilitado = false;

    const input = entradaCodigo.value
      .replace(/<script.*?>.*?<\/script>/gi, '')
      .replace(/on\w+=".*?"/gi, '');
    preview.innerHTML = input || 'A visualização aparecerá aqui.';
    this.salvarCodigo(entradaCodigo.value);
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
    const nivel = this.niveis[this.nivelAtual];
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
      await this.salvarProgresso(this.nivelAtual);

      if (this.nivelAtual < this.niveis.length) {
        this.atualizarNivel();
      } else {
        this.faseConcluida = true;
        this.mensagemConclusao = `Você concluiu a Fase 3 de HTML! ${
          this.faseJaConcluida ? 'Pode refazer, mas não ganhará XP extra.' : '+70XP'
        }`;
      }
    } else {
      alert('Resposta incorreta! Tente novamente.');
    }
  }

  private atualizarNivel() {
    if (this.nivelAtual >= this.niveis.length) return;
    const nivel = this.niveis[this.nivelAtual];

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

    // prepara HTML de exemplo com quebra de linha após o rótulo "Exemplo" / "Ex."
    let extra = nivel.extra || '';
    extra = extra.replace('Exemplo: ', 'Exemplo:<br>');
    extra = extra.replace('Ex.: ', 'Ex.:<br>');
    this.extraHtmlAtual = extra;
    this.extraVisivel = false;
    if (extraTeoria) extraTeoria.innerHTML = '';
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
    if (barra) barra.style.width = `${(this.nivelAtual / this.niveis.length) * 100}%`;
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

  private async salvarProgresso(nivel: number) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      'fasesHTML.fase3.nivelAtual': nivel
    });
  }

  private async salvarCodigo(codigo: string) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      'fasesHTML.fase3.codigoAtual': codigo
    });
  }

  async concluirFase3() {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);

    if (!this.faseJaConcluida) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data: any = snap.data();
        const fases = data.fasesHTML || {};

        fases.fase3 = {
          ...(fases.fase3 || {}),
          status: 'concluida',
          nivelAtual: this.nivelAtual
        };

        await updateDoc(ref, {
          fasesHTML: fases,
          xp: increment(70)
        });

        this.faseJaConcluida = true;
        alert('✅ Fase 3 concluída!');
        this.router.navigate(['/game-html']);
      }
    } else {
      alert('⚠️ Você já concluiu esta fase. Pode revisar, mas não ganha XP.');
      this.router.navigate(['/game-html']);
    }
  }

  toggleExemplo() {
    const extraTeoria = document.getElementById('extra-teoria');
    const botaoExemplo = document.getElementById('btn-extra-exemplo') as HTMLButtonElement | null;
    if (!extraTeoria || !botaoExemplo || !this.extraHtmlAtual) {
      return;
    }

    this.extraVisivel = !this.extraVisivel;
    extraTeoria.innerHTML = this.extraVisivel ? this.extraHtmlAtual : '';
    botaoExemplo.innerText = this.extraVisivel ? 'Ocultar exemplo' : 'Exibir exemplo';
  }

  voltarParaSelecao() {
    this.router.navigate(['/game-html']);
  }
}
