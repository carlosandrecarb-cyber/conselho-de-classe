// URL oficial do Google Apps Script (Backend conectado à Planilha)
const URL_API_GOOGLE = "https://script.google.com/macros/s/AKfycbwEE2uiIXRoJJ4CzW7N-YR9Af9mz-qIDqsfFJEgQn6sa4WcxxO-zKBvnYegh8z-WOB-/exec";

var listaEstudantes = []; 
var indexAtual = 0; 
var avaliacaoAtual = {}; 
var avaliacaoTurma = {};
var tempoRestante = 180; 
var timerInterval = null;

window.onload = function() {
  carregarTurmasDoGoogle();
  timerInterval = setInterval(atualizarTimer, 1000);
  carregarLotacaoNaTelaMestre();
  
  var hoje = new Date();
  var dataIso = hoje.toISOString().split('T')[0];
  if(document.getElementById('inputDataAta')) document.getElementById('inputDataAta').value = dataIso;
};

function showView(id) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  var target = document.getElementById(id);
  if(target) target.classList.add('active');
}

function verificarSenha() {
  var senhaInput = document.getElementById('inputSenha');
  if(senhaInput && senhaInput.value === 'mestra2026') {
    showView('view-especialista');
    carregarTurmasDoGoogle(); 
    carregarLotacaoNaTelaMestre(); 
  } else { 
    alert('Senha Incorreta!'); 
    if(senhaInput) senhaInput.value = ''; 
  }
}

