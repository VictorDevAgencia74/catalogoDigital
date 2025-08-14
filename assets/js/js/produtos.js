// Configuração do Supabase
const supabaseUrl = 'https://llonxwrjeipjxpdjijvd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsb254d3JqZWlwanhwZGppanZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NTI3NDEsImV4cCI6MjA0OTQyODc0MX0.k6iVRq6qoc6D8eetY7N80oWysfttvRBQ5xceiKonEJA';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// Cache de categorias
let categoriasCache = {};

// Função para buscar todas as categorias
async function buscarCategorias() {
    try {
        const { data, error } = await supabaseClient
            .from('categorias')
            .select('id, nome_categoria')  // Usando o nome correto da coluna
            .order('id', { ascending: true });

        if (error) throw error;

        // Transforma o array de categorias em um objeto {id: nome}
        categoriasCache = data.reduce((acc, categoria) => {
            acc[categoria.id] = categoria.nome_categoria;  // Usando nome_categoria
            return acc;
        }, {});

        return categoriasCache;
    } catch (error) {
        console.error('Erro ao buscar categorias:', error.message);
        return {};
    }
}

// Função para formatar preços
const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
    }).format(valor);
};

// Função principal para buscar e exibir produtos
async function buscarProdutos(categoriaId = null) {
    try {
        // Primeiro busca as categorias se não estiverem em cache
        if (Object.keys(categoriasCache).length === 0) {
            await buscarCategorias();
        }

        // Consulta para produtos
        let query = supabaseClient
            .from('produtos')
            .select('id, descricao_prod, cod_produto, preco_unid, preco_fardo, preco_unid_avista, preco_fardo_avista, url_img, categoria_id')
            .order('ordem', { ascending: true });

        // Aplica filtro se necessário
        if (categoriaId) {
            query = query.eq('categoria_id', categoriaId);
        } else {
            query = query.order('categoria_id', { ascending: true });
        }

        const { data: produtos, error } = await query;
        if (error) throw error;

        const container = document.getElementById('produtos');
        container.innerHTML = '';

        if (!produtos || produtos.length === 0) {
            container.innerHTML = `<p class="text-center">Nenhum produto encontrado.</p>`;
            return;
        }

        // Se estiver filtrado por categoria
        if (categoriaId) {
            const categoriaNome = categoriasCache[categoriaId] || 'Produtos';
            container.innerHTML += `<h3 class="text-dark my-3"><strong>${categoriaNome}</strong></h3>`;

            const produtosRow = document.createElement('div');
            produtosRow.className = 'row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3';
            container.appendChild(produtosRow);

            produtos.forEach(produto => {
                produtosRow.innerHTML += criarCardProduto(produto);
            });
        }
        // Se não estiver filtrado (mostrar todos agrupados por categoria)
        else {
            const produtosAgrupados = agruparProdutosPorCategoria(produtos);

            for (const [categoriaId, produtos] of Object.entries(produtosAgrupados)) {
                const categoriaNome = categoriasCache[categoriaId] || 'Outros';
                container.innerHTML += `<h2 class="text-dark mt-4 mb-2"><strong>${categoriaNome}</strong></h2>`;

                const produtosRow = document.createElement('div');
                produtosRow.className = 'row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3';
                container.appendChild(produtosRow);

                produtos.forEach(produto => {
                    produtosRow.innerHTML += criarCardProduto(produto);
                });
            }
        }

    } catch (error) {
        console.error('Erro ao buscar produtos:', error.message);
    }
}

// Funções auxiliares
function agruparProdutosPorCategoria(produtos) {
    return produtos.reduce((acc, produto) => {
        const categoriaId = produto.categoria_id;
        if (!acc[categoriaId]) {
            acc[categoriaId] = [];
        }
        acc[categoriaId].push(produto);
        return acc;
    }, {});
}

function criarCardProduto(produto) {
    return `
        <div class="col produto-slide-in">
            <div class="card h-100 rounded-4 shadow-sm border-0">
                <div class="card-header text-center bg-light rounded-top-4 p-2">
                    <h6 class="card-title text-primary mb-1">${produto.descricao_prod}</h6>
                    <small class="text-muted">Código: ${produto.cod_produto}</small>
                </div>
                <div class="card-body d-flex flex-column p-3">
                    <div class="text-center mb-2 flex-grow-1 d-flex align-items-center justify-content-center">
                        <img src="${produto.url_img}" alt="${produto.descricao_prod}" 
                            class="img-fluid rounded-3" style="height: 100px; object-fit: cover;">
                    </div>
                    <button class="btn btn-sm btn-outline-primary mt-auto" 
                        data-bs-toggle="modal"
                        data-bs-target="#modalDetalhes" 
                        data-produto-id="${produto.id}">
                        Detalhes
                    </button>
                </div>
            </div>
        </div>`;
}

// Função para buscar detalhes do produto
async function buscarDetalhesProduto(produtoId) {
    try {
        const { data, error } = await supabaseClient
            .from('produtos')
            .select('*')
            .eq('id', produtoId)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Erro ao buscar detalhes do produto:', error.message);
        return null;
    }
}

// Evento para carregar detalhes no modal
document.addEventListener('click', async (e) => {
    if (e.target.matches('[data-bs-target="#modalDetalhes"]')) {
        e.preventDefault();
        const produtoId = e.target.getAttribute('data-produto-id');
        const produto = await buscarDetalhesProduto(produtoId);

        if (produto) {
            const precoUnidAvista = formatarPreco(produto.preco_unid_avista || 0);
            const precoFardoAvista = formatarPreco(produto.preco_fardo_avista || 0);
            const precoUnid = formatarPreco(produto.preco_unid || 0);
            const precoFardo = formatarPreco(produto.preco_fardo || 0);
            const categoriaNome = categoriasCache[produto.categoria_id] || 'Sem Categoria';

            const modalBody = document.getElementById('modalDetalhesBody');
            modalBody.innerHTML = `
                <div class="row">
                    <div class="col-md-5 text-center">
                        <img src="${produto.url_img}" alt="${produto.descricao_prod}" 
                            class="img-fluid rounded-3 mb-3" style="max-height: 200px;">
                    </div>
                    <div class="col-md-7">
                        <h5>${produto.descricao_prod}</h5>
                        <p><small class="text-muted">Código: ${produto.cod_produto}</small></p>
                        <p><small class="text-muted">Categoria: ${categoriaNome}</small></p>
                        
                        <div class="mb-3">
                            <h6 class="text-primary">Preços</h6>
                            <div class="row">
                                <div class="col-6">
                                    <p class="mb-1"><strong>À Vista:</strong></p>
                                    <p class="mb-1">Unidade: <strong>R$ ${precoUnidAvista}</strong></p>
                                    <p class="mb-1">Fardo: <strong>R$ ${precoFardoAvista}</strong></p>
                                </div>
                                <div class="col-6">
                                    <p class="mb-1"><strong>À Prazo:</strong></p>
                                    <p class="mb-1">Unidade: <strong>R$ ${precoUnid}</strong></p>
                                    <p class="mb-1">Fardo: <strong>R$ ${precoFardo}</strong></p>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h6 class="text-primary">Sabores/Disponibilidade</h6>
                            <p>${produto.desc_disponivel || 'Nenhuma informação adicional disponível.'}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
});

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

// Carrega todos os dados ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
    await buscarCategorias();
    await buscarProdutos();
});