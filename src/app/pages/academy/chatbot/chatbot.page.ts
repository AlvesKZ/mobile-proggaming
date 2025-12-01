import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

interface Mensagem {
  tipo: 'user' | 'gpt';
  texto: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.page.html',
  styleUrls: ['./chatbot.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ChatbotPage implements OnInit {

  mensagens: Mensagem[] = [
    {
      tipo: 'gpt',
      texto: 'Olá! Conheça tudo sobre o Proggaming!!',
    },
  ];

  inputTexto = '';
  tema: 'tema-claro' | 'tema-escuro' = 'tema-claro';
  menuAberto = false;

  perguntasRapidas: { label: string; pergunta: string }[] = [
    { label: 'HTML', pergunta: 'O que vou aprender em HTML no Proggaming?' },
    { label: 'CSS', pergunta: 'O que vou aprender em CSS no Proggaming?' },
    { label: 'JavaScript', pergunta: 'O que vou aprender em JS no Proggaming?' },
    { label: 'Sobre o Projeto', pergunta: 'Qual é o objetivo deste TCC?' },
  ];

  menuPerguntas: string[] = [
    'O que vou aprender em HTML no Proggaming?',
    'O que vou aprender em CSS?',
    'O que vou aprender em JS?',
    'Qual é o objetivo deste TCC?',
    'O que é o Proggaming?',
    'Como funciona a gamificação?',
    'Qual é o objetivo deste TCC?',
    'Como é a estrutura do código do projeto?',
    'Quem desenvolveu o Proggaming?',
    'Olá',
    'Me conta uma piada',
    'Que horas são?',
  ];

  ngOnInit() {
    this.carregarTemaSalvo();
  }

  enviar() {
    const texto = this.inputTexto.trim();
    if (!texto) return;

    this.adicionarMensagem('user', texto);
    this.inputTexto = '';

    const pergunta = texto.toLowerCase();

    setTimeout(() => {
      const resposta = this.gerarResposta(pergunta);
      this.adicionarMensagem('gpt', resposta);
    }, 800);
  }

  adicionarMensagem(tipo: 'user' | 'gpt', texto: string) {
    this.mensagens.push({ tipo, texto });
  }

  preencherInput(pergunta: string, enviarAuto = false) {
    this.inputTexto = pergunta;
    if (enviarAuto) {
      this.enviar();
    }
  }

  abrirMenu() {
    this.menuAberto = true;
  }

  fecharMenu() {
    this.menuAberto = false;
  }

  selecionarPerguntaMenu(pergunta: string) {
    this.preencherInput(pergunta, true);
    this.fecharMenu();
  }

  private gerarResposta(pergunta: string): string {
    if (pergunta.includes('o que vou aprender em html') || pergunta.includes('html')) {
      return 'Em HTML, você aprenderá a estruturar páginas web usando tags semânticas, como <code>&lt;header&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;footer&gt;</code>, e a incluir conteúdo essencial como links, textos, e imagens com acessibilidade (o atributo <code>alt</code>).';
    }
    if (pergunta.includes('o que vou aprender em css') || pergunta.includes('css')) {
      return 'Em CSS, você dominará o estilo e o design do seu projeto. O curso abrange seletores, cores, tipografia, a criação de layouts responsivos (usando Flexbox) e a personalização da interface.';
    }
    if (
      pergunta.includes('o que vou aprender em js') ||
      pergunta.includes('o que vou aprender em javascript') ||
      pergunta.includes('js') ||
      pergunta.includes('javascript')
    ) {
      return 'Em JavaScript, o foco é na interatividade e lógica: você aprenderá a manipular o DOM, adicionar funcionalidades dinâmicas, validar entradas e implementar sistemas avançados como a gamificação e a ofensiva diária.';
    }
    if (
      pergunta.includes('objetivo deste tcc') ||
      pergunta.includes('sobre o projeto') ||
      pergunta.includes('tcc')
    ) {
      return "O objetivo principal deste TCC é desenvolver o 'Proggaming', uma plataforma de ensino de programação gamificada. Nosso foco é usar elementos de jogos (XP, níveis, ofensiva) para aumentar a motivação e a retenção do aprendizado de desenvolvimento web.";
    }
    if (pergunta.includes('gamificação') || pergunta.includes('como funciona a gamificação')) {
      return 'A gamificação funciona através de XP por fase, níveis de usuário e o sistema de ofensiva diária (streak) que incentiva a consistência. Isso transforma o aprendizado em um jogo, motivando o usuário a progredir.';
    }
    if (pergunta.includes('plataforma') || pergunta.includes('proggaming')) {
      return 'Proggaming é uma plataforma web para o aprendizado prático de HTML, CSS e JavaScript, projetada para ser interativa e focada na aplicação imediata dos conceitos através de desafios de codificação.';
    }
    if (pergunta.includes('firebase') || pergunta.includes('banco de dados')) {
      return 'Utilizamos o Firebase (Firestore) como banco de dados NoSQL. Ele armazena os dados do usuário, como XP, o progresso em cada fase, o código atual do aluno e o contador da ofensiva diária.';
    }
    if (pergunta.includes('estrutura do código') || pergunta.includes('estrutura do projeto')) {
      return 'O projeto é dividido em módulos sequenciais (HTML, CSS, JS). Cada módulo tem fases com sub-níveis, onde o usuário insere o código em um editor e ele é validado por expressões regulares (Regex) em tempo real.';
    }
    if (pergunta.includes('ola') || pergunta.includes('oi') || pergunta.includes('tudo bem')) {
      return 'Olá! Sou o assistente do Proggaming. Quer saber sobre HTML, CSS, JavaScript, ou sobre o TCC?';
    }
    if (pergunta.includes('sobre o desenvolvimento') || pergunta.includes('quem desenvolveu')) {
      return 'O Proggaming foi desenvolvido por uma equipe de 7 pessoas, com participação ativa de todos. E a ideia comandada por <u>Gabriel Passos</u>. <br><b>Integrantes:</b> Ana Clara, Arthur Pires, Clayton Luan, Eduardo Leite, Gabriel Passos, Rafael Fortes e Igor Alves.';
    }
    if (pergunta.includes('piada')) {
      return 'Por que o computador foi ao médico? Porque ele tinha um vírus!';
    }
    if (pergunta.includes('que horas são') || pergunta.includes('horas')) {
      const agora = new Date().toLocaleTimeString();
      return `Agora são ${agora}.`;
    }
    return "Desculpe, não tenho dados suficientes para responder essa pergunta. Tente digitar: 'O que vou aprender em HTML no Proggaming?', 'Qual é o objetivo deste TCC?', ou 'Como funciona a gamificação?'.";
  }

  private carregarTemaSalvo() {
    const temaSalvo = localStorage.getItem('userTheme');
    if (temaSalvo === 'tema-escuro' || temaSalvo === 'tema-claro') {
      this.tema = temaSalvo;
    } else {
      this.tema = 'tema-claro';
    }
  }

  trocarTema() {
    this.tema = this.tema === 'tema-claro' ? 'tema-escuro' : 'tema-claro';
    localStorage.setItem('userTheme', this.tema);
  }

  getAnoAtual(): number {
    return new Date().getFullYear();
  }
}
