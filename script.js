// Configuração fixa do aluno (não alterar pela página)
const CONFIG_ALUNO = {
  turma: "9B",
  numeroChamada: 3,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Variáveis de estado da sessão
let pinSessao = "";
let dadosAtuais = [];
let modoEdicao = false;

// Instâncias globais dos gráficos Chart.js (camada exclusiva de leitura visual)
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Dados fictícios padronizados do 9º Ano (dados locais de fallback)
const dadosDisciplinasLocais = [
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

// Função para converter notas antigas/locais para a escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let numero = Number(valor);

  if (isNaN(numero)) {
    return null;
  }

  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  return null;
}

// Validação estrita para notas digitadas no modo de edição
function validarNotaEditada(valorTexto) {
  if (valorTexto === null || valorTexto === undefined) return { valida: true, valor: null };
  const textoLimpo = String(valorTexto).trim();
  if (textoLimpo === "") return { valida: true, valor: null };

  const textoPonto = textoLimpo.replace(",", ".");
  const numero = Number(textoPonto);

  if (isNaN(numero) || numero < 0 || numero > 10) {
    return { valida: false, valor: null };
  }

  return { valida: true, valor: numero };
}

// Validação estrita para faltas digitadas no modo de edição
function validarFaltaEditada(valorTexto) {
  const textoLimpo = String(valorTexto).trim();
  if (textoLimpo === "") return { valida: false, valor: null };

  const numero = Number(textoLimpo);
  if (isNaN(numero) || !Number.isInteger(numero) || numero < 0) {
    return { valida: false, valor: null };
  }

  return { valida: true, valor: numero };
}

// Conectar à API para abrir o boletim
async function abrirBoletim() {
  const inputPin = document.getElementById("input-pin");
  const msgLogin = document.getElementById("msg-login");
  const pinDigitado = inputPin.value.trim();

  if (!pinDigitado) {
    msgLogin.textContent = "Por favor, digite seu PIN.";
    msgLogin.style.color = "#f87171";
    return;
  }

  msgLogin.textContent = "Conectando...";
  msgLogin.style.color = "#cbd5e1";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      msgLogin.textContent = "Turma, chamada ou PIN inválidos.";
      msgLogin.style.color = "#f87171";
      return;
    }

    if (resposta.status === 429) {
      msgLogin.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      msgLogin.style.color = "#f87171";
      return;
    }

    if (!resposta.ok) {
      msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      msgLogin.style.color = "#f87171";
      return;
    }

    const resultado = await resposta.json();

    pinSessao = pinDigitado;
    inputPin.value = "";

    if (resultado && resultado.dados && Array.isArray(resultado.dados.disciplinas)) {
      dadosAtuais = resultado.dados.disciplinas;
    } else {
      dadosAtuais = JSON.parse(JSON.stringify(dadosDisciplinasLocais));
    }

    document.getElementById("secao-login").classList.add("oculto");
    document.getElementById("secao-boletim").classList.remove("oculto");

    renderizarBoletim();
    atualizarGraficos();
  } catch (erro) {
    msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    msgLogin.style.color = "#f87171";
  }
}

