// ATENÇÃO: COLOQUE A SUA URL GERADA NO APPS SCRIPT AQUI!
const URL_API_GOOGLE = "https://script.google.com/macros/s/AKfycbwYaqIn2pL2ePwILxPcjERVFH_oW_eTW_zB8rNKQiSNHrDHG7MqLAFYc6sJOUeoxZ2D/exec";

var listaEstudantes = []; var indexAtual = 0; 
var avaliacaoAtual = {}; var avaliacaoTurma = {};
var listaTurmasGlobal = [];
var listaServidoresGlobal = [];
var listaCargosGlobal = ["Diretor(a)", "Vice-Diretor(a)", "Especialista / EEB", "Professor(a) Regente", "Professor(a) de Apoio"];
var listaCompGlobal = ["Arte", "Ciências", "Educação Física", "Ensino Religioso", "Geografia", "História", "Inglês", "Português", "Matemática"];

window.onload = function() {
  console.log("Iniciando sistema. Aguardando banco de dados...");
  
  // CARREGAMENTO EM CASCATA: Só desenha a tela depois que baixar tudo do Google
  chamarApiGoogle('getTurmas', null, function(resTurmas) {
    if (resTurmas && !resTurmas.erro) {
      listaTurmasGlobal = resTurmas;
      preencherSelectTurmas(listaTurmasGlobal);
    }

    chamarApiGoogle('getServidores', null, function(resServ) {
      if (resServ && !resServ.erro) {
        listaServidoresGlobal = resServ;
      }
      
      // Somente após ter as Turmas e os Servidores é que montamos os cards!
      carregarLotacaoNaTelaMestre();
    });
  });
};

function showView(id) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function verificarSenha() {
  var senha = document.getElementById('inputSenha');
  if(senha && senha.value === 'mestra2026') {
    showView('view-lotacao');
  } else { 
    alert('Senha Incorreta!'); 
    if(senha) senha.value = ''; 
  }
}

// ==============================================================
// MÁGICA CONTRA O BLOQUEIO: TODAS AS REQUISIÇÕES SÃO POST AGORA
// ==============================================================
function chamarApiGoogle(funcao, dados = null, callback) {
  var payload = JSON.stringify({ funcao: funcao, dados: dados });
  
  fetch(URL_API_GOOGLE, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Força a passagem pelo bloqueio CORS do navegador
    body: payload
  })
  .then(res => res.json())
  .then(data => {
    console.log("Sucesso (" + funcao + "):", data);
    if (callback) callback(data);
  })
  .catch(e => {
    console.error("Erro CRÍTICO na comunicação com o Google (" + funcao + "): ", e);
    alert("Erro ao conectar no banco de dados. Verifique a URL do Apps Script no código.");
  });
}

function preencherSelectTurmas(turmas) {
  var select = document.getElementById('espSelectTurma');
  if(select) {
    select.innerHTML = '<option value="">Selecione a Turma...</option>';
    turmas.forEach(t => select.innerHTML += `<option value="${t}">${t}</option>`);
  }
}

