// ATENÇÃO: COLOQUE A NOVA URL GERADA NO APPS SCRIPT AQUI DENTRO DAS ASPAS:
const URL_API_GOOGLE = "https://script.google.com/macros/s/AKfycbwYaqIn2pL2ePwILxPcjERVFH_oW_eTW_zB8rNKQiSNHrDHG7MqLAFYc6sJOUeoxZ2D/exec";

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

// NOVO MOTOR DE COMUNICAÇÃO (À PROVA DE TRAVAMENTOS)
function chamarApiGoogle(funcao, dados = null, callbackSucesso) {
  var isGet = (funcao === 'getTurmas' || funcao === 'getEstudantesPorTurma' || funcao === 'carregarLotacaoGlobal');

  if (isGet) {
    var urlParams = URL_API_GOOGLE + "?funcao=" + funcao + (dados ? "&param=" + encodeURIComponent(JSON.stringify(dados)) : "");
    fetch(urlParams)
      .then(res => res.json())
      .then(resData => { if (callbackSucesso) callbackSucesso(resData); })
      .catch(err => {
        console.error("Erro ao puxar dados:", err);
        // Fallback para não travar a tela
        if (funcao === 'getTurmas' && callbackSucesso) callbackSucesso(["6R1 (Offline)", "6R2 (Offline)"]);
      });
  } else {
    var payload = { funcao: funcao, dados: dados };
    // Usando text/plain para não bloquear o CORS no navegador
    fetch(URL_API_GOOGLE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(resData => { if (callbackSucesso) callbackSucesso(resData); })
    .catch(err => console.error("Erro ao salvar dados:", err));
  }
}

function carregarTurmasDoGoogle() {
  chamarApiGoogle('getTurmas', null, preencherSelectsTurmas);
}

function preencherSelectsTurmas(turmas) {
  if (!turmas || turmas.length === 0) turmas = ["Nenhuma turma encontrada"];
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

// --- FUNÇÕES DE LOTAÇÃO ---
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
    if (['Diretor(a)', 'Vice-Diretor(a)', 'Especialista / EEB'].includes(cargoSelect.value)) {
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
  chamarApiGoogle('carregarLotacaoGlobal', null, function(dados) {
    var container = document.getElementById('containerProfissionais');
    if(container) container.innerHTML = '';
    
    if (dados && dados.length > 0) {
      localStorage.setItem('db_lotacao_mestra', JSON.stringify(dados));
      dados.forEach(p => adicionarCardProfissional(p));
      atualizarTabelaRegistroVisual(dados);
    } else {
      adicionarCardProfissional();
      atualizarTabelaRegistroVisual([]);
    }
  });
}

function coletarDadosLotacao() {
  var lista = [];
  document.querySelectorAll('.prof-card').forEach(card => {
    var nome = card.querySelector('.prof-nome').value.trim();
    var cargo = card.querySelector('.prof-cargo').value;
    var idU = card.querySelector('.prof-id').value;
    
    if (nome !== "") {
      var turnos = Array.from(card.querySelectorAll('.t_turno_' + idU + ':checked')).map(el => el.value);
      var turmas = Array.from(card.querySelectorAll('.t_turma_' + idU + ':checked')).map(el => el.value);
      var componentes = Array.from(card.querySelectorAll('.t_comp_' + idU + ':checked')).map(el => el.value);
      lista.push({ nome, cargo, turnos, turmas, componentes });
    }
  });
  return lista;
}

function atualizarTabelaRegistroVisual(lista) {
  var tbody = document.getElementById('tabelaRegistroCorpo');
  if(!tbody) return;
  if (!lista || lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum servidor cadastrado.</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(p => `
    <tr>
      <td class="fw-bold">${p.nome}</td>
      <td><span class="badge bg-secondary">${p.cargo}</span></td>
      <td>${p.turnos.length > 0 ? p.turnos.join(', ') : '-'}</td>
      <td><span class="text-primary fw-bold">${p.turmas.length > 0 ? p.turmas.join(', ') : '-'}</span></td>
      <td>${p.componentes.length > 0 ? p.componentes.join(', ') : '<span class="text-muted fst-italic">Não se aplica</span>'}</td>
    </tr>
  `).join('');
}

function salvarLotacaoGlobal(mostrarAlerta = true) {
  var lista = coletarDadosLotacao();
  localStorage.setItem('db_lotacao_mestra', JSON.stringify(lista));
  atualizarTabelaRegistroVisual(lista);

  var btnSalvar = document.getElementById('btnSalvarLotacao');
  if (btnSalvar) {
    btnSalvar.innerHTML = '<i class="fa-solid fa-check me-2"></i> Salvo!';
    btnSalvar.classList.replace('btn-secondary', 'btn-success');
    setTimeout(() => {
      btnSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk me-2"></i> Salvar Lotação';
      btnSalvar.classList.replace('btn-success', 'btn-secondary');
    }, 2000);
  }

  if (mostrarAlerta) alert("Lotação guardada!");
  
  // Envia em segundo plano
  chamarApiGoogle('salvarLotacaoGlobal', lista);
}

// CORREÇÃO DO BOTÃO AVANÇAR: AGORA FORÇA A MUDANÇA DE TELA IMEDIATAMENTE
function irParaSelecaoTurmaEtapa2() {
  try {
    salvarLotacaoGlobal(false); // Salva no background
  } catch(e) {
    console.error("Erro ao salvar lotação", e);
  }
  
  // Muda as telas na marra, garantindo que o botão funcione
  var painelLotacao = document.getElementById('panel-lotacao-mestre');
  var painelSelecao = document.getElementById('panel-selecao-inicial');
  
  if (painelLotacao) painelLotacao.style.display = 'none';
  if (painelSelecao) {
    painelSelecao.style.display = 'flex';
    painelSelecao.classList.add('active');
  }
}

function voltarParaLotacaoEtapa1() {
  var painelLotacao = document.getElementById('panel-lotacao-mestre');
  var painelSelecao = document.getElementById('panel-selecao-inicial');
  
  if (painelSelecao) {
    painelSelecao.style.display = 'none';
    painelSelecao.classList.remove('active');
  }
  if (painelLotacao) painelLotacao.style.display = 'block';
}

function iniciarSessaoConselho() {
  var turmaSel = document.getElementById('espSelectTurma').value;
  var turnoSel = document.getElementById('espSelectTurno').value;
  var trimSel = document.getElementById('espSelectTrimestre').value;
  
  if (!turmaSel) { alert("Selecione uma turma."); return; }

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
    renderizarMembrosNaTela(JSON.parse(localData), turno, turmaAlvo);
  } else {
    chamarApiGoogle('carregarLotacaoGlobal', null, function(lista) {
      renderizarMembrosNaTela(lista, turno, turmaAlvo);
    });
  }
}

function renderizarMembrosNaTela(listaProfissionais, turnoAlvo, turmaAlvo) {
  var containerMembros = document.getElementById('boxMembrosResumo');
  if (!containerMembros) return;

  var direcao = "Não informado", vice = "-", especialista = "Não informado", apoio = "-";
  var regentesList = [];

  if (listaProfissionais && Array.isArray(listaProfissionais)) {
    listaProfissionais.forEach(p => {
      if (p.turnos && p.turnos.includes(turnoAlvo)) {
        if (p.cargo === 'Diretor(a)') direcao = p.nome;
        if (p.cargo === 'Vice-Diretor(a)') vice = p.nome;
        if (p.cargo === 'Especialista / EEB') especialista = p.nome;
        if (p.cargo === 'Professor(a) de Apoio') apoio = p.nome;

        if (p.cargo === 'Professor(a) Regente' && p.turmas.includes(turmaAlvo)) {
          regentesList.push(`<li><b>${p.componentes.join(', ')}:</b> ${p.nome}</li>`);
        }
      }
    });
  }

  containerMembros.innerHTML = `
    <div class="p-3 mb-3 bg-light border rounded text-start" style="font-size: 0.85rem;">
      <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-user-tie me-1"></i> Equipe da Turma ${turmaAlvo} (${turnoAlvo})</h6>
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
    </div>
  `;
}

function voltarParaSelecaoTurma() {
  document.getElementById('panel-datashow-principal').style.display = 'none';
  document.getElementById('panel-selecao-inicial').style.display = 'flex';
}

function voltarParaTurma() { 
  document.getElementById('panel-estudantes').style.display = 'none'; 
  document.getElementById('panel-turma').style.display = 'block'; 
  var timerBox = document.getElementById('timerBox');
  if(timerBox) timerBox.style.display = 'none'; 
}

function selecionarSegmento(btn, categoria, valor, tipoCor, showMotivo = false) {
  if (categoria.startsWith('turma_')) { avaliacaoTurma[categoria] = valor; } 
  else { avaliacaoAtual[categoria] = valor; }

  Array.from(btn.parentElement.getElementsByClassName('seg-btn')).forEach(b => 
    b.classList.remove('active-good', 'active-warning', 'active-danger')
  );
  btn.classList.add('active-' + tipoCor);

  if (categoria === 'caracteristica') { 
    var box = document.getElementById('txtMotivo'); 
    if (showMotivo && box) { box.style.display = 'block'; box.focus(); } 
    else if(box) { box.style.display = 'none'; box.value = ''; } 
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

function exibirEstudante() {
  if(!listaEstudantes || listaEstudantes.length === 0) return;
  avaliacaoAtual = {}; 
  var txtObs = document.getElementById('txtObs'); if(txtObs) txtObs.value = ''; 
  var txtMotivo = document.getElementById('txtMotivo'); if(txtMotivo) { txtMotivo.style.display = 'none'; txtMotivo.value = ''; }
  document.querySelectorAll('#panel-estudantes .seg-btn').forEach(b => b.classList.remove('active-good', 'active-warning', 'active-danger'));

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