// Salvar alterações na API
async function salvarBoletim() {
  const msgEdicao = document.getElementById("msg-edicao");
  const inputsInvalidos = document.querySelectorAll(".campo-invalido");

  if (inputsInvalidos.length > 0) {
    msgEdicao.textContent = "Corrija os campos destacados em vermelho antes de salvar.";
    msgEdicao.style.color = "#f87171";
    return;
  }

  const linhas = document.querySelectorAll("#tabela-corpo tr");
  const novasDisciplinas = [];
  let existeErro = false;

  linhas.forEach((linha) => {
    const nomeDis = linha.dataset.disciplina;
    const in1 = linha.querySelector(".inp-t1");
    const in2 = linha.querySelector(".inp-t2");
    const in3 = linha.querySelector(".inp-t3");
    const inf1 = linha.querySelector(".inp-f1");
    const inf2 = linha.querySelector(".inp-f2");
    const inf3 = linha.querySelector(".inp-f3");

    const v1 = validarNotaEditada(in1.value);
    const v2 = validarNotaEditada(in2.value);
    const v3 = validarNotaEditada(in3.value);
    const vf1 = validarFaltaEditada(inf1.value);
    const vf2 = validarFaltaEditada(inf2.value);
    const vf3 = validarFaltaEditada(inf3.value);

    if (!v1.valida || !v2.valida || !v3.valida || !vf1.valida || !vf2.valida || !vf3.valida) {
      existeErro = true;
      if (!v1.valida) in1.classList.add("campo-invalido");
      if (!v2.valida) in2.classList.add("campo-invalido");
      if (!v3.valida) in3.classList.add("campo-invalido");
      if (!vf1.valida) inf1.classList.add("campo-invalido");
      if (!vf2.valida) inf2.classList.add("campo-invalido");
      if (!vf3.valida) inf3.classList.add("campo-invalido");
    } else {
      novasDisciplinas.push({
        disciplina: nomeDis,
        tri1: v1.valor,
        tri2: v2.valor,
        tri3: v3.valor,
        faltas: [vf1.valor, vf2.valor, vf3.valor]
      });
    }
  });

  if (existeErro) {
    msgEdicao.textContent = "Existem valores inválidos. Verifique as notas e faltas.";
    msgEdicao.style.color = "#f87171";
    return;
  }

  msgEdicao.textContent = "Salvando...";
  msgEdicao.style.color = "#cbd5e1";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: { disciplinas: novasDisciplinas }
      })
    });

    if (resposta.ok) {
      dadosAtuais = novasDisciplinas;
      modoEdicao = false;
      msgEdicao.textContent = "Dados salvos com sucesso.";
      msgEdicao.style.color = "#34d399";
      
      document.getElementById("btn-alterar-dados").classList.remove("oculto");
      document.getElementById("btn-salvar-dados").classList.add("oculto");
      document.getElementById("btn-cancelar-edicao").classList.add("oculto");

      renderizarBoletim();
      atualizarGraficos();
    } else {
      msgEdicao.textContent = "Falha ao salvar dados no servidor. Tente novamente.";
      msgEdicao.style.color = "#f87171";
    }
  } catch (erro) {
    msgEdicao.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    msgEdicao.style.color = "#f87171";
  }
}

// Alternar para modo de edição
function ativarModoEdicao() {
  modoEdicao = true;
  document.getElementById("msg-edicao").textContent = "";
  document.getElementById("btn-alterar-dados").classList.add("oculto");
  document.getElementById("btn-salvar-dados").classList.remove("oculto");
  document.getElementById("btn-cancelar-edicao").classList.remove("oculto");
  renderizarBoletim();
}

// Cancelar a edição
function cancelarModoEdicao() {
  modoEdicao = false;
  document.getElementById("msg-edicao").textContent = "";
  document.getElementById("btn-alterar-dados").classList.remove("oculto");
  document.getElementById("btn-salvar-dados").classList.add("oculto");
  document.getElementById("btn-cancelar-edicao").classList.add("oculto");
  renderizarBoletim();
}

