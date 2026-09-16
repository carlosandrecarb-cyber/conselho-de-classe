// URL OFICIAL (Substitua se tiver gerado uma nova no Apps Script)
const URL_API_GOOGLE = "https://script.google.com/macros/s/AKfycbwYaqIn2pL2ePwILxPcjERVFH_oW_eTW_zB8rNKQiSNHrDHG7MqLAFYc6sJOUeoxZ2D/exec";

var listaEstudantes = []; var indexAtual = 0; 
var avaliacaoAtual = {}; var avaliacaoTurma = {};

window.onload = function() {
  console.log("Sistema iniciado...");
  carregarTurmasDoGoogle();
  carregarLotacaoNaTelaMestre();
};

// ==========================================
// 1. MOTOR DE COMUNICAÇÃO ROBUSTA COM O GOOGLE
// ==========================================
function chamarApiGoogle(funcao, dados = null, callback) {
  var isGet = ['getTurmas', 'getEstudantesPorTurma', 'carregarLotacaoGlobal'].includes(funcao);
  
  if (isGet) {
    var urlGet = URL_API_GOOGLE + "?funcao=" + funcao + (dados ? "&param=" + encodeURIComponent(JSON.stringify(dados)) : "");
    console.log("Chamando GET:", funcao);
    fetch(urlGet)
      .then(res => res.json())
      .then(data => { if(callback) callback(data); })
      .catch(e => { console.error("Erro no GET:", e); });
  } else {
    var payload = JSON.stringify({ funcao: funcao, dados: dados });
    console.log("Chamando POST:", funcao);
    fetch(URL_API_GOOGLE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload
    })
    .then(res => res.json())
    .then(data => { if(callback) callback(data); })
    .catch(e => { console.error("Erro no POST:", e); });
  }
}

// ==========================================
// 2. BUSCA DE TURMAS
// ==========================================
function carregarTurmasDoGoogle() {
  chamarApiGoogle('getTurmas', null, function(turmas) {
    if(!turmas || turmas.length === 0 || turmas[0].includes("Erro")) {
      turmas = ["6º REG 1", "6º REG 2", "7º REG 1"]; // Backup caso a planilha falhe
    }
    var espSelect = document.getElementById('espSelectTurma');
    if(espSelect) {
      espSelect.innerHTML = '<option value="">Selecione...</option>';
      turmas.forEach(t => espSelect.innerHTML += `<option value="${t}">${t}</option>`);
    }
  });
}

// ==========================================
// 3. LOTAÇÃO (TELA 1) E TRANSIÇÕES DE TELA
// ==========================================
var listaTurmasGlobal = ["6º REG 1", "6º REG 2", "6º REG 3", "6º REG 4", "7º REG 1", "7º REG 2", "7º REG 3", "7º REG 4"];
var listaCargosGlobal = ["Diretor(a)", "Vice-Diretor(a)", "Especialista / EEB", "Professor(a) Regente"];
var listaCompGlobal = ["Arte", "Ciências", "Educação Física", "História", "Português", "Matemática"];

function carregarLotacaoNaTelaMestre() {
  var container = document.getElementById('containerProfissionais');
  if(!container) return;
  chamarApiGoogle('carregarLotacaoGlobal', null, function(dados) {
    container.innerHTML = '';
    if (dados && dados.length > 0) {
      dados.forEach(p => adicionarCardProfissional(p));
      atualizarTabela(dados);
    } else {
      adicionarCardProfissional();
    }
  });
}

function adicionarCardProfissional(dados = {}) {
  var container = document.getElementById('containerProfissionais');
  var id = Date.now() + Math.random();
  var card = document.createElement('div');
  card.className = 'p-3 mb-3 border rounded shadow-sm bg-white prof-card';
  
  var cargosHtml = listaCargosGlobal.map(c => `<option value="${c}" ${dados.cargo===c?'selected':''}>${c}</option>`).join('');
  var turmasHtml = listaTurmasGlobal.map(t => `<label class="me-2"><input type="checkbox" class="chk-turma" value="${t}" ${(dados.turmas||[]).includes(t)?'checked':''}> ${t}</label>`).join('');
  
  card.innerHTML = `
    <div class="d-flex justify-content-end mb-2"><button class="btn btn-sm btn-outline-danger" onclick="this.parentElement.parentElement.remove()"><i class="fa-solid fa-trash"></i> Excluir</button></div>
    <div class="row g-3">
      <div class="col-md-5"><label class="fw-bold">Nome do Servidor(a):</label><input type="text" class="form-control prof-nome" value="${dados.nome||''}"></div>
      <div class="col-md-4"><label class="fw-bold">Cargo / Função:</label><select class="form-select prof-cargo">${cargosHtml}</select></div>
      <div class="col-md-3"><label class="fw-bold">Turnos:</label><br><label class="me-2"><input type="checkbox" class="chk-turno" value="Matutino" ${(dados.turnos||[]).includes('Matutino')?'checked':''}> Matutino</label></div>
    </div>
    <div class="mt-2"><label class="fw-bold text-primary">Turmas Atendidas:</label><br>${turmasHtml}</div>
  `;
  container.appendChild(card);
}

