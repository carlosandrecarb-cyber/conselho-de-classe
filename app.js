var listaEstudantes = []; 
var indexAtual = 0; 
var avaliacaoAtual = {}; 
var avaliacaoTurma = {};
var tempoRestante = 180; 
var timerInterval = null;

// Lembre de substituir pelo URL oficial do seu Web App do Google Apps Script publicado
var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxX1sStFXfdo44S5SWoHAeM1anaxMLTeoKggcNgDGW1Fp9NPMtb79UY66aRTu3N9Ek8/exec";

window.onload = function() {
  carregarTurmasDoGoogle();
  timerInterval = setInterval(atualizarTimer, 1000);
};

function showView(id) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function verificarSenha() {
  if(document.getElementById('inputSenha').value === 'mestra2026') {
    showView('view-especialista');
  } else { 
    alert('Senha Incorreta!'); 
    document.getElementById('inputSenha').value = ''; 
  }
}

// Comunicação com o Google Sheets / Apps Script
function carregarTurmasDoGoogle() {
  // Caso esteja rodando integrado ao Apps Script, usa a função nativa; se hospedado na Vercel, usará requisição JSONP/Fetch
  if (typeof google !== 'undefined' && google.script) {
    google.script.run.withSuccessHandler(preencherSelectsTurmas).getTurmas();
  } else {
    // Modo Web App Externo (Vercel)
    fetch(GOOGLE_SCRIPT_URL + "?action=getTurmas")
      .then(res => res.json())
      .then(turmas => preencherSelectsTurmas(turmas))
      .catch(err => console.log("Aguardando vínculo com o Apps Script:", err));
  }
}

function preencherSelectsTurmas(turmas) {
  var selects = ['selectTurma', 'selectGerarTurma', 'p_turma'];
  selects.forEach(id => {
    var el = document.getElementById(id);
    if(el) {
      el.innerHTML = '<option value="">Selecione a Turma...</option>';
      turmas.forEach(t => el.innerHTML += '<option value="'+t+'">'+t+'</option>');
    }
  });
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
  if(alunos.length === 0) { 
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
      `;
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
  if(turmaSel && typeof google !== 'undefined' && google.script) {
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

function addObs(texto) { 
  var txt = document.getElementById('txtObs'); 
  txt.value = txt.value.length > 0 ? txt.value + " | " + texto : texto; 
}

function salvarTurmaEIniciar() {
  var turmaSel = document.getElementById('selectTurma').value;
  if(!turmaSel) { 
    alert("Selecione uma turma no topo da tela primeiro."); 
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
        alert("Atenção: Nenhum estudante cadastrado para esta turma na aba ESTUDANTES.");
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
  document.getElementById('loadingArea').style.display = 'none'; 
  document.getElementById('resultArea').style.display = 'none'; 
}

function fecharModalPDF() { 
  document.getElementById('modalRelatorios').style.display = 'none'; 
}

function iniciarGeracaoPDF(tipo) {
  var trim = document.getElementById('selectTrimestre').value; 
  var turma = document.getElementById('selectGerarTurma').value; 
  var link = document.getElementById('linkMoldeAta').value;
  
  if (tipo === 'ata' && (!link || !link.includes("docs.google.com"))) { 
    alert("Cole o link do Molde."); 
    return; 
  }
  document.getElementById('loadingArea').style.display = 'block';
  
  var sCb = function(res) {
    document.getElementById('loadingArea').style.display = 'none';
    if(res.erro) { 
      alert(res.erro); 
    } else { 
      document.getElementById('resultArea').style.display = 'block'; 
      document.getElementById('linkDownload').href = res.url; 
    }
  };
  
  if (typeof google !== 'undefined' && google.script) {
    if (tipo === 'ata') {
      google.script.run.withSuccessHandler(sCb).gerarAtaOficialPDF(trim, turma, link);
    } else {
      google.script.run.withSuccessHandler(sCb).gerarRelatorioAvancado(trim, turma);
    }
  }
}
