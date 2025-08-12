// Adicionar evento para atualizar a página ao fechar o modal de adição
const addModal = document.getElementById("addModalCategoria");
if (addModal) {
    addModal.addEventListener("hidden.bs.modal", () => {
        location.reload(); // Recarrega a página ao fechar o modal
    });
}