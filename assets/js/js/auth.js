document.addEventListener("DOMContentLoaded", () => {
    const supabaseUrl = "https://llonxwrjeipjxpdjijvd.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsb254d3JqZWlwanhwZGppanZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NTI3NDEsImV4cCI6MjA0OTQyODc0MX0.k6iVRq6qoc6D8eetY7N80oWysfttvRBQ5xceiKonEJA";

    if (!window.supabase) {
        console.error("O Supabase não está definido. Verifique se o script '@supabase/supabase-js' foi carregado.");
        return;
    }

    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // Obtém o formulário de login
    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        console.error("Elemento #loginForm não encontrado. Certifique-se de que ele exista no HTML.");
        return;
    }

    // Adiciona o evento de submit ao formulário
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw new Error(error.message);

            alert("Login bem-sucedido!");
            window.location.href = "admin.html"; // Redireciona para o admin após login bem-sucedido
        } catch (err) {
            alert("Erro ao fazer login: " + err.message);
        }
    });
});