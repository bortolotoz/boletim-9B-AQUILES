// Dados fictícios padronizados do 9º Ano (dados brutos)
const dadosDisciplinas = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// NOTA: A frequência de 92% exibida nos cards é APENAS FICTÍCIA e demonstrativa nesta etapa.

// Função para converter qualquer formato de nota para a escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null; // Nota ainda não lançada
  }

  // Se a nota vier como texto com vírgula (ex: "8,5"), troca por ponto
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let numero = Number(valor);

  // Se não for um número válido, descarta
  if (isNaN(numero)) {
    return null;
  }

  // Se for maior que 10 e até 100, divide por 10 (ex: 85 vira 8.5)
  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  // Se estiver no intervalo correto de 0 a 10, retorna o número
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  return null; // Fora do intervalo válido
}

// Função principal que processa os dados e desenha a tela
function renderizarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = "";

  let somaMediasGerais = 0;
  let disciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let contadorBomDesempenho = 0;
  let contadorAtencao = 0;

  // Passa por cada disciplina da lista
  dadosDisciplinas.forEach((item) => {
    // Normaliza as notas dos 3 trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcula a soma e conta quantas notas existem
    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    let mediaTexto = "—";
    let situacao = "Nota ainda não disponível";
    let classeSituacao = "situacao-indisponivel";

    if (notasValidas.length > 0) {
      const somaNotas = notasValidas.reduce((acc, curr) => acc + curr, 0);
      const mediaCalculada = somaNotas / notasValidas.length;
      mediaTexto = mediaCalculada.toFixed(1).replace(".", ",");

      somaMediasGerais += mediaCalculada;
      disciplinasComMedia++;

      if (mediaCalculada >= 6.0) {
        situacao = "Bom desempenho";
        classeSituacao = "situacao-bom";
        contadorBomDesempenho++;
      } else {
        situacao = "Atenção";
        classeSituacao = "situacao-atencao";
        contadorAtencao++;
      }
    }

    // Soma o total de faltas da disciplina
    const totalFaltasDisciplina = item.faltas.reduce((acc, curr) => acc + curr, 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Formata o texto das notas para exibir na tabela
    const txt1 = n1 !== null ? n1.toFixed(1).replace(".", ",") : "—";
    const txt2 = n2 !== null ? n2.toFixed(1).replace(".", ",") : "—";
    const txt3 = n3 !== null ? n3.toFixed(1).replace(".", ",") : "—";

    // Cria a linha da tabela (HTML)
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${txt1}</td>
      <td>${txt2}</td>
      <td>${txt3}</td>
      <td><strong>${mediaTexto}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td class="${classeSituacao}">${situacao}</td>
    `;
    tabelaCorpo.appendChild(linha);
  });

  // Atualiza os Cards de Resumo no topo da página
  const mediaGeralFinal = disciplinasComMedia > 0 
    ? (somaMediasGerais / disciplinasComMedia).toFixed(1).replace(".", ",") 
    : "—";

  document.getElementById("card-media-geral").textContent = mediaGeralFinal;
  document.getElementById("card-total-faltas").textContent = totalFaltasGeral;
  document.getElementById("card-bom-desempenho").textContent = contadorBomDesempenho;
  document.getElementById("card-atencao").textContent = contadorAtencao;
}

// Executa a função assim que o arquivo carregar
renderizarBoletim();