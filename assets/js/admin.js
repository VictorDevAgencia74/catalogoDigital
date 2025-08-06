document.addEventListener("DOMContentLoaded", async () => {
    const supabaseUrl = "https://llonxwrjeipjxpdjijvd.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsb254d3JqZWlwanhwZGppanZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NTI3NDEsImV4cCI6MjA0OTQyODc0MX0.k6iVRq6qoc6D8eetY7N80oWysfttvRBQ5xceiKonEJA";
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    try {
        console.log("Verificando sessão ativa...");
        const { data: session, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.session) {
            console.warn("Nenhuma sessão ativa encontrada. Redirecionando para login...");
            window.location.href = "login.html";
            return;
        }

        console.log("Sessão ativa encontrada.");

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.error("Erro ao obter usuário autenticado:", userError.message);
            throw userError;
        }

        if (!user) {
            console.warn("Nenhum usuário autenticado encontrado. Redirecionando para login...");
            window.location.href = "login.html";
            return;
        }

        console.log("Autenticação verificada com sucesso.");
        
//-------------------------------- FUNÇÃO PARA CATEGORIAS---------------------------------------//
    // Função para carregar categorias e atualizar a tabela
        async function carregarCategorias() {
            try {
                const { data: categorias, error } = await supabase
                    .from('categorias')
                    .select('*'); // Busca todas as categorias do banco

                if (error) {
                    console.error('Erro ao carregar categorias:', error.message);
                    return;
                }

                // Limpa a tabela atual
                const tabela = document.getElementById("categoriasTabela");
                tabela.innerHTML = ""; // Remove todas as linhas existentes

                // Adiciona cada categoria à tabela
                categorias.forEach(categoria => {
                    const novaLinha = document.createElement("tr");
                    novaLinha.innerHTML = `
                        <td>${categoria.nome_categoria}</td>
                        <td>
                            <button class="btn btn-danger btn-sm">Excluir</button>
                        </td>
                    `;

                    // Adiciona o evento de clique ao botão
                    const btnExcluir = novaLinha.querySelector("button");
                    btnExcluir.addEventListener("click", () => excluirCategoria(categoria.id));

                    tabela.appendChild(novaLinha);
                });
            } catch (error) {
                console.error('Erro inesperado ao carregar categorias:', error);
            }
        }

        // Função para adicionar nova categoria
        async function adicionarCategoria(e) {
            e.preventDefault(); // Evita o comportamento padrão do formulário

            const inputCategoria = document.getElementById("addListCategoria");
            const nomeCategoria = inputCategoria.value.trim();

            if (nomeCategoria) {
                try {
                    const { error } = await supabase
                        .from('categorias')
                        .insert([{ nome_categoria: nomeCategoria }]); // Insere a nova categoria no banco

                    if (error) {
                        console.error('Erro ao adicionar categoria:', error.message);
                        alert('Erro ao adicionar categoria.');
                    } else {
                        alert('Categoria adicionada com sucesso!');
                        carregarCategorias(); // Atualiza a tabela
                        inputCategoria.value = ""; // Limpa o campo de entrada
                    }
                } catch (error) {
                    console.error('Erro inesperado ao adicionar categoria:', error);
                    alert('Ocorreu um erro inesperado.');
                }
            } else {
                alert("Por favor, insira uma categoria válida.");
            }
        }

        // Função para excluir categoria
        async function excluirCategoria(id) {
            if (!confirm("Tem certeza de que deseja excluir esta categoria?")) {
                return; // Confirmação para exclusão
            }

            try {
                const { error } = await supabase
                    .from('categorias')
                    .delete()
                    .eq('id', id); // Exclui a categoria com o ID correspondente

                if (error) {
                    console.error('Erro ao excluir categoria:', error.message);
                    alert('Erro ao excluir categoria.');
                } else {
                    alert('Categoria excluída com sucesso!');
                    carregarCategorias(); // Atualiza a tabela após excluir
                }
            } catch (error) {
                console.error('Erro inesperado ao excluir categoria:', error);
                alert('Ocorreu um erro inesperado.');
            }
        }

        // Event listener para o formulário de adicionar categoria
        document.getElementById("addFormCategoria").addEventListener("submit", adicionarCategoria);

        // Carrega as categorias ao iniciar
        carregarCategorias();
//--------------------------------- FUNÇÃO PARA PRODUTOS----------------------------------------//
        /**
         * Função para buscar todas as categorias disponíveis.
         * Retorna uma lista de categorias.
         */
        async function buscarCategorias() {
            const { data: categorias, error } = await supabase
                .from("categorias")
                .select("id, nome_categoria");

            if (error) {
                console.error("Erro ao buscar categorias:", error.message);
                return [];
            }

            return categorias;
        }

        /**
         * Função para preencher o select de categorias no modal de adição.
         */
        async function preencherCategorias() {
            const categorias = await buscarCategorias();
            const selectCategoria = document.getElementById("addCategoria");
            selectCategoria.innerHTML = ""; // Limpa o select antes de adicionar as opções

            categorias.forEach((categoria) => {
                const option = document.createElement("option");
                option.value = categoria.id;
                option.textContent = categoria.nome_categoria;
                selectCategoria.appendChild(option);
            });
        }

        // Chama a função para preencher categorias ao carregar a página
        preencherCategorias();

        /**
         * Função para buscar produtos e suas categorias.
         * Realiza um join entre produtos e categorias para exibir o nome da categoria.
         * @param {string|null} codigoProduto - Código do produto (opcional).
         */
        async function buscarProdutos(codigoProduto = null) {
            let query = supabase
                .from("produtos")
                .select(`id, descricao_prod, cod_produto, preco_unid, preco_fardo, preco_fardo_avista, preco_unid_avista, ordem, categoria_id, categorias(nome_categoria), url_img`);

            if (codigoProduto) {
                query = query.eq("cod_produto", codigoProduto);
            } else {
                query = query.order("ordem");
            }

            const { data: produtos, error } = await query;

            if (error) {
                console.error("Erro ao buscar produtos:", error.message);
                return;
            }

            const tabelaBody = document.getElementById("produtosTabela");

            if (produtos.length === 0) {
                tabelaBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum produto encontrado.</td></tr>';
                return;
            }

            tabelaBody.innerHTML = "";

            produtos.forEach((produto) => {
                const linha = document.createElement("tr");
                linha.setAttribute('data-id', produto.id); // Adiciona o ID como atributo
                linha.setAttribute('data-ordem', produto.ordem); // Adiciona a ordem atual
                linha.innerHTML = `
                    <td><img id="img_table_modal" src="${produto.url_img}" alt="${produto.descricao_prod}"/></td>
                    <td>${produto.descricao_prod}</td>
                    <td>${produto.cod_produto}</td>
                    <td class="text-center">${produto.categorias?.nome_categoria || "Sem categoria"}</td>
                    <td class="text-center">${produto.preco_unid}</td>
                    <td class="text-center">${produto.preco_fardo}</td>
                    <td class="text-center">${produto.preco_fardo_avista}</td>
                    <td class="text-center">${produto.preco_unid_avista}</td>
                    <td class="text-center">${produto.ordem}</td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn btn-outline-warning btn-sm" data-bs-toggle="modal" data-bs-target="#editModal" onclick="editarProduto(${produto.id})">📝</button>
                            <button class="btn btn-outline-danger btn-sm" onclick="excluirProduto(${produto.id})">🗑️</button>
                        </div>
                    </td>
                `;
                tabelaBody.appendChild(linha);
            });

            // Inicializa o SortableJS após criar a tabela
            if (!codigoProduto) { // Só habilita drag and drop se não estiver filtrando
                inicializarSortable();
            }
        }

        function inicializarSortable() {
            const tabelaBody = document.getElementById("produtosTabela");
            
            new Sortable(tabelaBody, {
                animation: 150,
                handle: 'td', // Permite arrastar por qualquer célula
                ghostClass: 'sortable-ghost', // Classe para o elemento fantasma
                chosenClass: 'sortable-chosen', // Classe para o elemento selecionado
                dragClass: 'sortable-drag', // Classe durante o arrasto
                
                onEnd: async function(evt) {
                    // Obtém todos os itens na nova ordem
                    const linhas = tabelaBody.querySelectorAll('tr[data-id]');
                    const updates = [];
                    
                    // Prepara as atualizações para cada item
                    linhas.forEach((linha, index) => {
                        const id = linha.getAttribute('data-id');
                        const novaOrdem = index + 1; // +1 para começar de 1
                        
                        updates.push({
                            id: parseInt(id, 10),
                            ordem: novaOrdem
                        });
                        
                        // Atualiza o atributo e a célula de ordem
                        linha.setAttribute('data-ordem', novaOrdem);
                        linha.querySelector('td:nth-child(9)').textContent = novaOrdem;
                    });
                    
                    // Atualiza todas as ordens no banco de dados
                    try {
                        const { error } = await supabase
                            .from('produtos')
                            .upsert(updates); // Usa upsert para atualizar múltiplos registros
                        
                        if (error) {
                            console.error('Erro ao atualizar ordens:', error);
                            // Reverte visualmente se houver erro
                            buscarProdutos();
                        } else {
                            console.log('Ordens atualizadas com sucesso!');
                        }
                    } catch (err) {
                        console.error('Erro ao atualizar ordens:', err);
                        buscarProdutos(); // Recarrega se houver erro
                    }
                }
            });
        }

        // Função para abrir o modal e preencher os campos para editar um produto.
        window.editarProduto = async (id) => {
          // Captura o id do produto e armazena na variável global `idProduto`
          window.idProduto = id;

          const { data: produto, error } = await supabase
            .from("produtos")
            .select("id, descricao_prod, cod_produto, preco_unid, preco_fardo, preco_fardo_avista, preco_unid_avista, ordem, categoria_id, desc_disponivel")
            .eq("id", id)
            .single();

          if (error || !produto) {
            console.error("Erro ao buscar produto para edição:", error?.message);
            return;
          }

          // Preenche os campos do modal
          document.getElementById("editDescricao").value = produto.descricao_prod;
          document.getElementById("editCodigo").value = produto.cod_produto;
          document.getElementById("editPrecoUnidPrazo").value = produto.preco_unid;
          document.getElementById("editPrecoFardoPrazo").value = produto.preco_fardo;
          document.getElementById("editPrecoFardoAvista").value = produto.preco_fardo_avista;
          document.getElementById("editPrecoUnidAvista").value = produto.preco_unid_avista;
          document.getElementById("editOrdem").value = produto.ordem;
          document.getElementById("editDescDisponivel").value = produto.desc_disponivel;

          // Preenche o select de categorias
          const selectCategoria = document.getElementById("editCategoria");
          selectCategoria.innerHTML = ""; // Limpa o select antes de adicionar as opções

          const categorias = await buscarCategorias();
          categorias.forEach((categoria) => {
            const option = document.createElement("option");
            option.value = categoria.id;
            option.textContent = categoria.nome_categoria;

            if (categoria.id === produto.categoria_id) {
              option.selected = true; // Seleciona a categoria atual do produto
            }

            selectCategoria.appendChild(option);
          });

          // Configura o formulário para salvar alterações
          const form = document.getElementById("editForm");
          form.onsubmit = async (e) => {
            e.preventDefault();

            const descricao = document.getElementById("editDescricao").value.trim();
            const codigo = document.getElementById("editCodigo").value.trim();
            const PrecoUnidPrazo = parseFloat(document.getElementById("editPrecoUnidPrazo").value);
            const PrecoFardoPrazo = parseFloat(document.getElementById("editPrecoFardoPrazo").value);
            const PrecoFardoAvista = parseFloat(document.getElementById("editPrecoFardoAvista").value);
            const PrecoUnidAvista = parseFloat(document.getElementById("editPrecoUnidAvista").value);
            const ordem = parseFloat(document.getElementById("editOrdem").value);
            const categoriaId = parseInt(selectCategoria.value, 10);
            const DescDisponivel = document.getElementById("editDescDisponivel").value.trim();

            const { error: updateError } = await supabase
              .from("produtos")
              .update({ descricao_prod: descricao, cod_produto: codigo, preco_unid: PrecoUnidPrazo, preco_fardo: PrecoFardoPrazo, preco_fardo_avista: PrecoFardoAvista, preco_unid_avista: PrecoUnidAvista, desc_disponivel: DescDisponivel, ordem: ordem, categoria_id: categoriaId })
              .eq("id", id);

            if (updateError) {
              console.error("Erro ao atualizar produto:", updateError.message);
            } else {
              alert("Produto atualizado com sucesso!");
              const modal = bootstrap.Modal.getInstance(document.getElementById("editModal"));
              modal.hide();
              await buscarProdutos();
            }
          };
        };
        /**
         * Função para adicionar produto.
         */
        document.getElementById("addFormAdd").addEventListener("submit", async (event) => {
            event.preventDefault();

            const descricao = document.getElementById("addDescricao").value.trim();
            const codigo = document.getElementById("addCodigo").value.trim();
            const precoUnidPrazo = parseFloat(document.getElementById("addPrecoUnidPrazo").value);
            const precoFardoPrazo = parseFloat(document.getElementById("addPrecoFardoPrazo").value);
            const precoUnidAvista = parseFloat(document.getElementById("addPrecoUnidAvista").value);
            const precoFardoAvista = parseFloat(document.getElementById("addPrecoFardoAvista").value);
            const ordem = parseFloat(document.getElementById("addOrdem").value);
            const categoriaId = parseInt(document.getElementById("addCategoria").value, 10);
            const DescDisponivel = document.getElementById("addDescDisponivel").value.trim();

            if (!descricao || !codigo || isNaN(categoriaId)) {
                alert("Por favor, preencha todos os campos obrigatórios.");
                return;
            }

            try {
                const { error } = await supabase
                    .from("produtos")
                    .insert([{
                        descricao_prod: descricao,
                        cod_produto: codigo,
                        preco_unid: precoUnidPrazo,
                        preco_fardo: precoFardoPrazo,
                        preco_unid_avista: precoUnidAvista,
                        preco_fardo_avista: precoFardoAvista,
                        ordem: ordem,
                        categoria_id: categoriaId,
                        desc_disponivel: DescDisponivel
                    }]);

                if (error) {
                    console.error("Erro ao adicionar produto:", error.message);
                    alert("Erro ao adicionar produto.");
                    return;
                }

                alert("Produto adicionado com sucesso!");
                document.getElementById("addFormAdd").reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById("addModal"));
                modal.hide();
                await buscarProdutos(); // Atualiza a tabela de produtos
            } catch (err) {
                console.error("Erro inesperado ao adicionar produto:", err.message);
                alert("Erro inesperado ao adicionar produto.");
            }
        });

        /**
         * Função para excluir um produto.
         */
        window.excluirProduto = async (id) => {
            const confirmacao = confirm("Tem certeza de que deseja excluir este produto?");
            if (!confirmacao) {
                return;
            }

            const { error } = await supabase
                .from("produtos")
                .delete()
                .eq("id", id);

            if (error) {
                console.error("Erro ao excluir produto:", error.message);
                alert("Ocorreu um erro ao excluir o produto. Por favor, tente novamente.");
            } else {
                alert("Produto excluído com sucesso!");
                await buscarProdutos();
            }
        };

        const buscarProdutoLink = document.getElementById("buscarProdutoLink");
        buscarProdutoLink.addEventListener("click", (e) => {
            const codigoProduto = document.getElementById("codigoProdutoInput").value.trim();

            if (codigoProduto) {
                e.preventDefault();
                buscarProdutos(codigoProduto);
            } else {
                console.log("Campo vazio: página será recarregada.");
                return;
            }
        });
        
        // FUNÇÃO PARA UPLOAD E SALVAR IMAGEM NO BD
        // Defina a URL base do seu Supabase
        const urlBase = "https://llonxwrjeipjxpdjijvd.supabase.co/storage/v1/object/public/";

        // Função para capturar dinamicamente o ID do produto
        function obterIdProduto() {
          // Aqui você deve capturar o ID do produto dinamicamente, seja de um formulário ou da edição do produto
          // Por exemplo, se o ID é passado para o script através de uma variável global ou evento:
          const idProduto = window.idProduto || 1; // Substitua conforme o contexto de onde o ID do produto vem
          return idProduto;
        }

        // Função para upload de imagem
        const inputElement = document.getElementById("fileInput");
        const statusElement = document.getElementById("status");
        const progressBar = document.getElementById("uploadProgress");
        const progressContainer = document.getElementById("progressContainer");

        // Função para salvar o caminho no banco de dados
        async function salvarCaminhoNoBanco(idProduto, caminhoImagem) {
          const { error } = await supabase
            .from("produtos") // Nome da tabela
            .update({ url_img: caminhoImagem }) // Atualiza a coluna url_img
            .eq("id", idProduto); // Seleciona o produto pelo ID

          if (error) {
            console.error("Erro ao salvar caminho no banco de dados:", error.message);
            alert("Erro ao salvar a URL da imagem no banco de dados.");
            return false;
          }

          console.log("Caminho da imagem salvo no banco de dados com sucesso.");
          return true;
        }

        // Função para upload com progresso
        async function uploadImageWithProgress(file) {
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const bucket = "assets"; // Nome do bucket no Supabase
            const filePath = `image/${file.name}`; // Caminho da imagem no bucket

            const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

            xhr.open("POST", uploadUrl);
            xhr.setRequestHeader("Authorization", `Bearer ${supabaseKey}`); // Cabeçalho de autenticação

            // Atualiza a barra de progresso
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                progressBar.value = percentComplete;

                if (percentComplete === 100) {
                  progressContainer.style.display = "none"; // Esconde a barra ao completar
                }
              }
            };

            // Ao finalizar o upload
            xhr.onload = () => {
              if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                const caminhoImagem = response.Key; // Caminho do arquivo no bucket

                // Construir a URL pública completa com a URL base
                const urlPublica = `${urlBase}${caminhoImagem}`;

                resolve(urlPublica); // Retorna a URL pública completa
              } else {
                reject(new Error(`Erro no upload: ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error("Erro de rede ao fazer upload."));
            progressContainer.style.display = "block"; // Mostra a barra de progresso
            xhr.send(file); // Envia o arquivo
          });
        }

        // Evento de mudança no input file
        inputElement.addEventListener("change", async (event) => {
          const file = event.target.files[0];
          const idProduto = obterIdProduto(); // Agora a função é corretamente definida antes de ser chamada

          // Validações
          if (!file.type.startsWith("image/")) {
            alert("Por favor, selecione um arquivo de imagem.");
            return;
          }
          if (file.size > 5 * 1024 * 1024) { // Limite de 5 MB
            alert("O arquivo deve ter no máximo 5 MB.");
            return;
          }

          try {
            statusElement.textContent = "Carregando...";
            const caminhoImagem = await uploadImageWithProgress(file);

            const sucesso = await salvarCaminhoNoBanco(idProduto, caminhoImagem);

            if (sucesso) {
              statusElement.textContent = `Upload concluído e salvo no banco.`;
            }
          } catch (error) {
            console.error("Erro durante o upload:", error.message || error);
            statusElement.textContent = "Erro ao fazer upload.";
          }
        });

        buscarProdutos();

    } catch (err) {
        console.error("Erro ao verificar autenticação:", err.message || err);
        alert("Ocorreu um erro ao verificar a autenticação. Por favor, tente novamente.");
        window.location.href = "login.html";
    }

    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                alert("Erro ao sair: " + error.message);
            } else {
                alert("Você saiu com sucesso!");
                window.location.href = "login.html";
            }
        });
    }
});