// Renderiza os cards e a tabela com segurança no DOM
function renderizarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = "";

  let somaMediasGerais = 0;
  let disciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let contadorBomDesempenho = 0;
  let contadorAtencao = 0;

  dadosAtuais.forEach((item) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

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

    const arrFaltas = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const totalFaltasDisciplina = arrFaltas.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    totalFaltasGeral += totalFaltasDisciplina;

    const linha = document.createElement("tr");
    linha.dataset.disciplina = item.disciplina;

    const tdNome = document.createElement("td");
    const strongNome = document.createElement("strong");
    strongNome.textContent = item.disciplina; // Segurança contra XSS
    tdNome.appendChild(strongNome);
    linha.appendChild(tdNome);

    if (modoEdicao) {
      const val1 = n1 !== null ? String(n1).replace(".", ",") : "";
      const val2 = n2 !== null ? String(n2).replace(".", ",") : "";
      const val3 = n3 !== null ? String(n3).replace(".", ",") : "";

      const f1 = arrFaltas[0] !== undefined ? arrFaltas[0] : 0;
      const f2 = arrFaltas[1] !== undefined ? arrFaltas[1] : 0;
      const f3 = arrFaltas[2] !== undefined ? arrFaltas[2] : 0;

      linha.innerHTML += `
        <td><input type="text" class="input-edicao inp-t1" value="${val1}" /></td>
        <td><input type="text" class="input-edicao inp-t2" value="${val2}" /></td>
        <td><input type="text" class="input-edicao inp-t3" value="${val3}" /></td>
        <td><strong>${mediaTexto}</strong></td>
        <td>
          <div style="display:flex; gap:2px;">
            <input type="text" class="input-edicao inp-f1" value="${f1}" title="Faltas 1º Tri" />
            <input type="text" class="input-edicao inp-f2" value="${f2}" title="Faltas 2º Tri" />
            <input type="text" class="input-edicao inp-f3" value="${f3}" title="Faltas 3º Tri" />
          </div>
        </td>
        <td class="${classeSituacao}">${situacao}</td>
      `;

      // Adiciona validação visual em tempo real nos inputs
      const inputsNota = linha.querySelectorAll(".inp-t1, .inp-t2, .inp-t3");
      inputsNota.forEach((inp) => {
        inp.addEventListener("input", () => {
          const check = validarNotaEditada(inp.value);
          if (!check.valida) inp.classList.add("campo-invalido");
          else inp.classList.remove("campo-invalido");
        });
      });

      const inputsFalta = linha.querySelectorAll(".inp-f1, .inp-f2, .inp-f3");
      inputsFalta.forEach((inp) => {
        inp.addEventListener("input", () => {
          const check = validarFaltaEditada(inp.value);
          if (!check.valida) inp.classList.add("campo-invalido");
          else inp.classList.remove("campo-invalido");
        });
      });
    } else {
      const txt1 = n1 !== null ? n1.toFixed(1).replace(".", ",") : "—";
      const txt2 = n2 !== null ? n2.toFixed(1).replace(".", ",") : "—";
      const txt3 = n3 !== null ? n3.toFixed(1).replace(".", ",") : "—";

      linha.innerHTML += `
        <td>${txt1}</td>
        <td>${txt2}</td>
        <td>${txt3}</td>
        <td><strong>${mediaTexto}</strong></td>
        <td>${totalFaltasDisciplina}</td>
        <td class="${classeSituacao}">${situacao}</td>
      `;
    }

    tabelaCorpo.appendChild(linha);
  });

  const mediaGeralFinal = disciplinasComMedia > 0
    ? (somaMediasGerais / disciplinasComMedia).toFixed(1).replace(".", ",")
    : "—";

  document.getElementById("card-media-geral").textContent = mediaGeralFinal;
  document.getElementById("card-total-faltas").textContent = totalFaltasGeral;
  document.getElementById("card-bom-desempenho").textContent = contadorBomDesempenho;
  document.getElementById("card-atencao").textContent = contadorAtencao;
}

// -------------------------------------------------------------
// CAMADA EXCLUSIVA DOS GRÁFICOS (SOMENTE LEITURA DO ESTADO)
// -------------------------------------------------------------

// Gráfico 1: Média por Disciplina (Barras Horizontais)
function atualizarGraficoMedias() {
  const ctx = document.getElementById("graficoMediasDisciplinas");
  if (!ctx) return;

  if (graficoMedias) {
    graficoMedias.destroy();
  }

  const rotulos = [];
  const medias = [];
  const coresBarras = [];

  dadosAtuais.forEach((item) => {
    rotulos.push(item.disciplina);
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
      const media = soma / notasValidas.length;
      medias.push(Number(media.toFixed(1)));
      coresBarras.push(media >= 6.0 ? "#8b5cf6" : "#f87171");
    } else {
      medias.push(null);
      coresBarras.push("#a1a1aa");
    }
  });

  graficoMedias = new Chart(ctx, {
    type: "bar",
    data: {
      labels: rotulos,
      datasets: [
        {
          label: "Média",
          data: medias,
          backgroundColor: coresBarras,
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.raw;
              if (val === null || val === undefined) return " Média: —";
              return ` Média: ${String(val.toFixed(1)).replace(".", ",")}`;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 10,
          grid: { color: "#27272a" },
          ticks: { color: "#cbd5e1" }
        },
        y: {
          grid: { display: false },
          ticks: { color: "#f4f4f5", font: { size: 11 } }
        }
      }
    }
  });
}

