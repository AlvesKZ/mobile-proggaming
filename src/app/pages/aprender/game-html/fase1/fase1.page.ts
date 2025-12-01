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
  selector: 'app-fase1',
  templateUrl: './fase1.page.html',
  styleUrls: ['./fase1.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class Fase1Page implements OnInit, OnDestroy {

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
      titulo: 'Nível 1/6',
      descricao: 'Digite a tag HTML que representa um título principal. (Escreva o código no editor)',
      teoria:
        'A tag <h1> é usada para criar o título principal de uma página HTML. Os títulos vão de <h1> até <h6>, sendo <h1> o mais importante e <h6> o menos importante. É uma boa prática usar apenas um <h1> por página, pois ele ajuda mecanismos de busca (SEO) e leitores de tela a entenderem a hierarquia do conteúdo.',
      extra: 'Exemplo: <code>&lt;h1&gt;Meu título&lt;/h1&gt;</code>',
      respostaEsperada: /<h1>.*<\/h1>/i
    },
    {
      titulo: 'Nível 2/6',
      descricao: 'Use a tag para criar um parágrafo com qualquer texto. (Escreva o código no editor)',
      teoria:
        'A tag <p> define um parágrafo em HTML. É usada para agrupar blocos de texto. O navegador automaticamente adiciona um espaço antes e depois de cada parágrafo. Dentro de <p>, podem existir outras tags de texto, como <b>, <i> ou links <a>.',
      extra: 'Exemplo: <code>&lt;p&gt;Olá, mundo!&lt;/p&gt;</code>',
      respostaEsperada: /<p>.*<\/p>/i
    },
    {
      titulo: 'Nível 3/6',
      descricao: "Use a tag de negrito para escrever 'Olá Mundo'. (Escreva o código no editor)",
      teoria:
        'A tag <b> deixa o texto em negrito, mas apenas visualmente. Para dar ênfase semântica (quando o conteúdo é realmente importante), recomenda-se usar <strong>. Já <b> é mais usada para estilização simples.',
      extra: 'Exemplo: <code>&lt;b&gt;Olá Mundo&lt;/b&gt;</code>',
      respostaEsperada: /<b>\s*olá mundo\s*<\/b>/i
    },
    {
      titulo: 'Nível 4/6',
      descricao: 'Insira um título de aba usando a tag correta. (Escreva o código no editor)',
      teoria:
        'A tag <title> define o título que aparece na aba do navegador e nos resultados de pesquisa do Google. Essa tag deve ficar sempre dentro do <head>. É importante escolher um título claro e objetivo, pois ajuda na experiência do usuário e no SEO (otimização para mecanismos de busca).',
      extra: 'Exemplo: <code>&lt;title&gt;Minha Página&lt;/title&gt;</code>',
      respostaEsperada: /<title>.*<\/title>/i
    },
    {
      titulo: 'Nível 5/6',
      descricao: "Use a tag <i> para deixar 'Importante' em itálico. (Escreva o código no editor)",
      teoria:
        'A tag <i> deixa o texto em itálico, mas assim como <b>, é apenas uma formatação visual. Para dar ênfase semântica, recomenda-se usar <em> (ênfase). A diferença é que <em> comunica ao navegador e leitores de tela que o texto é realmente importante.',
      extra: 'Exemplo: <code>&lt;i&gt;Importante&lt;/i&gt;</code>',
      respostaEsperada: /<i>\s*importante\s*<\/i>/i
    },
    {
      titulo: 'Nível 6/6',
      descricao: 'Monte a estrutura básica com html, head e body. (Escreva o código no editor)',
      teoria:
        'Todo documento HTML deve começar com <!DOCTYPE html>, que informa ao navegador que o documento segue o padrão HTML5. Depois, temos a estrutura básica:<html>: raiz do documento;<head>: contém informações sobre a página (título, metadados, links de CSS, scripts);<body>: onde fica o conteúdo visível (textos, imagens, botões, etc.). É fundamental entender essa estrutura, pois todos os sites são construídos a partir dela.',
      extra:
        'Exemplo:<br><code>&lt;!DOCTYPE html&gt;<br>&lt;html&gt;<br>&lt;head&gt;&lt;/head&gt;<br>&lt;body&gt;&lt;/body&gt;<br>&lt;/html&gt;</code>',
      respostaEsperada: /<html>[\s\S]*<head>[\s\S]*<\/head>[\s\S]*<body>[\s\S]*<\/body>[\s\S]*<\/html>/i
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
      const fase1 = fasesHTML.fase1 || {};

      this.nivelAtual = typeof fase1.nivelAtual === 'number' ? fase1.nivelAtual : 0;
      this.faseJaConcluida = fase1.status === 'concluida';

      const xpTotalSpan = document.getElementById('xp-total');
      if (xpTotalSpan) {
        xpTotalSpan.textContent = `XP: ${xp}`;
      }

      this.atualizarNivel();

      if (fase1.codigoAtual && entradaCodigo && preview) {
        entradaCodigo.value = fase1.codigoAtual;
        preview.innerHTML = fase1.codigoAtual;
      }

      if (this.faseJaConcluida) {
        alert('⚠️ Você já concluiu esta fase.');
        this.router.navigate(['/game-html']);
      }
    } else {
      // Inicializa estrutura básica de fasesHTML para HTML
      await setDoc(
        ref,
        {
          fasesHTML: {
            fase1: { status: 'disponivel', nivelAtual: 0 },
            fase2: { status: 'bloqueada', nivelAtual: 0 }
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

    // Qualquer alteração no código libera nova validação para o próximo nível
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

    // Evita que o mesmo código correto seja usado para avançar múltiplos níveis seguidos
    if (this.precisaAlterarCodigo && this.ultimoCodigoAceito === entradaNormalizada) {
      alert('Você já usou esse código para avançar. Ajuste o código para o próximo nível antes de testar novamente.');
      return;
    }

    const audio = document.getElementById('audio-sucesso') as HTMLAudioElement | null;
    const nivel = this.niveis[this.nivelAtual];
    if (!nivel) return;

    const regex = nivel.respostaEsperada;

    if (regex.test(entradaNormalizada)) {
      // Evita cliques repetidos imediatamente após uma validação correta
      this.botaoDesabilitado = true;
      if (this.somAtivo && audio) {
        audio.play();
      }

      if (!this.faseJaConcluida) {
        await this.adicionarXP(10);
      }

      // Marca que este código já foi aceito para este avanço
      this.ultimoCodigoAceito = entradaNormalizada;
      this.precisaAlterarCodigo = true;

      this.nivelAtual++;
      await this.salvarProgresso(this.nivelAtual);

      if (this.nivelAtual < this.niveis.length) {
        this.atualizarNivel();
      } else {
        this.faseConcluida = true;
        this.mensagemConclusao = `Você concluiu a Fase 1 de HTML! ${
          this.faseJaConcluida ? 'Pode refazer, mas não ganhará XP extra.' : '+60XP'
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
      'fasesHTML.fase1.nivelAtual': nivel
    });
  }

  private async salvarCodigo(codigo: string) {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);
    await updateDoc(ref, {
      'fasesHTML.fase1.codigoAtual': codigo
    });
  }

  async concluirFase1() {
    if (!this.usuarioAtual) return;
    const ref = doc(this.firestore, `usuarios/${this.usuarioAtual.uid}`);

    if (!this.faseJaConcluida) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data: any = snap.data();
        const fases = data.fasesHTML || {};

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
          fasesHTML: fases,
          xp: increment(60)
        });

        this.faseJaConcluida = true;
        alert('✅ Fase 1 concluída! Fase 2 desbloqueada.');
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
