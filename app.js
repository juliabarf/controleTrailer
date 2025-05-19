// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA9DjfscVG3d0WH7UPPXi8vHQujVEoADgM",
  authDomain: "controletrailer.firebaseapp.com",
  projectId: "controletrailer",
  storageBucket: "controletrailer.firebasestorage.app",
  messagingSenderId: "1040174429375",
  appId: "1:1040174429375:web:8fc037450b0a4873d3820a",
  measurementId: "G-ZVZP12Q24S"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const pedidosRef = database.ref('pedidos');

document.addEventListener('DOMContentLoaded', () => {
  let produtoCounter = 1;
  let pedidoCounter = 0;

  pedidosRef.once('value', snapshot => {
    if (snapshot.exists()) pedidoCounter = snapshot.numChildren();
  });

  document.getElementById('adicionarProduto').addEventListener('click', () => {
    produtoCounter++;

    const novoProdutoDiv = document.createElement('div');
    novoProdutoDiv.className = 'produto-container';
    novoProdutoDiv.id = 'produtoContainer' + produtoCounter;

    novoProdutoDiv.innerHTML = `
      <hr>
      <div class="form-group stylish-select">
        <label>Selecione um produto</label>
        <div class="select-wrapper">
          <select class="form-control produto-select" name="produto[]" required>
            <option value="" disabled selected>Escolha uma opção...</option>
            <option value="Sopa(P)">Sopa Pequena (P)</option>
            <option value="Sopa(M)">Sopa Média (M)</option>
            <option value="Sopa(G)">Sopa Grande (G)</option>
          </select>
          <div class="select-arrow"></div>
        </div>
      </div>

      <div class="form-group stylish-select">
        <label>Quantidade</label>
        <div class="select-wrapper">
          <select class="form-control quantidade-select" name="quantidade[]" required>
            <option value="" disabled selected>Selecione...</option>
            <option value="1">1 unidade</option>
            <option value="2">2 unidades</option>
            <option value="3">3 unidades</option>
            <option value="4">4 unidades</option>
            <option value="5">5 unidades</option>
          </select>
          <div class="select-arrow"></div>
        </div>
      </div>

      <div class="form-group">
        <label>Preço do produto</label>
        <input type="number" class="form-control preco-input" placeholder="R$ 0,00" name="preco[]" step="0.01" min="0" required>
      </div>

      <button type="button" class="templatemo-blue-button remover-produto" data-container="produtoContainer${produtoCounter}">Remover este produto</button>
    `;

    document.getElementById('produtosAdicionados').appendChild(novoProdutoDiv);
  });

  document.addEventListener('click', e => {
    if (e.target && e.target.classList.contains('remover-produto')) {
      const containerId = e.target.getAttribute('data-container');
      document.getElementById(containerId).remove();
    }
  });

  document.getElementById('pedidoForm').addEventListener('submit', e => {
    e.preventDefault();

    const produtos = [{
      nome: document.getElementById('produto').value,
      quantidade: document.getElementById('quantidade').value,
      preco: document.getElementById('preco').value
    }];

    document.querySelectorAll('.produto-container').forEach(container => {
      produtos.push({
        nome: container.querySelector('.produto-select').value,
        quantidade: container.querySelector('.quantidade-select').value,
        preco: container.querySelector('.preco-input').value
      });
    });

    const formaPagamento = document.getElementById('pagamento').value;
    const dataPedido = new Date().toISOString();
    const total = produtos.reduce((sum, p) => sum + (parseFloat(p.preco) * parseInt(p.quantidade)), 0);

    const novoPedido = {
      numero: pedidoCounter + 1,
      produtos,
      data: dataPedido,
      formaPagamento,
      total: total.toFixed(2)
    };

    pedidosRef.push(novoPedido)
      .then(() => {
        alert('Pedido cadastrado com sucesso!');
        document.getElementById('pedidoForm').reset();
        document.getElementById('produtosAdicionados').innerHTML = '';
        produtoCounter = 1;
        pedidoCounter++;
        carregarPedidos();
      })
      .catch(error => {
        console.error('Erro ao salvar pedido:', error);
        alert('Erro ao cadastrar pedido. Por favor, tente novamente.');
      });
  });

  function carregarPedidos() {
    const tabelaPedidos = document.getElementById('tabelaPedidos');
    tabelaPedidos.innerHTML = '';

    pedidosRef.orderByChild('data').once('value', snapshot => {
      if (!snapshot.exists()) {
        tabelaPedidos.innerHTML = '<tr><td colspan="5">Nenhum pedido encontrado</td></tr>';
        return;
      }

      snapshot.forEach(childSnapshot => {
        const pedido = childSnapshot.val();
        const dataFormatada = new Date(pedido.data).toLocaleString('pt-BR');
        const produtosStr = pedido.produtos.map(p =>
          `${p.quantidade}x ${p.nome} (R$ ${parseFloat(p.preco).toFixed(2)})`
        ).join(', ');

        const linha = document.createElement('tr');
        linha.innerHTML = `
          <td>${pedido.numero}</td>
          <td>${produtosStr}</td>
          <td>${dataFormatada}</td>
          <td>${pedido.formaPagamento}</td>
          <td>R$ ${pedido.total}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="apagarPedido('${childSnapshot.key}')">Excluir</button>
          </td>
        `;
        tabelaPedidos.appendChild(linha);
      });
    });
  }


  carregarPedidos();
});
function apagarPedido(id) {
  if (confirm("Tem certeza que deseja excluir este pedido?")) {
    pedidosRef.child(id).remove()
      .then(() => {
        alert("Pedido excluído com sucesso!");
        // Recarrega os pedidos atualizados
        document.getElementById('tabelaPedidos').innerHTML = '';
        pedidosRef.once('value', snapshot => {
          document.querySelectorAll('tbody tr').forEach(e => e.remove());
          document.addEventListener('DOMContentLoaded', () => carregarPedidos());
        });
        location.reload(); // mais simples
      })
      .catch(error => {
        console.error("Erro ao excluir pedido:", error);
        alert("Erro ao excluir o pedido.");
      });
  }
}

