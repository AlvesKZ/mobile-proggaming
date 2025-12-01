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
  selector: 'app-fase2',
  templateUrl: './fase2.page.html',
  styleUrls: ['./fase2.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class Fase2Page implements OnInit, OnDestroy {

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
      titulo: 'Nível 1/5',
      descricao: 'Declare uma variável com var, outra com let e outra com const.',
      teoria:
        'var foi a forma original de declarar variáveis em JS e tem escopo de função (vaza de blocos). let tem escopo de bloco e é a escolha moderna para valores que mudam. const também tem escopo de bloco e impede reatribuição do identificador (o conteúdo de objetos/arrays ainda pode ser mutado). Prefira let e const no dia a dia.',
      extra: 'Exemplo: <code>var a = 1; let b = 2; const c = 3;</code>',
      respostaEsperada: /(?=[\s\S]*\bvar\s+\w+\s*=)(?=[\s\S]*\blet\s+\w+\s*=)(?=[\s\S]*\bconst\s+\w+\s*=)[\s\S]*/i
    },
    {
      titulo: 'Nível 2/5',
      descricao: 'Crie uma string, um number e um boolean.',
      teoria:
        'Os principais tipos primitivos são: string (texto entre aspas), number (inteiros e decimais sem distinção) e boolean (true/false). Saber escolher o tipo correto evita bugs e facilita validações.',
      extra: "Ex.: let s = 'texto'; let n = 10; let b = true;",
      respostaEsperada:
        /(?=[\s\S]*(let|var|const)\s+\w+\s*=\s*['\"]).*(?=[\s\S]*(let|var|const)\s+\w+\s*=\s*\d).*(?=[\s\S]*(let|var|const)\s+\w+\s*=\s*(true|false))[\s\S]*/i
    },
    {
      titulo: 'Nível 3/5',
      descricao: 'Converta um valor com Number() e outro com String().',
      teoria:
        'Conversões explícitas tornam seu código previsível: Number(x) tenta transformar x em número (retorna NaN se falhar). String(x) converte qualquer valor em texto. Evite confiar em coerção implícita.',
      extra: "Ex.: let n = Number('42')<br>let s = String(42)",
      respostaEsperada: /(?=[\s\S]*\bNumber\s*\()[\s\S]*\bString\s*\([\s\S]*/i
    },
    {
      titulo: 'Nível 4/5',
      descricao: 'Faça uma frase juntando textos com + (concatenação).',
      teoria:
        'Para juntar textos, use o operador + ou métodos como concat(). Atenção: quando um operando é string e o outro é number, o + faz concatenação, não soma. Garanta o tipo correto antes de operar.',
      extra: "Ex.: let frase = 'Olá, ' + nome;",
      respostaEsperada: /(?=[\s\S]*\+)(?=[\s\S]*['\"][^'\"]+['\"]).*[\s\S]*/i
    },
    {
      titulo: 'Nível 5/5',
      descricao: 'Use template literals (crase) e ${} para interpolar.',
      teoria:
        'Template literals (entre crases) facilitam interpolar variáveis com ${} e quebrar linhas sem escapes. São ideais para montar mensagens legíveis e reduzir erros de concatenação.',
      extra: 'Ex.: <code>let msg = `Olá, ${nome}!`</code>',
      respostaEsperada: /`[\s\S]*`/i
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
      const fase2 = fasesHTML.fase2 || {};

      this.nivelAtual = typeof fase2.nivelAtual === 'number' ? fase2.nivelAtual : 0;
      this.faseJaConcluida = fase2.status === 'concluida';

      const xpTotalSpan = document.getElementById('xp-total');
      if (xpTotalSpan) {
        xpTotalSpan.textContent = `XP: ${xp}`;
      }

      this.atualizarNivel();

      if (fase2.codigoAtual && entradaCodigo && preview) {
        entradaCodigo.value = fase2.codigoAtual;
        preview.innerHTML = fase2.codigoAtual;
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
            fase2: { status: 'disponivel', nivelAtual: 0 },
            fase3: { status: 'bloqueada', nivelAtual: 0 }
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
        this.mensagemConclusao = `Você concluiu a Fase 2 de HTML! ${
          this.faseJaConcluida ? 'Pode refazer, mas não ganhará XP extra.' : '+50XP'
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
    // prepara HTML de exemplo e botão de exemplo
    let extra = nivel.extra || '';
    if (extra) {
      extra = extra.replace(/;\s*/g, ';<br>');
      extra = extra.replace(/(<br>\s*)+/g, '<br>');
    }
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

  private async salvarProgresso(nivel: number) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      'fasesHTML.fase2.nivelAtual': nivel
    });
  }

  private async salvarCodigo(codigo: string) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      'fasesHTML.fase2.codigoAtual': codigo
    });
  }

  async concluirFase2() {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);

    if (!this.faseJaConcluida) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data: any = snap.data();
        const fases = data.fasesHTML || {};

        fases.fase2 = {
          ...(fases.fase2 || {}),
          status: 'concluida',
          nivelAtual: this.nivelAtual
        };
        fases.fase3 = {
          ...(fases.fase3 || {}),
          status: 'disponivel',
          nivelAtual: 0
        };

        await updateDoc(ref, {
          fasesHTML: fases,
          xp: increment(50)
        });

        this.faseJaConcluida = true;
        alert('✅ Fase 2 concluída! Fase 3 desbloqueada.');
        this.router.navigate(['/game-html']);
      }
    } else {
      alert('⚠️ Você já concluiu esta fase. Pode revisar, mas não ganha XP.');
      this.router.navigate(['/game-html']);
    }
  }

  voltarParaSelecao() {
    this.router.navigate(['/game-html']);
  }
}
