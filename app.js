var listaEstudantes = []; 
var indexAtual = 0; 
var avaliacaoAtual = {}; 
var avaliacaoTurma = {};
var tempoRestante = 180; 
var timerInterval = null;
var equipeTurnoAtual = {};

var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxX1sStFXfdo44S5SWoHAeM1anaxMLTeoKggcNgDGW1Fp9NPMtb79UY66aRTu3N9Ek8/exec";

window.onload = function() {
  carregarTurmasDoGoogle();
  timerInterval = setInterval(atualizarTimer, 1000);
  
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
  } else { 
    alert('Senha Incorreta!'); 
    document.getElementById('inputSenha').value = ''; 
  }
}

// Comunicação com o Google Sheets / Apps Script
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

// Fluxo de Início do Conselho pelo Especialista
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

  // Carrega os dados da equipe e professores regentes daquele turno
  carregarEquipeNaTela(turnoSel);

  // Carrega os estudantes
  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(function(alunos) { 
      listaEstudantes = alunos; 
    }).getEstudantesPorTurma(turmaSel);
  } else {
    listaEstudantes = [{numero: 1, nome: "ALLEXYS EDWARDO"}, {numero: 2, nome: "BIANCA GOMES"}];
  }
}

function carregarEquipeNaTela(turno) {
  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(renderizarMembrosNaTela).carregarEquipePorTurno(turno);
  } else {
    var salvo = localStorage.getItem('config_equipe_' + turno);
    if (salvo) {
      renderizarMembrosNaTela(JSON.parse(salvo));
    } else {
      renderizarMembrosNaTela({diretor: 'Não configurado', regentes: {}});
    }
  }
}

function renderizarMembrosNaTela(dados) {
  if (!dados) return;
  equipeTurnoAtual = dados;
  
  var containerMembros = document.getElementById('boxMembrosResumo');
  if (containerMembros) {
    var regentesStr = "";
    if (dados.regentes) {
      for (var comp in dados.regentes) {
        if(dados.regentes[comp]) regentesStr += `<li><b>${comp}:</b> ${dados.regentes[comp]}</li>`;
      }
    }
    
    containerMembros.innerHTML = `
      <div class="p-3 mb-3 bg-light border rounded" style="font-size: 0.85rem; text-align: left;">
        <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-user-tie me-1"></i> Membros e Regentes Atuais (${document.getElementById('espSelectTurno').value})</h6>
        <div class="row">
          <div class="col-md-6">
            <p class="m-1"><b>Direção:</b> ${dados.diretor || 'Não informado'} | <b>Vice:</b> ${dados.vice || '-'}</p>
            <p class="m-1"><b>Especialista:</b> ${dados.especialista || 'Não informado'} | <b>Apoio:</b> ${dados.apoio || '-'}</p>
          </div>
          <div class="col-md-6">
            <p class="m-1 fw-bold text-secondary">Professores Regentes:</p>
            <ul class="m-0 ps-3" style="max-height: 80px; overflow-y: auto;">${regentesStr || '<li>Nenhum regente cadastrado.</li>'}</ul>
          </div>
        </div>
        <div class="text-end mt-2">
          <a href="configuracao-equipe.html" target="_blank" class="text-decoration-none fw-bold" style="font-size: 0.75rem;"><i class="fa-solid fa-pen-to-square"></i> Modificar Membros/Regentes</a>
        </div>
      </div>
    `;
  }
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
  } else {
    renderizarAlunosProfessor([
      {numero: 1, nome: "ALLEXYS EDWARDO"},
      {numero: 2, nome: "BIANCA GOMES"},
      {numero: 3, nome: "DAVI MOTA"}
    ]);
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
  } else {
    setTimeout(function() {
      document.getElementById('form-prof').style.display = 'none';
      document.getElementById('sucesso-prof').style.display = 'block';
    }, 1000);
  }
}

function mudarTurmaTopo() {
  var turmaSel = document.getElementById('selectTurma').value;
  if(!turmaSel) return;
  
  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(function(alunos) { 
      listaEstudantes = alunos; 
    }).getEstudantesPorTurma(turmaSel);
  } else {
    listaEstudantes = [{numero: 1, nome: "ALLEXYS EDWARDO"}, {numero: 2, nome: "BIANCA GOMES"}];
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
  if(!turmaSel) { 
    alert("Selecione uma turma."); 
    return; 
  }
  
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
  } else {
    listaEstudantes = [{numero: 1, nome: "ALLEXYS EDWARDO"}, {numero: 2, nome: "BIANCA GOMES"}];
    document.getElementById('panel-turma').style.display = 'none'; 
    document.getElementById('panel-estudantes').style.display = 'block';
    document.getElementById('timerBox').style.display = 'flex'; 
    indexAtual = 0;
    exibirEstudante();
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
