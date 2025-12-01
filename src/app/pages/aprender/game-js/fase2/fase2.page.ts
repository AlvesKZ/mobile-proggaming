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

interface NivelJS2 {
  titulo: string;
  descricao: string;
  teoria: string;
  extra: string;
  codigoInicial: string;
  respostaEsperada: RegExp | string;
}

@Component({
  selector: 'app-fase2-js',
  templateUrl: './fase2.page.html',
  styleUrls: ['./fase2.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
})
export class Fase2Page implements OnInit, OnDestroy, AfterViewInit {
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

  niveisJS: NivelJS2[] = [
    {
      titulo: 'Nível 1/5',
      descricao: 'Declare uma variável com var, outra com let e outra com const.',
      teoria:
        'var foi a forma original de declarar variáveis em JS e tem escopo de função (vaza de blocos). let tem escopo de bloco e é a escolha moderna para valores que mudam. const também tem escopo de bloco e impede reatribuição do identificador (o conteúdo de objetos/arrays ainda pode ser mutado). Prefira let e const no dia a dia.',
      extra: 'Exemplo: var a = 1; let b = 2; const c = 3;',
      codigoInicial: '',
      respostaEsperada:
        /(?=[\s\S]*\bvar\s+\w+\s*=)(?=[\s\S]*\blet\s+\w+\s*=)(?=[\s\S]*\bconst\s+\w+\s*=)[\s\S]*/i,
    },
    {
      titulo: 'Nível 2/5',
      descricao: 'Crie uma string, um number e um boolean.',
      teoria:
        'Os principais tipos primitivos são: string (texto entre aspas), number (inteiros e decimais sem distinção) e boolean (true/false). Saber escolher o tipo correto evita bugs e facilita validações.',
      extra: "Ex.: let s = 'texto'; let n = 10; let b = true;",
      codigoInicial: '',
      respostaEsperada:
        /(?=[\s\S]*(let|var|const)\s+\w+\s*=\s*['"]).*(?=[\s\S]*(let|var|const)\s+\w+\s*=\s*\d).*(?=[\s\S]*(let|var|const)\s+\w+\s*=\s*(true|false))[\s\S]*/i,
    },
    {
      titulo: 'Nível 3/5',
      descricao: 'Converta um valor com Number() e outro com String().',
      teoria:
        'Conversões explícitas tornam seu código previsível: Number(x) tenta transformar x em número (retorna NaN se falhar). String(x) converte qualquer valor em texto. Evite confiar em coerção implícita (ex.: == para não gerar surpresas.',
      extra: "Ex.: let n = Number('42')<br>let s = String(42)",
      codigoInicial: '',
      respostaEsperada: /(?=[\s\S]*\bNumber\s*\()[\s\S]*\bString\s*\([\s\S]*/i,
    },
    {
      titulo: 'Nível 4/5',
      descricao: 'Faça uma frase juntando textos com + (concatenação).',
      teoria:
        'Para juntar textos, use o operador + ou métodos como concat(). Atenção: quando um operando é string e o outro é number, o + faz concatenação, não soma. Garanta o tipo correto antes de operar.',
      extra: "Ex.: let frase = 'Olá, ' + nome;",
      codigoInicial: '',
      respostaEsperada: /(?=[\s\S]*\+)(?=[\s\S]*['"][^'"]+['"])[\s\S]*/i,
    },
    {
      titulo: 'Nível 5/5',
      descricao: 'Use template literals (crase) e ${} para interpolar.',
      teoria:
        'Template literals (entre crases) facilitam interpolar variáveis com ${} e quebrar linhas sem escapes. São ideais para montar mensagens legíveis e reduzir erros de concatenação.',
      extra: 'Ex.: let msg = `Olá, ${nome}!`',
      codigoInicial: '',
      respostaEsperada: /`[\s\S]*`/i,
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
      const fase2 = fasesJS.fase2 || {};

      this.nivelAtual =
        typeof fase2.nivelAtual === 'number' ? fase2.nivelAtual : 0;
      this.faseJaConcluida = fase2.status === 'concluida';

      const xpTotalSpan = document.getElementById('xp-total');
      if (xpTotalSpan) {
        xpTotalSpan.textContent = `XP: ${xp}`;
      }

      this.atualizarNivelJS();

      if (fase2.codigoAtual && entradaCodigo && preview) {
        entradaCodigo.value = fase2.codigoAtual;
        this.mostrarVisualizacao(this.nivelAtual, fase2.codigoAtual);
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
            fase2: { status: 'disponivel', nivelAtual: 0 },
            fase3: { status: 'bloqueada', nivelAtual: 0 },
          },
          fase2JsConcluida: false,
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
        this.mensagemConclusao = `Você concluiu a Fase 2 de JavaScript! ${
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
    const preview = document.getElementById('preview') as HTMLElement | null;
    const entradaCodigo = document.getElementById('entrada-codigo') as HTMLTextAreaElement | null;
    const barra = document.getElementById('barra-progresso') as HTMLDivElement | null;

    if (tituloNivel) tituloNivel.textContent = nivel.titulo;
    if (descricaoNivel) descricaoNivel.textContent = nivel.descricao;
    if (textoTeoria) textoTeoria.textContent = nivel.teoria;

    let extra = nivel.extra || '';
    if (extra) {
      extra = extra.replace(/;\s*/g, ';<br>');
      extra = extra.replace(/(<br>\s*){2,}/g, '<br>');
    }
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
      'fasesJS.fase2.nivelAtual': nivel,
    });
  }

  private async salvarCodigoJS(codigo: string) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      'fasesJS.fase2.codigoAtual': codigo,
    });
  }

  async concluirFase2JS() {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);

    if (!this.faseJaConcluida) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data: any = snap.data();
        const fases = data.fasesJS || {};

        fases.fase2 = {
          ...(fases.fase2 || {}),
          status: 'concluida',
          nivelAtual: this.nivelAtual,
        };
        fases.fase3 = {
          ...(fases.fase3 || {}),
          status: 'disponivel',
          nivelAtual: 0,
        };

        await updateDoc(ref, {
          fasesJS: fases,
          xp: increment(50),
          fase2JsConcluida: true,
        });

        this.faseJaConcluida = true;
        alert('✅ Fase 2 de JavaScript concluída! Fase 3 JS desbloqueada.');
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

    // Casos especiais, imitando a base estática
    if (nivelIndex === 3) {
      try {
        const valor = 'Olá, mundo';
        preview.innerHTML = `<div class="output-result">frase => "${valor}"</div>`;
      } catch {
        // ignora
      }
      return;
    }

    if (nivelIndex === 4) {
      try {
        const valor = `Olá, mundo!`;
        preview.innerHTML = `<div class="output-result">msg => "${valor}"</div>`;
      } catch {
        // ignora
      }
      return;
    }

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
      // ignora erros gerais
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
