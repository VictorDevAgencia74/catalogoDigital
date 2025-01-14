// Configuração do Supabase
const supabaseUrl = 'https://llonxwrjeipjxpdjijvd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsb254d3JqZWlwanhwZGppanZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NTI3NDEsImV4cCI6MjA0OTQyODc0MX0.k6iVRq6qoc6D8eetY7N80oWysfttvRBQ5xceiKonEJA';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// Função para formatar preços
const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
    }).format(valor);
};

// Função para buscar e exibir produtos com filtro opcional
async function buscarProdutos(categoriaId = null) {
    try {
        let query = supabaseClient
            .from('produtos')
            .select('id, descricao_prod, cod_produto, preco_unid, preco_fardo, preco_unid_avista, preco_fardo_avista, url_img')
            .order('ordem'); // Adiciona ordenação pela coluna "ordem"

        // Filtrar por categoria, se o ID da categoria for fornecido
        if (categoriaId) {
            query = query.eq('categoria_id', categoriaId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar produtos:', error.message);
            return;
        }

        const container = document.getElementById('produtos');
        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = `<p class="text-center">Nenhum produto encontrado para esta categoria.</p>`;
            return;
        }

        data.forEach((produto) => {
            const precoUnidAvista = formatarPreco(produto.preco_unid_avista || 0);
            const precoFardoAvista = formatarPreco(produto.preco_fardo_avista || 0);
            const precoUnid = formatarPreco(produto.preco_unid || 0);
            const precoFardo = formatarPreco(produto.preco_fardo || 0);

            const produtoHTML = `
                <div class="col-md-4 mb-4 produto-slide-in">
                    <div class="card h-100 rounded-4 shadow-lg border-0">
                        <div class="card-header text-center bg-light rounded-top-4">
                            <h6 class="card-title text-primary">${produto.descricao_prod}</h6>
                            <div class="d-flex  justify-content-between">
                                <h7 class="card-title text-primary">Código: ${produto.cod_produto}</h7>
                                <button href="#" class="btn btn-outline-secondary" data-bs-toggle="modal"
                                data-bs-target="#modalSabores" 
                                data-produto-id="${produto.id}">
                                    Mais Aqui
                                </button>
                            </div>
                        </div>
                        <div class="card-body d-flex">
                            <div class="col-5 text-center d-flex align-items-center justify-content-center">
                                <img src="${produto.url_img}" alt="${produto.descricao_prod}" 
                                    class="img-fluid rounded-3" style="height: 150px; object-fit: cover;">
                            </div>
                            <div class="col-7">
                                <div>
                                    <p class="text-muted mb-2 bg-danger rounded-5 ms-4"><strong>Valor a Vista:</strong></p>
                                    <p class="text-muted mb-2 ms-4">Unidade: &nbsp &nbsp  <strong>R$ ${precoUnidAvista}</strong></p>
                                    <p class="text-muted mb-2 ms-4">Fardo:&nbsp &nbsp &nbsp &nbsp &nbsp <strong>R$ ${precoFardoAvista}</strong></p>
                                </div>
                                <div>
                                    <p class="text-muted mb-2 bg-danger rounded-2 ms-4"><strong>Valor a Prazo:</strong></p>
                                    <p class="text-muted mb-2 ms-4">Unidade: &nbsp &nbsp  <strong>R$ ${precoUnid}</strong></p>
                                    <p class="text-muted mb-2 ms-4">Fardo:&nbsp &nbsp &nbsp &nbsp &nbsp <strong>R$ ${precoFardo}</strong></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            
            container.innerHTML += produtoHTML;
        });
    } catch (erro) {
        console.error('Erro inesperado:', erro);
    }
}

// Evento para carregar sabores no modal
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-bs-target="#modalSabores"]')) {
        e.preventDefault();
        const produtoId = e.target.getAttribute('data-produto-id');
        buscarSabores(produtoId);
    }
});

// Função para buscar sabores
async function buscarSabores(produtoId) {
    try {
        const { data, error } = await supabaseClient
            .from('produtos')
            .select('desc_disponivel')
            .eq('id', produtoId);

        if (error) {
            console.error('Erro ao buscar sabores:', error.message);
            return;
        }

        const listaSabores = document.getElementById('listaSabores');
        listaSabores.innerHTML = ''; 

        if (data.length === 0 || !data[0].desc_disponivel) {
            listaSabores.innerHTML = '<li class="list-group-item">Nenhum sabor disponível.</li>';
            return;
        }

        // Exibir o conteúdo de desc_disponivel
        listaSabores.innerHTML = `<li class="list-group-item">${data[0].desc_disponivel}</li>`;
    } catch (erro) {
        console.error('Erro inesperado:', erro);
    }
}

// Adiciona evento de clique para categorias
document.querySelectorAll('#categorias a').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const categoriaId = parseInt(e.target.getAttribute('data-id'), 10);
        if (!isNaN(categoriaId)) {
            buscarProdutos(categoriaId);
        }
    });
}); 

// Carrega todos os produtos automaticamente ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    buscarProdutos(); // Chama a função sem parâmetro para buscar todos os produtos
});