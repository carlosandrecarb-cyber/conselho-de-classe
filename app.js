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
  document.getElementById(id).classList.add('active');
}

function verificarSenha() {
  if(document.getElementById('inputSenha').value === 'mestra2026') {
    showView('view-especialista');
    carregarTurmasDoGoogle(); 
    carregarLotacaoNaTelaMestre(); 
  } else { 
    alert('Senha Incorreta!'); 
    document.getElementById('inputSenha').value = ''; 
  }
}

function carregarTurmasDoGoogle() {
  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(preencherSelectsTurmas).getTurmas();
  } else {
    var turmasExemplo = ["6R1", "6R2", "6R3", "6R4", "7R1", "7R2", "7R3", "7R4", "8R1", "8R2", "8R3", "8R4", "9R1", "9R2", "9R3", "9R4"];
    preencherSelectsTurmas(turmasExemplo);
  }
}

function preencherSelectsTurmas(turmas) {
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

// Painel Mestre de Lotação
var listaTurmasGlobal = ["6R1", "6R2", "6R3", "6R4", "7R1", "7R2", "7R3", "7R4", "8R1", "8R2", "8R3", "8R4", "9R1", "9R2", "9R3", "9R4"];
var listaComponentesGlobal = ["Arte", "Ciências", "Educação Física", "Ensino Religioso", "Geografia", "História", "Língua Inglesa", "Língua Portuguesa", "Matemática"];
var listaCargosGlobal = ["Diretor(a)", "Vice-Diretor(a)", "Especialista / EEB", "Professor(a) de Apoio", "Professor(a) Regente"];

function adicionarCardProfissional(dados = {}) {
  var container = document.getElementById('containerProfissionais');
  if(!container) return;
  var idU = Date.now() + Math.random();

  var cargosHtml = '';
  listaCargosGlobal.forEach(c => {
    var sel = dados.cargo === c ? 'selected' : '';
    cargosHtml += `<option ${sel}>${c}</option>`;
  });

  var turnosHtml = '';
  ["Matutino", "Vespertino"].forEach(t => {
    var chk = dados.turnos && dados.turnos.includes(t) ? 'checked' : '';
    turnosHtml += `<label><input type="checkbox" class="t_turno_${idU}" value="${t}" ${chk}> <span>${t}</span></label>`;
  });

  var turmasHtml = '';
  listaTurmasGlobal.forEach(t => {
    var chk = dados.turmas && dados.turmas.includes(t) ? 'checked' : '';
    turmasHtml += `<label><input type="checkbox" class="t_turma_${idU}" value="${t}" ${chk}> <span>${t}</span></label>`;
  });

  var compHtml = '';
  listaComponentesGlobal.forEach(c => {
    var chk = dados.componentes && dados.componentes.includes(c) ? 'checked' : '';
    compHtml += `<label><input type="checkbox" class="t_comp_${idU}" value="${c}" ${chk}> <span>${c}</span></label>`;
  });

  var card = document.createElement('div');
  card.className = 'prof-card';
  card.id = 'card_' + idU;
  card.innerHTML = `
    <div class="d-flex justify-content-end mb-2">
      <button type="button" class="btn btn-sm btn-outline-danger fw-bold" onclick="removerCardEAtualizar('${idU}')"><i class="fa-solid fa-trash me-1"></i> Excluir Servidor</button>
    </div>
    <div class="row g-3 mb-3">
      <div class="col-md-5">
        <label class="form-label fw-bold fs-7">Nome do Servidor(a):</label>
        <input type="text" class="input-field prof-nome" placeholder="Nome Completo" value="${dados.nome || ''}">
      </div>
      <div class="col-md-4">
        <label class="form-label fw-bold fs-7">Cargo / Função:</label>
        <select class="input-field prof-cargo" onchange="verificarCargoSelecionado('${idU}')">${cargosHtml}</select>
      </div>
      <div class="col-md-3">
        <label class="form-label fw-bold fs-7">Turnos de Atuação:</label>
        <div class="checkbox-group">${turnosHtml}</div>
      </div>
    </div>
    <div class="mb-2">
      <label class="form-label fw-bold fs-7 text-primary">Turmas Atendidas (Marque quantas precisar):</label>
      <div class="checkbox-group">${turmasHtml}</div>
    </div>
    <div id="div_comp_${idU}">
      <label class="form-label fw-bold fs-7 text-success">Componentes Curriculares (Se aplicável):</label>
      <div class="checkbox-group">${compHtml}</div>
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

  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(function(dados) {
      if (dados && dados.length > 0) {
        localStorage.setItem('db_lotacao_mestra', JSON.stringify(dados));
        renderizarCardsNaTela(dados);
        atualizarTabelaRegistroVisual(dados);
      } else {
        renderizarCardsNaTela([]);
        atualizarTabelaRegistroVisual([]);
      }
    }).carregarLotacaoGlobal();
  } else {
    renderizarCardsNaTela([]);
    atualizarTabelaRegistroVisual([]);
  }
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
    var nomeInput = card.querySelector('input.prof-nome');
    var cargoSelect = card.querySelector('select.prof-cargo');
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
        <td>${p.componentes && p.componentes.length > 0 ? p.componentes.join(', ') : '<span class="text-muted font-italic">Não se aplica</span>'}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function salvarLotacaoGlobal(mostrarAlerta = true) {
  var lista = coletarDadosLotacao();
  
  // Salva no Banco Local
  localStorage.setItem('db_lotacao_mestra', JSON.stringify(lista));

  // Atualiza a tabela visual abaixo imediatamente
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

  // Sincroniza com o Google Sheets
  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(function() {
      if (mostrarAlerta) alert('Lotação salva com sucesso na Planilha e no App Web!');
    }).salvarLotacaoGlobal(lista);
  } else {
    if (mostrarAlerta) alert('Lotação salva com sucesso no App Web!');
  }
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

  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(function(alunos) { 
      listaEstudantes = alunos; 
    }).getEstudantesPorTurma(turmaSel);
  } else {
    listaEstudantes = [{numero: 1, nome: "ALLEXYS EDWARDO"}, {numero: 2, nome: "BIANCA GOMES"}];
  }
}

function carregarEquipeDaTurmaNaTela(turno, turmaAlvo) {
  var localData = localStorage.getItem('db_lotacao_mestra');
  if (localData) {
    try {
      renderizarMembrosNaTela(JSON.parse(localData), turno, turmaAlvo);
      return;
    } catch(e) {}
  }

  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(function(lista) {
      renderizarMembrosNaTela(lista, turno, turmaAlvo);
    }).carregarLotacaoGlobal();
  }
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
          <p class="m-1 fw-bold text-secondary">Professores Regentes desta Turma:</p>
          <ul class="m-0 ps-3" style="max-height: 80px; overflow-y: auto;">${regentesList.length > 0 ? regentesList.join('') : '<li>Nenhum regente vinculado a esta turma.</li>'}</ul>
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

function carregarTabelaProfessor() {
  var turma = document.getElementById('p_turma').value;
  if(!turma) return;
  var container = document.getElementById('p_tbody_alunos');
  container.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin text-primary fa-2x"></i></div>';
  
  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(renderizarAlunosProfessor).getEstudantesPorTurma(turma);
  }
}

function renderizarAlunosProfessor(alunos) {
  document.getElementById('p_total_alunos').innerText = alunos.length;
  var container = document.getElementById('p_tbody_alunos');
  var html = '';
  if(!alunos || alunos.length === 0) { 
    container.innerHTML = '<p class="text-center text-muted fw-bold py-3">Nenhum aluno cadastrado.</p>'; 
    return; 
  }
  
  alunos.forEach(function(a, i) {
    html += `
      <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white border rounded shadow-sm">
        <span class="fw-bold text-uppercase" style="font-size: 0.85rem; width: 35%;">${a.nome}</span>
        <div class="d-flex gap-2 flex-wrap" style="width: 65%; justify-content: flex-end;">
          <input type="checkbox" id="inf_${i}" class="btn-check chk-infreq" value="${a.nome}" autocomplete="off">
          <label class="btn btn-outline-danger btn-sm fw-bold" for="inf_${i}" style="font-size: 0.7rem;">Infrequente</label>

          <input type="checkbox" id="aba_${i}" class="btn-check chk-abaixo" value="${a.nome}" autocomplete="off">
          <label class="btn btn-outline-warning btn-sm fw-bold text-dark" for="aba_${i}" style="font-size: 0.7rem;">Abaixo Média</label>

          <input type="checkbox" id="ref_${i}" class="btn-check chk-reforco" value="${a.nome}" autocomplete="off">
          <label class="btn btn-outline-success btn-sm fw-bold" for="ref_${i}" style="font-size: 0.7rem;">Reforço</label>

          <input type="checkbox" id="prog_${i}" class="btn-check chk-prog" value="${a.nome}" autocomplete="off">
          <label class="btn btn-outline-primary btn-sm fw-bold" for="prog_${i}" style="font-size: 0.7rem;">Prog. Parcial</label>

          <input type="checkbox" id="alf_${i}" class="btn-check chk-alfab" value="${a.nome}" autocomplete="off">
          <label class="btn btn-outline-secondary btn-sm fw-bold" for="alf_${i}" style="font-size: 0.7rem;">Não Alfab.</label>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

function enviarDiagnostico() {
  if(!document.getElementById('p_nome').value || !document.getElementById('p_turma').value) { 
    alert('Preencha seu Nome e a Turma.'); 
    return; 
  }
  var btn = document.getElementById('btnEnviarProf');
  btn.innerHTML = 'Gravando...'; 
  btn.disabled = true;

  var getChecked = (cls) => Array.from(document.querySelectorAll('.' + cls + ':checked')).map(cb => cb.value).join(', ');

  var dados = {
    trimestre: document.getElementById('p_trim').value, 
    turma: document.getElementById('p_turma').value,
    componente: document.getElementById('p_comp').value, 
    professor: document.getElementById('p_nome').value,
    infrequentes: getChecked('chk-infreq'), 
    abaixo_media: getChecked('chk-abaixo'),
    reforco: getChecked('chk-reforco'), 
    progressao: getChecked('chk-prog'),
    nao_alfabetizado: getChecked('chk-alfab'), 
    caracteristicas: document.getElementById('p_caract').value,
    intervencoes: document.getElementById('p_interv').value, 
    metodologias: document.getElementById('p_metodos').value
  };

  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(function() {
      document.getElementById('form-prof').style.display = 'none';
      document.getElementById('sucesso-prof').style.display = 'block';
    }).salvarPreConselho(dados);
  }
}

function mudarTurmaTopo() {
  var turmaSel = document.getElementById('selectTurma').value;
  if(!turmaSel) return;
  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(function(alunos) { 
      listaEstudantes = alunos; 
    }).getEstudantesPorTurma(turmaSel);
  }
}