// Gráfico 2: Evolução da Média Geral (Linha)
function atualizarGraficoEvolucao() {
  const ctx = document.getElementById("graficoEvolucaoTrimestres");
  if (!ctx) return;

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
  }

  const somas = [0, 0, 0];
  const contadores = [0, 0, 0];

  dadosAtuais.forEach((item) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    if (n1 !== null) { somas[0] += n1; contadores[0]++; }
    if (n2 !== null) { somas[1] += n2; contadores[1]++; }
    if (n3 !== null) { somas[2] += n3; contadores[2]++; }
  });

  const mediasTrimestrais = [
    contadores[0] > 0 ? Number((somas[0] / contadores[0]).toFixed(1)) : null,
    contadores[1] > 0 ? Number((somas[1] / contadores[1]).toFixed(1)) : null,
    contadores[2] > 0 ? Number((somas[2] / contadores[2]).toFixed(1)) : null
  ];

  graficoEvolucao = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [
        {
          label: "Média Geral",
          data: mediasTrimestrais,
          borderColor: "#a855f7",
          backgroundColor: "rgba(168, 85, 247, 0.2)",
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: "#a855f7"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.raw;
              if (val === null || val === undefined) return " Média: —";
              return ` Média: ${String(val.toFixed(1)).replace(".", ",")}`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          grid: { color: "#27272a" },
          ticks: { color: "#cbd5e1" }
        },
        x: {
          grid: { color: "#27272a" },
          ticks: { color: "#cbd5e1" }
        }
      }
    }
  });
}

// Gráfico 3: Faltas por Trimestre (Barras)
function atualizarGraficoFaltas() {
  const ctx = document.getElementById("graficoFaltasTrimestres");
  if (!ctx) return;

  if (graficoFaltas) {
    graficoFaltas.destroy();
  }

  let faltasT1 = 0;
  let faltasT2 = 0;
  let faltasT3 = 0;

  dadosAtuais.forEach((item) => {
    const arrFaltas = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    faltasT1 += Number(arrFaltas[0]) || 0;
    faltasT2 += Number(arrFaltas[1]) || 0;
    faltasT3 += Number(arrFaltas[2]) || 0;
  });

  // Avaliação interna da referência de risco (350 faltas)
  const totalFaltasAcumuladas = faltasT1 + faltasT2 + faltasT3;
  const limiteReferenciaInterna = 350;
  const estadoCritico = totalFaltasAcumuladas >= limiteReferenciaInterna;

  const cardFaltas = document.getElementById("card-faltas-grafico");
  const badgePerigo = document.getElementById("badge-perigo");

  if (cardFaltas && badgePerigo) {
    if (estadoCritico) {
      cardFaltas.classList.add("card-perigo");
      badgePerigo.classList.remove("oculto");
    } else {
      cardFaltas.classList.remove("card-perigo");
      badgePerigo.classList.add("oculto");
    }
  }

  graficoFaltas = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [
        {
          label: "Faltas",
          data: [faltasT1, faltasT2, faltasT3],
          backgroundColor: estadoCritico ? "#ef4444" : "#34d399",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Faltas: ${context.raw}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#27272a" },
          ticks: { color: "#cbd5e1" }
        },
        x: {
          grid: { color: "#27272a" },
          ticks: { color: "#cbd5e1" }
        }
      }
    }
  });
}

// Orquestrador de atualização da camada visual dos gráficos
function atualizarGraficos() {
  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}

// Configuração dos eventos da página
document.getElementById("btn-entrar").addEventListener("click", abrirBoletim);
document.getElementById("input-pin").addEventListener("keypress", (e) => {
  if (e.key === "Enter") abrirBoletim();
});
document.getElementById("btn-alterar-dados").addEventListener("click", ativarModoEdicao);
document.getElementById("btn-salvar-dados").addEventListener("click", salvarBoletim);
document.getElementById("btn-cancelar-edicao").addEventListener("click", cancelarModoEdicao);