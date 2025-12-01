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

interface NivelJS3 {
  titulo: string;
  descricao: string;
  teoria: string;
  extra: string;
  codigoInicial: string;
  respostaEsperada: RegExp | string;
}

@Component({
  selector: 'app-fase3-js',
  templateUrl: './fase3.page.html',
  styleUrls: ['./fase3.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
})
export class Fase3Page implements OnInit, OnDestroy, AfterViewInit {
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

  niveisJS: NivelJS3[] = [
    {
      titulo: 'Nível 1/6',
      descricao: 'Utilize operadores aritméticos (+, -, *, /, %) para realizar cálculos.',
      teoria:
        'Operadores aritméticos permitem realizar operações matemáticas básicas. Exemplo: + soma, - subtrai, * multiplica, / divide, % retorna o resto da divisão.',
      extra: 'Exemplo:<br>let soma = 2 + 3;<br>let resto = 10 % 3;',
      codigoInicial: '',
      respostaEsperada: /(\d+\s*[+\-*\/%]\s*\d+)/i,
    },
    {
      titulo: 'Nível 2/6',
      descricao: 'Utilize operadores relacionais (==, ===, !=, <, >) para comparar valores.',
      teoria:
        'Operadores relacionais comparam valores e retornam verdadeiro ou falso. == compara valor, === compara valor e tipo, != diferente, < menor, > maior.',
      extra: "Exemplo:<br>let igual = 5 == '5';<br>let estrito = 5 === '5';<br>let menor = 3 < 5;",
      codigoInicial: '',
      respostaEsperada: /(==|===|!=|<|>)/i,
    },
    {
      titulo: 'Nível 3/6',
      descricao: 'Utilize operadores lógicos (&&, ||, !) para combinar expressões.',
      teoria:
        'Operadores lógicos permitem combinar condições. && (E), || (OU), ! (NÃO).',
      extra: 'Exemplo:<br>let cond = true && false;<br>let ou = true || false;<br>let nao = !true;',
      codigoInicial: '',
      respostaEsperada: /(&&|\|\||!)/i,
    },
    {
      titulo: 'Nível 4/6',
      descricao: 'Observe a precedência dos operadores em uma expressão.',
      teoria:
        'A precedência define a ordem de execução dos operadores. Parênteses alteram a ordem. Exemplo: 2 + 3 * 4 resulta em 14, pois a multiplicação ocorre antes da soma.',
      extra: 'Exemplo:<br>let resultado = 2 + 3 * 4;<br>let resultado2 = (2 + 3) * 4;',
      codigoInicial: '',
      respostaEsperada: /\([\s\S]*\)|\d+\s*[+\-*\/]\s*\d+\s*[+\-*\/]\s*\d+/i,
    },
    {
      titulo: 'Nível 5/6',
      descricao: 'Realize operações entre strings e números.',
      teoria:
        'Ao somar uma string com um número, ocorre concatenação. Para somar valores numéricos, converta ambos para número.',
      extra: "Exemplo:<br>let texto = 'Idade: ' + 20;<br>let soma = Number('10') + 5;",
      codigoInicial: '',
      respostaEsperada:
        /(['"].*['"]\s*\+\s*\d+|Number\s*\([\s\S]*\)\s*\+\s*\d+)/i,
    },
    {
      titulo: 'Nível 6/6',
      descricao:
        'Monte uma expressão lógica que envolva operadores aritméticos, relacionais e lógicos.',
      teoria:
        'Você pode combinar operadores para criar expressões complexas. Exemplo: (2 + 3) > 4 && true.',
      extra: 'Exemplo:<br>let exp = (2 + 3) > 4 && true;',
      codigoInicial: '',
      respostaEsperada: /\([\s\S]*\)\s*[<>!=]=?\s*\d+\s*(&&|\|\|)\s*(true|false)/i,
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

    const preview = document.getElementById('preview') as HTMLElement | null;
    if (preview) {
      preview.style.display = classe === 'resultado' ? 'block' : 'none';
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
      const fase3 = fasesJS.fase3 || {};

      this.nivelAtual =
        typeof fase3.nivelAtual === 'number' ? fase3.nivelAtual : 0;
      this.faseJaConcluida = fase3.status === 'concluida';

      const xpTotalSpan = document.getElementById('xp-total');
      if (xpTotalSpan) {
        xpTotalSpan.textContent = `XP: ${xp}`;
      }

      this.atualizarNivelJS();

      if (fase3.codigoAtual && entradaCodigo && preview) {
        entradaCodigo.value = fase3.codigoAtual;
        this.mostrarVisualizacao(this.nivelAtual, fase3.codigoAtual);
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
            fase1: { status: 'concluida' },
            fase2: { status: 'concluida' },
            fase3: { status: 'disponivel', nivelAtual: 0 },
          },
          fase3JsConcluida: false,
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

    this.mostrarVisualizacao(this.nivelAtual, entradaOriginal);

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
        this.mensagemConclusao = `Você concluiu a Fase 3 de Operadores e Expressões! $${
          this.faseJaConcluida ? 'Pode refazer, mas não ganhará XP extra.' : '+70XP'
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
    const preview = document.getElementById('preview') as HTMLElement | null;
    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    const barra = document.getElementById('barra-progresso') as HTMLDivElement | null;

    if (tituloNivel) tituloNivel.textContent = nivel.titulo;
    if (descricaoNivel) descricaoNivel.textContent = nivel.descricao;
    if (textoTeoria) textoTeoria.textContent = nivel.teoria;

    // Usa o HTML de extra exatamente como definido no nível (com <br>)
    const extra = nivel.extra || '';
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
      if (nivel.codigoInicial && nivel.codigoInicial.trim() !== '') {
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
      barra.style.width = `${((this.nivelAtual + 1) / this.niveisJS.length) * 100}%`;
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
      'fasesJS.fase3.nivelAtual': nivel,
    });
  }

  private async salvarCodigoJS(codigo: string) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      'fasesJS.fase3.codigoAtual': codigo,
    });
  }

  async concluirFase3JS() {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);

    if (!this.faseJaConcluida) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data: any = snap.data();
        const fases = data.fasesJS || {};

        fases.fase3 = {
          ...(fases.fase3 || {}),
          status: 'concluida',
          nivelAtual: this.nivelAtual,
        };

        await updateDoc(ref, {
          fasesJS: fases,
          xp: increment(70),
          fase3JsConcluida: true,
        });

        this.faseJaConcluida = true;
        alert('✅ Fase 3 de JavaScript concluída!');
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
      // ignora erros gerais do sandbox
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
}