function voltarParaTurma() { 
  document.getElementById('panel-estudantes').style.display = 'none'; 
  document.getElementById('panel-turma').style.display = 'block'; 
  document.getElementById('timerBox').style.display = 'none'; 
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
    if (showMotivo) { 
      box.style.display = 'block'; 
      box.focus(); 
    } else { 
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
  avaliacaoTurma.aee_pdi = document.getElementById('txtAeePdi').value; 
  avaliacaoTurma.observacoes = document.getElementById('txtObsTurma').value;
  
  if (typeof google !== 'undefined' && google.script) {
    google.script.run.salvarAvaliacaoTurma(avaliacaoTurma);
    
    google.script.run.withSuccessHandler(function(alunos) {
      listaEstudantes = alunos;
      if(listaEstudantes && listaEstudantes.length > 0) {
        document.getElementById('panel-turma').style.display = 'none'; 
        document.getElementById('panel-estudantes').style.display = 'block';
        document.getElementById('timerBox').style.display = 'flex'; 
        indexAtual = 0;
        exibirEstudante();
      } else {
        alert("Atenção: Nenhum estudante cadastrado para esta turma.");
      }
    }).getEstudantesPorTurma(turmaSel);
  }
}

function limparFormularioEstudante() {
  avaliacaoAtual = {}; 
  document.getElementById('txtObs').value = ''; 
  document.getElementById('txtMotivo').style.display = 'none'; 
  document.getElementById('txtMotivo').value = '';
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
  avaliacaoAtual.observacoes = document.getElementById('txtObs').value; 
  avaliacaoAtual.motivo = document.getElementById('txtMotivo').value;
  
  if (typeof google !== 'undefined' && google.script) {
    google.script.run.salvarAvaliacao(avaliacaoAtual); 
  }
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
  document.getElementById('modalRelatorios').style.display = 'flex'; 
}
function fecharModalPDF() { 
  document.getElementById('modalRelatorios').style.display = 'none'; 
}