// =====================================
// ETAPA 1: LOTAÇÃO (CADASTRANDO A EQUIPE)
// =====================================
function carregarLotacaoNaTelaMestre() {
  var container = document.getElementById('containerProfissionais');
  if(!container) return;
  
  chamarApiGoogle('carregarLotacaoGlobal', null, function(dados) {
    container.innerHTML = '';
    if (dados && dados.length > 0 && !dados.erro) { 
      dados.forEach(p => adicionarCardProfissional(p)); 
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
  
  // Monta a lista de nomes puxados da aba SERVIDORES
  var nomesHtml = '<option value="">Selecione o Servidor da Planilha...</option>';
  listaServidoresGlobal.forEach(s => {
    var sel = (dados.nome === s) ? 'selected' : '';
    nomesHtml += `<option value="${s}" ${sel}>${s}</option>`;
  });
  
  var campoNomeHtml = listaServidoresGlobal.length > 0 
    ? `<select class="form-select prof-nome fw-bold border-primary text-primary">${nomesHtml}</select>`
    : `<input type="text" class="form-control prof-nome" placeholder="Nenhum servidor encontrado na aba SERVIDORES" value="${dados.nome||''}">`;

  var cargosHtml = listaCargosGlobal.map(c => `<option value="${c}" ${dados.cargo===c?'selected':''}>${c}</option>`).join('');
  
  var turmasHtml = listaTurmasGlobal.length > 0 
    ? listaTurmasGlobal.map(t => `<label class="me-3 mb-2"><input type="checkbox" class="chk-turma" value="${t}" ${(dados.turmas||[]).includes(t)?'checked':''}> <span class="badge bg-light text-dark border">${t}</span></label>`).join('')
    : '<span class="text-danger fw-bold">Nenhuma turma encontrada na aba TURMAS.</span>';
    
  var compHtml = listaCompGlobal.map(c => `<label class="me-3 mb-1"><input type="checkbox" class="chk-comp" value="${c}" ${(dados.componentes||[]).includes(c)?'checked':''}> ${c}</label>`).join('');

  card.innerHTML = `
    <div class="d-flex justify-content-end mb-2"><button class="btn btn-sm btn-outline-danger" onclick="this.parentElement.parentElement.remove()"><i class="fa-solid fa-trash"></i> Remover</button></div>
    <div class="row g-3">
      <div class="col-md-5"><label class="fw-bold">Servidor(a):</label>${campoNomeHtml}</div>
      <div class="col-md-4"><label class="fw-bold">Cargo / Função:</label><select class="form-select prof-cargo" onchange="verificarCargo(this, '${id}')">${cargosHtml}</select></div>
      <div class="col-md-3"><label class="fw-bold">Turnos:</label><br><label class="me-2"><input type="checkbox" class="chk-turno" value="Matutino" ${(dados.turnos||[]).includes('Matutino')?'checked':''}> Matutino</label><label><input type="checkbox" class="chk-turno" value="Vespertino" ${(dados.turnos||[]).includes('Vespertino')?'checked':''}> Vespertino</label></div>
    </div>
    <div class="mt-3 p-2 bg-light border rounded"><label class="fw-bold text-primary mb-2">Turmas Atendidas (Escolha):</label><br><div class="d-flex flex-wrap">${turmasHtml}</div></div>
    <div class="mt-2 comp-container p-2" id="comp_${id}"><label class="fw-bold text-success mb-2">Componentes (Para Regentes):</label><br><div class="d-flex flex-wrap">${compHtml}</div></div>
  `;
  container.appendChild(card);
  verificarCargo(card.querySelector('.prof-cargo'), id);
}

function verificarCargo(selectObj, id) {
  var divComp = document.getElementById('comp_' + id);
  if(!divComp) return;
  if(selectObj.value === 'Professor(a) Regente') { divComp.style.display = 'block'; }
  else { divComp.style.display = 'none'; }
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
        componentes: Array.from(c.querySelectorAll('.chk-comp:checked')).map(el=>el.value)
      });
    }
  });
  return lista;
}

function salvarLotacaoGlobal() {
  var lista = coletarDadosLotacao();
  chamarApiGoogle('salvarLotacaoGlobal', lista);
  var btn = document.getElementById('btnSalvarLotacao');
  if(btn) { btn.innerHTML = "Lotação Salva na Planilha!"; setTimeout(() => btn.innerHTML = "Salvar Lotação", 2500); }
}

// TRANSIÇÕES MANUAIS
function irParaSelecaoTurmaEtapa2() {
  salvarLotacaoGlobal();
  showView('view-selecao');
}

function voltarParaLotacaoEtapa1() {
  showView('view-lotacao');
}