function coletarDadosLotacao() {
  var lista = [];
  document.querySelectorAll('.prof-card').forEach(c => {
    var nome = c.querySelector('.prof-nome').value.trim();
    if(nome) {
      lista.push({
        nome: nome, cargo: c.querySelector('.prof-cargo').value,
        turnos: Array.from(c.querySelectorAll('.chk-turno:checked')).map(el=>el.value),
        turmas: Array.from(c.querySelectorAll('.chk-turma:checked')).map(el=>el.value),
        componentes: []
      });
    }
  });
  return lista;
}

function atualizarTabela(lista) {
  var tbody = document.getElementById('tabelaRegistroCorpo');
  if(!tbody) return;
  tbody.innerHTML = lista.map(p => `<tr><td class="fw-bold">${p.nome}</td><td>${p.cargo}</td><td>${p.turnos.join(', ')}</td><td class="text-primary">${p.turmas.join(', ')}</td><td>-</td></tr>`).join('');
}

function salvarLotacaoGlobal() {
  var lista = coletarDadosLotacao();
  atualizarTabela(lista);
  chamarApiGoogle('salvarLotacaoGlobal', lista);
  var btn = document.getElementById('btnSalvarLotacao');
  if(btn) { btn.innerHTML = "Salvo!"; setTimeout(() => btn.innerHTML = "Salvar Lotação", 2000); }
}

// ==== AS TRANSIÇÕES DE TELA QUE NÃO ESTAVAM FUNCIONANDO ====
function irParaSelecaoTurmaEtapa2() {
  salvarLotacaoGlobal(); // Salva sem travar a tela
  document.getElementById('panel-lotacao-mestre').classList.remove('active');
  document.getElementById('panel-selecao-inicial').classList.add('active');
}

function voltarParaLotacaoEtapa1() {
  document.getElementById('panel-selecao-inicial').classList.remove('active');
  document.getElementById('panel-lotacao-mestre').classList.add('active');
}

// ==========================================
// 4. INICIAR CONSELHO (TELA 2 -> TELA 3)
// ==========================================
function iniciarSessaoConselho() {
  var turmaSel = document.getElementById('espSelectTurma').value;
  if(!turmaSel) { alert("Selecione a turma alvo!"); return; }

  document.getElementById('lblTurmaAtiva').innerText = turmaSel;
  
  // Muda da Seleção Inicial para o Datashow
  document.getElementById('panel-selecao-inicial').classList.remove('active');
  document.getElementById('panel-datashow-principal').classList.add('active');
  
  // Garante que o painel da turma abra primeiro
  document.getElementById('panel-turma').style.display = 'block';
  document.getElementById('panel-estudantes').style.display = 'none';

  // Puxa os alunos no fundo
  chamarApiGoogle('getEstudantesPorTurma', turmaSel, function(alunos) { 
    listaEstudantes = alunos || []; 
  });
}

function voltarParaTurma() {
  document.getElementById('panel-estudantes').style.display = 'none';
  document.getElementById('panel-turma').style.display = 'block';
}

function selecionarSegmento(btn, cat, val, cor, showMotivo=false) {
  if (cat.startsWith('turma_')) avaliacaoTurma[cat] = val; else avaliacaoAtual[cat] = val;
  Array.from(btn.parentElement.children).forEach(b => b.className = 'seg-btn');
  btn.classList.add('active-' + cor);
  if (cat === 'caracteristica') {
    var txt = document.getElementById('txtMotivo');
    if(showMotivo) { txt.style.display='block'; txt.focus(); } else { txt.style.display='none'; txt.value=''; }
  }
}

function salvarTurmaEIniciar() {
  avaliacaoTurma.turma = document.getElementById('lblTurmaAtiva').innerText;
  avaliacaoTurma.trimestre = document.getElementById('espSelectTrimestre').value;
  avaliacaoTurma.observacoes = document.getElementById('txtObsTurma').value;
  chamarApiGoogle('salvarAvaliacaoTurma', avaliacaoTurma);

  if(listaEstudantes.length > 0) {
    document.getElementById('panel-turma').style.display = 'none';
    document.getElementById('panel-estudantes').style.display = 'block';
    indexAtual = 0; exibirEstudante();
  } else {
    alert("Nenhum aluno encontrado ou os alunos ainda estão carregando. Tente em 2 segundos.");
  }
}

function exibirEstudante() {
  avaliacaoAtual = {}; document.getElementById('txtObs').value = '';
  document.querySelectorAll('.seg-btn').forEach(b => b.className = 'seg-btn');
  document.getElementById('txtMotivo').style.display = 'none';
  
  document.getElementById('lblNomeEstudante').innerText = listaEstudantes[indexAtual].nome;
  document.getElementById('lblIndex').innerText = indexAtual + 1;
  document.getElementById('lblTotal').innerText = listaEstudantes.length;
}

function proximoEstudante() {
  if (indexAtual < listaEstudantes.length - 1) { indexAtual++; exibirEstudante(); } 
  else { alert("Último aluno da turma."); voltarParaTurma(); }
}

function salvarEProximo() {
  avaliacaoAtual.estudante = listaEstudantes[indexAtual].nome;
  avaliacaoAtual.turma = document.getElementById('lblTurmaAtiva').innerText;
  avaliacaoAtual.trimestre = document.getElementById('espSelectTrimestre').value;
  avaliacaoAtual.observacoes = document.getElementById('txtObs').value;
  chamarApiGoogle('salvarAvaliacao', avaliacaoAtual);
  proximoEstudante();
}
