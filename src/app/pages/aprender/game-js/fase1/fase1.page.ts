import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { FirebaseService, Usuario } from '../../../../services/firebase';
import {
  Firestore,
  doc,
  getDoc,
  runTransaction,
  setDoc,
  updateDoc,
  increment,
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

interface NivelJS {
  titulo: string;
  descricao: string;
  teoria: string;
  extra: string;
  codigoInicial: string;
  respostaEsperada: RegExp | string;
}

@Component({
  selector: 'app-fase1-js',
  templateUrl: './fase1.page.html',
  styleUrls: ['./fase1.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
})
export class Fase1Page implements OnInit, OnDestroy, AfterViewInit {

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

  niveisJS: NivelJS[] = [
    {
      titulo: 'Nível 1/5',
      descricao:
        'JavaScript é uma linguagem de programação essencial e a mais popular para o desenvolvimento web, responsável por adicionar interatividade e dinamismo a páginas web, como mapas interativos, animações e atualizações de conteúdo em tempo real. Ele é uma das três tecnologias fundamentais da web, juntamente com HTML (estrutura) e CSS (estilo)',
      teoria: '',
      extra: '',
      codigoInicial: '',
      respostaEsperada: '',
    },
    {
      titulo: "Nível 2/5",
      descricao: "Declare uma variável chamada 'mensagem' e atribua a ela o valor 'Olá, mundo!'.",
      teoria:
        "Para armazenar dados com Javascript, ultilizamos uma estrutura chamada variável. Para declararmos uma variavel que tem como valor um texto, ultlizamos a declaração let nomeDaVariavel = 'valor';<br> No exemplo, 'let' é a palavra reservada que indica que estamos declarando uma variável, 'nomeDaVariavel' é o nome que escolhemos para a variável (que deve seguir certas regras, como não começar com números ou usar espaços) e 'valor' é o conteúdo que estamos atribuindo à variável, que no caso é um texto (string) e por isso está entre aspas simples.",
      extra: "Exemplo: let texto = 'Olá, mundo!';",
      codigoInicial: '',
      respostaEsperada: /let\s+mensagem\s*=\s*['"].+?['"]\s*;?/i,
    },
    {
      titulo: 'Nível 3/5',
      descricao: 'Use o metodo console.log para imprimir a variável mensagem',
      teoria:
        'O método console.log() é usado para exibir mensagens no console do navegador, o que é útil para depuração e verificação de valores durante o desenvolvimento. Para imprimir o valor de uma variável, você simplesmente passa o nome da variável como argumento para console.log(). Por exemplo, se você tem uma variável chamada mensagem, você pode exibir seu valor no console com console.log(mensagem);',
      extra: 'Exemplo: console.log(mensagem)',
      codigoInicial: "let mensagem = 'Olá, Mundo!'",
      respostaEsperada: /console\.log\s*\(\s*mensagem\s*\)\s*;?/is,
    },
    {
      titulo: 'Nível 4/5',
      descricao: 'Transforme o comando console.log anterior em um comentário.',
      teoria:
        'Para comentar um comando em JavaScript, basta adicionar // antes dele ou envolver com /* ... */. Isso faz com que o comando não seja executado.',
      extra: 'Exemplo: // console.log(mensagem) ou /* console.log(mensagem) */',
      codigoInicial: "let mensagem = 'Olá, Mundo!'\nconsole.log(mensagem)",
      respostaEsperada: /(\/\/\s*console\.log|\/\*\s*console\.log[\s\S]*?\*\/)/i,
    },
    {
      titulo: 'Nível 5/5',
      descricao: 'Utilize o método alert ou outro método da window para exibir uma mensagem.',
      teoria:
        'O objeto window representa a janela do navegador e possui vários métodos úteis, como alert(), prompt(), confirm(), entre outros. O método alert exibe uma caixa de diálogo com uma mensagem para o usuário.',
      extra: "Exemplo: alert('Olá!') ou window.alert('Bem-vindo!')",
      codigoInicial: '',
      respostaEsperada: /(window\s*\.\s*alert\s*\(.*?\)|alert\s*\(.*?\))/is,
    },
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
  }

  ngAfterViewInit() {
    // garante que o DOM da página esteja pronto antes de manipular classes/preview
    setTimeout(() => {
      this.mostrarTela('bloco-teoria');
    }, 0);
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

    // Controla a visibilidade do preview conforme a aba atual e o nível
    const preview = document.getElementById('preview') as HTMLElement | null;
    if (preview) {
      if (classe === 'resultado') {
        // mantém a regra de ocultar o preview nos níveis 0 e 1
        if (this.nivelAtual === 0 || this.nivelAtual === 1) {
          preview.style.display = 'none';
        } else {
          preview.style.display = 'block';
        }
      } else {
        preview.style.display = 'none';
      }
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
    normalized = normalized.replace(/\s*([{}()\[\];:,+-/*])\s*/g, '$1');
    normalized = normalized.replace(/\s+/g, ' ');
    return normalized.trim();
  }

  private async carregarProgresso(uid: string) {
    const ref = doc(this.firestore, `usuarios/${uid}`);
    const snap = await getDoc(ref);

    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    const preview = document.getElementById('preview') as HTMLElement | null;

    if (snap.exists()) {
      const data: any = snap.data();
      const xp = data.xp ?? 0;

      const fasesJS = data.fasesJS || {};
      const fase1 = fasesJS.fase1 || {};

      this.nivelAtual =
        typeof fase1.nivelAtual === 'number' ? fase1.nivelAtual : 0;
      this.faseJaConcluida = fase1.status === 'concluida';

      const xpTotalSpan = document.getElementById('xp-total');
      if (xpTotalSpan) {
        xpTotalSpan.textContent = `XP: ${xp}`;
      }

      this.atualizarNivelJS();

      if (fase1.codigoAtual && entradaCodigo && preview) {
        entradaCodigo.value = fase1.codigoAtual;
        this.mostrarVisualizacao(this.nivelAtual, fase1.codigoAtual);
      }

      if (this.faseJaConcluida) {
        alert('⚠️ Você já concluiu esta fase.');
        this.router.navigate(['/game-js']);
      }
    } else {
      await setDoc(
        ref,
        {
          fasesJS: {
            fase1: { status: 'disponivel', nivelAtual: 0 },
            fase2: { status: 'bloqueada', nivelAtual: 0 },
          },
          fase1JsConcluida: false,
        },
        { merge: true }
      );
      this.nivelAtual = 0;
      this.faseJaConcluida = false;
      this.atualizarNivelJS();
    }
  }

  onCodigoChange() {
    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    const preview = document.getElementById('preview');
    if (!entradaCodigo || !preview) return;

    this.precisaAlterarCodigo = false;
    this.botaoDesabilitado = false;

    const input = entradaCodigo.value;
    this.mostrarVisualizacao(this.nivelAtual, input);
    this.salvarCodigoJS(input);
  }

  private formatPreview(code: string): string {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre>${escaped}</pre>`;
  }

  async verificarNivel() {
    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    if (!entradaCodigo) return;

    const entradaOriginal = entradaCodigo.value;
    const entradaNormalizada = this.normalizeCode(entradaOriginal);

    if (this.precisaAlterarCodigo && this.ultimoCodigoAceito === entradaNormalizada) {
      alert(
        'Você já usou esse código para avançar. Ajuste o código para o próximo nível antes de testar novamente.'
      );
      return;
    }

    const audio = document.getElementById('audio-sucesso') as HTMLAudioElement | null;
    const nivel = this.niveisJS[this.nivelAtual];
    if (!nivel) return;

    const regex = nivel.respostaEsperada;

    const passou =
      regex instanceof RegExp ? regex.test(entradaOriginal) : entradaOriginal === regex;

    if (passou) {
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
      await this.salvarProgressoJS(this.nivelAtual);

      if (this.nivelAtual < this.niveisJS.length) {
        this.atualizarNivelJS();
      } else {
        this.faseConcluida = true;
        this.mensagemConclusao = `Você concluiu a Fase 1 de JavaScript! ${
          this.faseJaConcluida ? 'Pode refazer, mas não ganhará XP extra.' : '+50XP'
        }`;
      }
    } else {
      alert(
        'Resposta incorreta! Tente novamente. Lembre-se de fechar parênteses, usar ponto e vírgula, etc.'
      );
    }
  }

  private atualizarNivelJS() {
    if (this.nivelAtual >= this.niveisJS.length) return;
    const nivel = this.niveisJS[this.nivelAtual];

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
    if (textoTeoria) textoTeoria.innerHTML = nivel.teoria;

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

    if (entradaCodigo) {
      if (nivel.codigoInicial) {
        entradaCodigo.value = nivel.codigoInicial;
        this.mostrarVisualizacao(this.nivelAtual, nivel.codigoInicial);
      } else {
        entradaCodigo.value = '';
        if (preview) {
          preview.innerHTML = 'A visualização aparecerá aqui.';
        }
      }
    } else if (preview) {
      preview.innerHTML = 'A visualização aparecerá aqui.';
    }

    if (barra) {
      barra.style.width = `${(this.nivelAtual / this.niveisJS.length) * 100}%`;
    }
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

  private async salvarProgressoJS(nivel: number) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      'fasesJS.fase1.nivelAtual': nivel,
    });
  }

  private async salvarCodigoJS(codigo: string) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      'fasesJS.fase1.codigoAtual': codigo,
    });
  }

  private mostrarVisualizacao(nivelIndex: number, codigo: string) {
    const preview = document.getElementById('preview') as HTMLElement | null;
    if (!preview) return;

    const resultados: { linha: string; valor: any }[] = [];
    const logs: string[] = [];
    const errors: string[] = [];

    const fakeConsole = {
      log: (...args: any[]) => logs.push(args.join(' ')),
      error: (...args: any[]) => errors.push(args.join(' ')),
    };

    try {
      const sandbox: any = {};
      const transformed = String(codigo)
        .replace(/\b(var|let|const)\s+([a-zA-Z_$][\w$]*)\s*=\s*/g, 'sandbox.$2 = ')
        .replace(/\b(var|let|const)\s+([a-zA-Z_$][\w$]*)\s*(;|\n|$)/g, 'sandbox.$2 = undefined$3');

      const runAll = new Function(
        'sandbox',
        'console',
        `with(sandbox){ try{ ${transformed} }catch(e){ } return sandbox; }`
      );
      runAll(sandbox, fakeConsole as any);

      const chaves = Object.keys(sandbox || {});
      for (const k of chaves) {
        const v = sandbox[k];
        if (
          typeof v === 'number' ||
          typeof v === 'boolean' ||
          typeof v === 'string'
        ) {
          resultados.push({ linha: k, valor: v });
        }
      }
    } catch {
      // ignora erros do sandbox
    }

    const partes: string[] = [];

    const escapeHtml = (str: string) => {
      return (str + '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    for (const l of logs) {
      partes.push(`<div class="output-log">console.log → ${escapeHtml(l)}</div>`);
    }
    for (const er of errors) {
      partes.push(`<div class="output-error">Error → ${escapeHtml(er)}</div>`);
    }
    for (const r of resultados) {
      partes.push(
        `<div class="output-result">${escapeHtml(r.linha)} => ${escapeHtml(
          String(r.valor)
        )}</div>`
      );
    }

    preview.innerHTML = partes.length ? partes.join('') : 'A visualização aparecerá aqui.';
  }

  async concluirFase1JS() {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);

    if (!this.faseJaConcluida) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data: any = snap.data();
        const fases = data.fasesJS || {};

        fases.fase1 = {
          ...(fases.fase1 || {}),
          status: 'concluida',
          nivelAtual: this.nivelAtual,
        };
        fases.fase2 = {
          ...(fases.fase2 || {}),
          status: 'disponivel',
          nivelAtual: 0,
        };

        await updateDoc(ref, {
          fasesJS: fases,
          xp: increment(50),
          fase1JsConcluida: true,
        });

        this.faseJaConcluida = true;
        alert('✅ Fase 1 de JavaScript concluída! Fase 2 JS desbloqueada.');
        this.router.navigate(['/game-js']);
      }
    } else {
      alert('⚠️ Você já concluiu esta fase. Pode revisar, mas não ganha XP.');
      this.router.navigate(['/game-js']);
    }
  }

  voltarParaSelecao() {
    this.router.navigate(['/game-js']);
  }
}