// =====================================
// ETAPA 3: DATASHOW
// =====================================
function iniciarSessaoConselho() {
  var turmaSel = document.getElementById('espSelectTurma').value;
  if(!turmaSel) { alert("Selecione a turma alvo antes de iniciar!"); return; }

  document.getElementById('lblTurmaAtiva').innerText = turmaSel;
  showView('view-datashow');
  document.getElementById('panel-turma').style.display = 'block';
  document.getElementById('panel-estudantes').style.display = 'none';

  // Puxa os alunos da aba ESTUDANTES via POST seguro
  chamarApiGoogle('getEstudantesPorTurma', turmaSel, function(alunos) { 
    if(!alunos || alunos.erro) {
      listaEstudantes = [];
    } else {
      listaEstudantes = alunos;
    }
  });
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
    alert("A lista de estudantes ainda não carregou, ou a turma está vazia na aba ESTUDANTES.");
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
  else { alert("Finalizado! Último aluno gravado."); document.getElementById('panel-estudantes').style.display = 'none'; document.getElementById('panel-turma').style.display = 'block'; }
}

function salvarEProximo() {
  avaliacaoAtual.estudante = listaEstudantes[indexAtual].nome;
  avaliacaoAtual.turma = document.getElementById('lblTurmaAtiva').innerText;
  avaliacaoAtual.trimestre = document.getElementById('espSelectTrimestre').value;
  avaliacaoAtual.observacoes = document.getElementById('txtObs').value;
  chamarApiGoogle('salvarAvaliacao', avaliacaoAtual);
  proximoEstudante();
}
```eof

### Os Seus Próximos Passos:
1. Vá no seu Google Sheets e clique no botão **`+`** (Adicionar página) no canto inferior esquerdo.
2. Renomeie a aba para **`SERVIDORES`** e preencha alguns nomes na Coluna A.
3. Copie o código acima e substitua todo o seu arquivo `app.js` lá no GitHub. 
4. Aperte **`CTRL + F5`** no seu Vercel para limpar o histórico do Chrome. 
Você verá o sistema esperar um segundo e logo exibir todos os nomes e as turmas!Analisando as imagens fornecidas, identifiquei uma inconsistência importante entre a orientação do sistema e a estrutura atual da planilha.

### Análise da Inconsistência

Existe um conflito direto entre o nome da aba solicitada pelo sistema e as abas que realmente existem no seu arquivo do Excel/Google Sheets.

*   **Instrução no Sistema (`image_f38b6b.png`):** No campo "Servidor(a)", o texto de orientação (placeholder) diz explicitamente: *"Digite o nome (Cadastre na aba **SERVIDORES**)"*.
*   **Abas da Planilha (`image_f38867.png`):** As abas visíveis são `TURMAS`, `EQUIPE_TURNO`, `ESTUDANTES`, `AVALIACOES_TURMA`, `DADOS_PRE_CONSELHO` e as abas específicas de cada turma (6R1 a 9R4).

**Problema:** Não existe nenhuma aba chamada **`SERVIDORES`** na sua planilha. 

---

### Recomendações para Correção

Para que o sistema funcione corretamente e não confunda os usuários que farão o preenchimento, você precisará alinhar as duas plataformas. Escolha uma das opções abaixo:

1.  **Ajustar a Planilha:** Renomeie a aba atual **`EQUIPE_TURNO`** (caso ela seja a aba que contém os dados dos servidores) para **`SERVIDORES`**, ou crie uma nova aba com esse nome exato, caso ela esteja faltando.
2.  **Ajustar o Sistema:** Se a aba oficial para esse cadastro realmente deve se chamar **`EQUIPE_TURNO`**, será necessário alterar o texto de ajuda (placeholder) no código do painel mestre para: *"Digite o nome (Cadastre na aba EQUIPE_TURNO)"*.

As demais abas listadas na planilha parecem estar bem organizadas e padronizadas para o uso de turmas e avaliações. Resolvendo a nomenclatura da aba de servidores, a integração deve ocorrer sem problemas.