// Comunicação via API Fetch com o Apps Script
function chamarApiGoogle(funcao, dados = null, callbackSucesso) {
  var payload = { funcao: funcao, dados: dados };
  
  fetch(URL_API_GOOGLE, {
    method: 'POST',
    mode: 'no-cors', // Necessário para Web Apps do Google
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(() => {
    // Como o no-cors não retorna o JSON diretamente, simulamos a resposta de sucesso ou buscamos via GET
    if (callbackSucesso) callbackSucesso({ sucesso: true });
  })
  .catch(err => {
    console.error("Erro na comunicação com o Google Sheets: ", err);
  });

  // Buscas de leitura via GET
  if (funcao === 'getTurmas' || funcao === 'getEstudantesPorTurma' || funcao === 'carregarLotacaoGlobal') {
    fetch(URL_API_GOOGLE + "?funcao=" + funcao + (dados ? "&param=" + encodeURIComponent(JSON.stringify(dados)) : ""))
      .then(res => res.json())
      .then(resData => {
        if (callbackSucesso) callbackSucesso(resData);
      })
      .catch(() => {
        // Fallback offline estruturado
        if (funcao === 'getTurmas') callbackSucesso(["6R1", "6R2", "6R3", "6R4", "7R1", "7R2", "7R3", "7R4"]);
        if (funcao === 'getEstudantesPorTurma') callbackSucesso([{numero: 1, nome: "ALLEXYS EDWARDO"}, {numero: 2, nome: "ANTONIO JUNIOR"}]);
        if (funcao === 'carregarLotacaoGlobal') callbackSucesso([]);
      });
  }
}

function carregarTurmasDoGoogle() {
  chamarApiGoogle('getTurmas', null, preencherSelectsTurmas);
}

function preencherSelectsTurmas(turmas) {
  if (!turmas || !Array.isArray(turmas)) turmas = ["6R1", "6R2", "6R3", "6R4", "7R1", "7R2", "7R3", "7R4"];
  var selects = ['selectTurma', 'selectGerarTurma', 'p_turma', 'espSelectTurma'];
  selects.forEach(id => {
    var el = document.getElementById(id);
    if(el) {
      var valorAtual = el.value;
      el.innerHTML = '<option value="">Selecione a Turma...</option>';
      turmas.forEach(t => {
        el.innerHTML += '<option value="'+t+'">'+t+'</option>';
      });
      if(valorAtual) el.value = valorAtual;
    }
  });
}

// Configuração dos Arrays globais
var listaTurmasGlobal = ["6R1", "6R2", "6R3", "6R4", "7R1", "7R2", "7R3", "7R4", "8R1", "8R2", "8R3", "8R4", "9R1", "9R2", "9R3", "9R4"];
var listaComponentesGlobal = ["Arte", "Ciências", "Educação Física", "Ensino Religioso", "Geografia", "História", "Língua Inglesa", "Língua Portuguesa", "Matemática"];
var listaCargosGlobal = ["Diretor(a)", "Vice-Diretor(a)", "Especialista / EEB", "Professor(a) de Apoio", "Professor(a) Regente"];

function adicionarCardProfissional(dados = {}) {
  var container = document.getElementById('containerProfissionais');
  if(!container) return;
  var idU = Date.now() + Math.random();

  var cargosHtml = '';
  listaCargosGlobal.forEach(c => {
    var sel = (dados.cargo === c) ? 'selected' : '';
    cargosHtml += `<option value="${c}" ${sel}>${c}</option>`;
  });

  var turnosHtml = '';
  ["Matutino", "Vespertino"].forEach(t => {
    var chk = (dados.turnos && dados.turnos.includes(t)) ? 'checked' : '';
    turnosHtml += `<label><input type="checkbox" class="t_turno_${idU}" value="${t}" ${chk}> <span>${t}</span></label>`;
  });

  var turmasHtml = '';
  listaTurmasGlobal.forEach(t => {
    var chk = (dados.turmas && dados.turmas.includes(t)) ? 'checked' : '';
    turmasHtml += `<label><input type="checkbox" class="t_turma_${idU}" value="${t}" ${chk}> <span>${t}</span></label>`;
  });

  var compHtml = '';
  listaComponentesGlobal.forEach(c => {
    var chk = (dados.componentes && dados.componentes.includes(c)) ? 'checked' : '';
    compHtml += `<label><input type="checkbox" class="t_comp_${idU}" value="${c}" ${chk}> <span>${c}</span></label>`;
  });

  var card = document.createElement('div');
  card.className = 'prof-card p-3 mb-3 bg-light border rounded shadow-sm';
  card.id = 'card_' + idU;
  card.innerHTML = `
    <div class="d-flex justify-content-end mb-2">
      <button type="button" class="btn btn-sm btn-outline-danger fw-bold" onclick="removerCardEAtualizar('${idU}')"><i class="fa-solid fa-trash me-1"></i> Excluir Servidor</button>
    </div>
    <div class="row g-3 mb-3">
      <div class="col-md-5">
        <label class="form-label fw-bold fs-7">Nome do Servidor(a):</label>
        <input type="text" class="form-control prof-nome" placeholder="Nome Completo" value="${dados.nome || ''}">
      </div>
      <div class="col-md-4">
        <label class="form-label fw-bold fs-7">Cargo / Função:</label>
        <select class="form-select prof-cargo" onchange="verificarCargoSelecionado('${idU}')">${cargosHtml}</select>
      </div>
      <div class="col-md-3">
        <label class="form-label fw-bold fs-7">Turnos de Atuação:</label>
        <div class="d-flex gap-3">${turnosHtml}</div>
      </div>
    </div>
    <div class="mb-2">
      <label class="form-label fw-bold fs-7 text-primary">Turmas Atendidas:</label>
      <div class="d-flex flex-wrap gap-2">${turmasHtml}</div>
    </div>
    <div id="div_comp_${idU}">
      <label class="form-label fw-bold fs-7 text-success">Componentes Curriculares:</label>
      <div class="d-flex flex-wrap gap-2">${compHtml}</div>
    </div>
    <input type="hidden" class="prof-id" value="${idU}">
  `;
  container.appendChild(card);
  verificarCargoSelecionado(idU);
}

function verificarCargoSelecionado(idU) {
  var card = document.getElementById('card_' + idU);
  if(!card) return;
  var cargoSelect = card.querySelector('.prof-cargo');
  var divComp = document.getElementById('div_comp_' + idU);
  
  if (cargoSelect && divComp) {
    var cargo = cargoSelect.value;
    if (cargo === 'Diretor(a)' || cargo === 'Vice-Diretor(a)' || cargo === 'Especialista / EEB') {
      divComp.style.display = 'none';
      card.querySelectorAll('.t_comp_' + idU).forEach(el => el.checked = false);
    } else {
      divComp.style.display = 'block';
    }
  }
}

function removerCardEAtualizar(idU) {
  var card = document.getElementById('card_' + idU);
  if(card) card.remove();
  salvarLotacaoGlobal(false);
}

function carregarLotacaoNaTelaMestre() {
  var localData = localStorage.getItem('db_lotacao_mestra');
  if (localData) {
    try {
      var dados = JSON.parse(localData);
      if (dados && dados.length > 0) {
        renderizarCardsNaTela(dados);
        atualizarTabelaRegistroVisual(dados);
        return;
      }
    } catch(e) {}
  }

  chamarApiGoogle('carregarLotacaoGlobal', null, function(dados) {
    if (dados && dados.length > 0) {
      localStorage.setItem('db_lotacao_mestra', JSON.stringify(dados));
      renderizarCardsNaTela(dados);
      atualizarTabelaRegistroVisual(dados);
    } else {
      renderizarCardsNaTela([]);
      atualizarTabelaRegistroVisual([]);
    }
  });
}

function renderizarCardsNaTela(dados) {
  var container = document.getElementById('containerProfissionais');
  if(!container) return;
  container.innerHTML = '';
  if (dados && dados.length > 0) {
    dados.forEach(p => adicionarCardProfissional(p));
  } else {
    adicionarCardProfissional();
  }
}

function coletarDadosLotacao() {
  var lista = [];
  var cards = document.querySelectorAll('.prof-card');
  
  cards.forEach(card => {
    var nomeInput = card.querySelector('.prof-nome');
    var cargoSelect = card.querySelector('.prof-cargo');
    var idInput = card.querySelector('.prof-id');
    
    if (!nomeInput || !cargoSelect || !idInput) return;

    var nome = nomeInput.value.trim();
    var cargo = cargoSelect.value;
    var idU = idInput.value;

    var turnos = [];
    card.querySelectorAll('.t_turno_' + idU + ':checked').forEach(el => turnos.push(el.value));

    var turmas = [];
    card.querySelectorAll('.t_turma_' + idU + ':checked').forEach(el => turmas.push(el.value));

    var componentes = [];
    if (cargo !== 'Diretor(a)' && cargo !== 'Vice-Diretor(a)' && cargo !== 'Especialista / EEB') {
      card.querySelectorAll('.t_comp_' + idU + ':checked').forEach(el => componentes.push(el.value));
    }

    if (nome !== "") {
      lista.push({ nome: nome, cargo: cargo, turnos: turnos, turmas: turmas, componentes: componentes });
    }
  });
  return lista;
}

function atualizarTabelaRegistroVisual(lista) {
  var tbody = document.getElementById('tabelaRegistroCorpo');
  if(!tbody) return;
  
  if (!lista || lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum servidor cadastrado ainda.</td></tr>';
    return;
  }

  var html = '';
  lista.forEach(p => {
    html += `
      <tr>
        <td class="fw-bold">${p.nome}</td>
        <td><span class="badge bg-secondary">${p.cargo}</span></td>
        <td>${p.turnos && p.turnos.length > 0 ? p.turnos.join(', ') : '-'}</td>
        <td><span class="text-primary fw-bold">${p.turmas && p.turmas.length > 0 ? p.turmas.join(', ') : '-'}</span></td>
        <td>${p.componentes && p.componentes.length > 0 ? p.componentes.join(', ') : '<span class="text-muted fst-italic">Não se aplica</span>'}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function salvarLotacaoGlobal(mostrarAlerta = true) {
  var lista = coletarDadosLotacao();
  localStorage.setItem('db_lotacao_mestra', JSON.stringify(lista));
  atualizarTabelaRegistroVisual(lista);

  var btnSalvar = document.getElementById('btnSalvarLotacao');
  if (btnSalvar) {
    btnSalvar.innerHTML = '<i class="fa-solid fa-check me-2"></i> Salvo com Sucesso!';
    btnSalvar.classList.remove('btn-secondary');
    btnSalvar.classList.add('btn-success');
    setTimeout(function() {
      btnSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk me-2"></i> Salvar Lotação';
      btnSalvar.classList.remove('btn-success');
      btnSalvar.classList.add('btn-secondary');
    }, 2500);
  }

  if (mostrarAlerta) {
    alert("Lotação guardada! Pronto para seguir.");
  }

  chamarApiGoogle('salvarLotacaoGlobal', lista);
}

function irParaSelecaoTurmaEtapa2() {
  salvarLotacaoGlobal(false);
  document.getElementById('panel-lotacao-mestre').style.display = 'none';
  document.getElementById('panel-selecao-inicial').style.display = 'flex';
}

function voltarParaLotacaoEtapa1() {
  document.getElementById('panel-selecao-inicial').style.display = 'none';
  document.getElementById('panel-lotacao-mestre').style.display = 'block';
  carregarLotacaoNaTelaMestre();
}

function iniciarSessaoConselho() {
  var turmaSel = document.getElementById('espSelectTurma').value;
  var turnoSel = document.getElementById('espSelectTurno').value;
  var trimSel = document.getElementById('espSelectTrimestre').value;
  
  if (!turmaSel) {
    alert("Por favor, selecione uma turma.");
    return;
  }

  document.getElementById('lblTurmaAtiva').innerText = "- " + turmaSel + " (" + turnoSel + ")";
  var selectTopo = document.getElementById('selectTurma');
  if(selectTopo) selectTopo.value = turmaSel;

  var selectTrim = document.getElementById('selectTrimestre');
  if(selectTrim) selectTrim.value = trimSel;

  document.getElementById('panel-selecao-inicial').style.display = 'none';
  document.getElementById('panel-datashow-principal').style.display = 'block';
  document.getElementById('panel-turma').style.display = 'block';
  document.getElementById('panel-estudantes').style.display = 'none';

  carregarEquipeDaTurmaNaTela(turnoSel, turmaSel);

  chamarApiGoogle('getEstudantesPorTurma', turmaSel, function(alunos) { 
    listaEstudantes = alunos || []; 
  });
}

function carregarEquipeDaTurmaNaTela(turno, turmaAlvo) {
  var localData = localStorage.getItem('db_lotacao_mestra');
  if (localData) {
    try {
      renderizarMembrosNaTela(JSON.parse(localData), turno, turmaAlvo);
      return;
    } catch(e) {}
  }

  chamarApiGoogle('carregarLotacaoGlobal', null, function(lista) {
    renderizarMembrosNaTela(lista, turno, turmaAlvo);
  });
}

function renderizarMembrosNaTela(listaProfissionais, turnoAlvo, turmaAlvo) {
  var containerMembros = document.getElementById('boxMembrosResumo');
  if (!containerMembros) return;

  var direcao = "Não informado";
  var vice = "-";
  var especialista = "Não informado";
  var apoio = "-";
  var regentesList = [];

  if (listaProfissionais && Array.isArray(listaProfissionais)) {
    listaProfissionais.forEach(p => {
      if (p.turnos && p.turnos.includes(turnoAlvo)) {
        if (p.cargo === 'Diretor(a)') direcao = p.nome;
        if (p.cargo === 'Vice-Diretor(a)') vice = p.nome;
        if (p.cargo === 'Especialista / EEB') especialista = p.nome;
        if (p.cargo === 'Professor(a) de Apoio') apoio = p.nome;

        if (p.cargo === 'Professor(a) Regente' && p.turmas && p.turmas.includes(turmaAlvo)) {
          regentesList.push(`<li><b>${p.componentes.join(', ')}:</b> ${p.nome}</li>`);
        }
      }
    });
  }

  containerMembros.innerHTML = `
    <div class="p-3 mb-3 bg-light border rounded" style="font-size: 0.85rem; text-align: left;">
      <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-user-tie me-1"></i> Equipe e Regentes da Turma ${turmaAlvo} (${turnoAlvo})</h6>
      <div class="row">
        <div class="col-md-6">
          <p class="m-1"><b>Direção:</b> ${direcao} | <b>Vice:</b> ${vice}</p>
          <p class="m-1"><b>Especialista:</b> ${especialista} | <b>Apoio:</b> ${apoio}</p>
        </div>
        <div class="col-md-6">
          <p class="m-1 fw-bold text-secondary">Professores Regentes:</p>
          <ul class="m-0 ps-3" style="max-height: 80px; overflow-y: auto;">${regentesList.length > 0 ? regentesList.join('') : '<li>Nenhum regente vinculado.</li>'}</ul>
        </div>
      </div>
      <div class="text-end mt-2">
        <a href="javascript:void(0);" onclick="voltarParaLotacaoEtapa1()" class="text-decoration-none fw-bold" style="font-size: 0.75rem;"><i class="fa-solid fa-pen-to-square"></i> Voltar e Atualizar Painel Mestre</a>
      </div>
    </div>
  `;
}

function voltarParaSelecaoTurma() {
  document.getElementById('panel-datashow-principal').style.display = 'none';
  document.getElementById('panel-selecao-inicial').style.display = 'flex';
}

function mudarTurmaTopo() {
  var turmaSel = document.getElementById('selectTurma').value;
  if(!turmaSel) return;
  chamarApiGoogle('getEstudantesPorTurma', turmaSel, function(alunos) { 
    listaEstudantes = alunos || []; 
  });
}

function voltarParaTurma() { 
  document.getElementById('panel-estudantes').style.display = 'none'; 
  document.getElementById('panel-turma').style.display = 'block'; 
  var timerBox = document.getElementById('timerBox');
  if(timerBox) timerBox.style.display = 'none'; 
}

function selecionarSegmento(btn, categoria, valor, tipoCor, showMotivo = false) {
  if (categoria.startsWith('turma_')) {
    avaliacaoTurma[categoria] = valor; 
  } else {
    avaliacaoAtual[categoria] = valor;
  }
  var buttons = btn.parentElement.getElementsByClassName('seg-btn');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('active-good', 'active-warning', 'active-danger');
  }
  btn.classList.add('active-' + tipoCor);

  if (categoria === 'caracteristica') { 
    var box = document.getElementById('txtMotivo'); 
    if (showMotivo && box) { 
      box.style.display = 'block'; 
      box.focus(); 
    } else if(box) { 
      box.style.display = 'none'; 
      box.value = ''; 
    } 
  }
}

function salvarTurmaEIniciar() {
  var turmaSel = document.getElementById('selectTurma').value;
  if(!turmaSel) { alert("Selecione uma turma."); return; }
  
  avaliacaoTurma.turma = turmaSel; 
  avaliacaoTurma.trimestre = document.getElementById('selectTrimestre').value; 
  var aeeBox = document.getElementById('txtAeePdi');
  avaliacaoTurma.aee_pdi = aeeBox ? aeeBox.value : ''; 
  var obsTurmaBox = document.getElementById('txtObsTurma');
  avaliacaoTurma.observacoes = obsTurmaBox ? obsTurmaBox.value : '';
  
  chamarApiGoogle('salvarAvaliacaoTurma', avaliacaoTurma);
  
  chamarApiGoogle('getEstudantesPorTurma', turmaSel, function(alunos) {
    listaEstudantes = alunos || [];
    if(listaEstudantes.length > 0) {
      document.getElementById('panel-turma').style.display = 'none'; 
      document.getElementById('panel-estudantes').style.display = 'block';
      var timerBox = document.getElementById('timerBox');
      if(timerBox) timerBox.style.display = 'flex'; 
      indexAtual = 0;
      exibirEstudante();
    } else {
      alert("Atenção: Nenhum estudante cadastrado para esta turma.");
    }
  });
}

function limparFormularioEstudante() {
  avaliacaoAtual = {}; 
  var txtObs = document.getElementById('txtObs');
  if(txtObs) txtObs.value = ''; 
  var txtMotivo = document.getElementById('txtMotivo');
  if(txtMotivo) { txtMotivo.style.display = 'none'; txtMotivo.value = ''; }
  var buttons = document.querySelectorAll('#panel-estudantes .seg-btn');
  buttons.forEach(b => b.classList.remove('active-good', 'active-warning', 'active-danger'));
}

function exibirEstudante() {
  if(!listaEstudantes || listaEstudantes.length === 0) return;
  limparFormularioEstudante();
  document.getElementById('lblNomeEstudante').innerText = listaEstudantes[indexAtual].nome; 
  document.getElementById('lblIndex').innerText = indexAtual + 1; 
  document.getElementById('lblTotal').innerText = listaEstudantes.length;
  tempoRestante = 180; 
}

function proximoEstudante() { 
  if(indexAtual < listaEstudantes.length - 1) { 
    indexAtual++; 
    exibirEstudante(); 
  } else {
    alert("Fim da lista de estudantes desta turma!");
    voltarParaTurma();
  }
}

function salvarEProximo() {
  if(!listaEstudantes || listaEstudantes.length === 0) return;
  avaliacaoAtual.estudante = listaEstudantes[indexAtual].nome; 
  avaliacaoAtual.numero = listaEstudantes[indexAtual].numero;
  avaliacaoAtual.turma = document.getElementById('selectTurma').value; 
  avaliacaoAtual.trimestre = document.getElementById('selectTrimestre').value;
  var txtObs = document.getElementById('txtObs');
  var txtMotivo = document.getElementById('txtMotivo');
  avaliacaoAtual.observacoes = txtObs ? txtObs.value : ''; 
  avaliacaoAtual.motivo = txtMotivo ? txtMotivo.value : '';
  
  chamarApiGoogle('salvarAvaliacao', avaliacaoAtual); 
  proximoEstudante();
}

function atualizarTimer() {
  if (tempoRestante > 0) tempoRestante--;
  var min = Math.floor(tempoRestante / 60); 
  var sec = tempoRestante % 60;
  var timerEl = document.getElementById('timerText');
  var timerBox = document.getElementById('timerBox');
  if(timerEl && timerBox && timerBox.style.display !== 'none') {
    timerEl.innerText = (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
    timerBox.style.borderColor = tempoRestante <= 30 ? '#ef4444' : '#facc15';
    timerEl.style.color = tempoRestante <= 30 ? '#ef4444' : '#facc15';
  }
}

function abrirModalPDF() { 
  var modal = document.getElementById('modalRelatorios');
  if(modal) modal.style.display = 'flex'; 
}

function fecharModalPDF() { 
  var modal = document.getElementById('modalRelatorios');
  if(modal) modal.style.display = 'none'; 
}
