/**
 * Função para limpar os campos de endereço preenchidos pela API
 */
function limparCamposEndereco() {
    // Define os campos para 'readonly' enquanto estiverem vazios para que o usuário saiba que serão preenchidos
    const campos = ['endereco', 'bairro', 'cidade'];

    campos.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = "";
            input.readOnly = false; // Permite edição se a busca falhar ou o CEP for limpo
        }
    });

    const estadoSelect = document.getElementById('estado');
    if (estadoSelect) {
        estadoSelect.value = ""; // Limpa a seleção do estado
        estadoSelect.disabled = false; // Permite a seleção se a busca falhar
    }

    const inputComplemento = document.getElementById('complemento');
    if (inputComplemento) {
        inputComplemento.value = ""; // Opcional: limpa o complemento
    }
}

/**
 * Função principal para buscar o CEP e preencher os campos
 */
function buscarCep(valorCep) {
    // 1. Limpeza e Validação
    const cep = valorCep.replace(/\D/g, ''); // Remove todos os caracteres não numéricos

    if (cep.length !== 8) {
        limparCamposEndereco();
        return;
    }

    // URL da Brasil API V2
    const url = `https://brasilapi.com.br/api/cep/v2/${cep}`;

    // 2. Limpa os campos e prepara para a requisição
    limparCamposEndereco();
    const enderecoInput = document.getElementById('endereco');
    if (enderecoInput) enderecoInput.value = "Buscando...";

    // 3. Faz a requisição usando Fetch
    fetch(url)
        .then(response => {
            // Verifica se a resposta foi bem-sucedida (status 200)
            if (!response.ok) {
                // Se o status não for 200, transforma em erro para cair no .catch
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
                });
            }
            return response.json(); // Converte a resposta para JSON
        })
        .then(dados => {
            if (dados.cep) {
                // 4. Preenche os campos com os dados da Brasil API
                document.getElementById('endereco').value = dados.street || '';
                document.getElementById('bairro').value = dados.neighborhood || '';
                document.getElementById('cidade').value = dados.city || '';

                // Preenche o campo de seleção (select) do Estado
                const estadoSelect = document.getElementById('estado');
                if (estadoSelect) {
                    estadoSelect.value = dados.state || '';
                    estadoSelect.disabled = true; // Impede a alteração manual após preenchimento
                }

                // 5. Bloqueia os campos preenchidos e foca no próximo
                const camposBloquear = ['endereco', 'bairro', 'cidade'];
                camposBloquear.forEach(id => {
                    const input = document.getElementById(id);
                    if (input) {
                        input.readOnly = true;
                    }
                });

                // Coloca o foco no campo Número para o usuário continuar
                document.getElementById('numero').focus();

            } else {
                // Se a API não encontrar, mas não retornar um erro HTTP (caso raro)
                limparCamposEndereco();
                alert("CEP não encontrado. Por favor, preencha o endereço manualmente.");
            }
        })
        .catch(error => {
            // 6. Tratamento de Erro
            console.error('Erro na busca de CEP:', error.message);
            limparCamposEndereco();

            // Reabilita os campos para preenchimento manual
            const camposReabilitar = ['endereco', 'bairro', 'cidade'];
            camposReabilitar.forEach(id => {
                const input = document.getElementById(id);
                if (input) input.readOnly = false;
            });
            const estadoSelect = document.getElementById('estado');
            if (estadoSelect) estadoSelect.disabled = false;

            alert("Erro na consulta de CEP ou CEP não encontrado. Preencha o endereço manualmente.");
        });
}

// =======================================================
// Funções de VALIDAÇÃO DE CPF
// =======================================================

/**
 * Função auxiliar para dar feedback visual ao usuário (requer CSS)
 */
function exibirFeedbackCpf(input, mensagem, valido) {
    if (valido) {
        input.setCustomValidity("");
        input.title = mensagem;
        input.style.borderColor = 'green';
    } else {
        input.setCustomValidity(mensagem);
        input.title = mensagem;
        input.style.borderColor = 'red';
        input.focus(); // Coloca o foco no campo para o usuário corrigir
    }
}

/**
 * Função principal para validar o CPF no formulário
 * @param {HTMLInputElement} input O elemento input do CPF
 */
function validarCpf(input) {
    const cpf = input.value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos

    // 1. Verifica tamanho
    if (cpf.length !== 11) {
        exibirFeedbackCpf(input, "O CPF deve conter 11 dígitos.", false);
        return;
    }

    // 2. Verifica sequências repetidas (Ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpf)) {
        exibirFeedbackCpf(input, "CPF com números repetidos é inválido.", false);
        return;
    }

    // Função interna para calcular o dígito - Variáveis agora são locais
    const calcularDigito = (limite) => {
        let soma = 0; // <<< CORREÇÃO: Variável 'soma' declarada localmente
        let resto;
        let peso = limite + 1; // 10 para o primeiro dígito, 11 para o segundo

        for (let i = 0; i < limite; i++) {
            soma += parseInt(cpf.charAt(i)) * (peso - i);
        }

        resto = (soma * 10) % 11;

        if (resto == 10 || resto == 11) {
            resto = 0;
        }
        return resto;
    };

    // 3. Validação do 1º Dígito Verificador (i=9)
    let primeiroDigitoCalculado = calcularDigito(9);
    let primeiroDigitoReal = parseInt(cpf.substring(9, 10));

    if (primeiroDigitoCalculado !== primeiroDigitoReal) {
        exibirFeedbackCpf(input, "O CPF digitado é inválido (1º dígito incorreto).", false);
        return;
    }

    // 4. Validação do 2º Dígito Verificador (i=10)
    let segundoDigitoCalculado = calcularDigito(10);
    let segundoDigitoReal = parseInt(cpf.substring(10, 11));

    if (segundoDigitoCalculado !== segundoDigitoReal) {
        exibirFeedbackCpf(input, "O CPF digitado é inválido (2º dígito incorreto).", false);
        return;
    }

    // 5. Se passou por todas as verificações
    exibirFeedbackCpf(input, "CPF válido!", true);
}


// =======================================================
// Funções de BUSCA DE CEP (CÓDIGO ANTERIOR)
// *Adicionado aqui para ter o arquivo completo*
// =======================================================

/**
 * Função para limpar os campos de endereço preenchidos pela API
 */
function limparCamposEndereco() {
    const campos = ['endereco', 'bairro', 'cidade'];

    campos.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = "";
            input.readOnly = false;
        }
    });

    const estadoSelect = document.getElementById('estado');
    if (estadoSelect) {
        estadoSelect.value = "";
        estadoSelect.disabled = false;
    }

    const inputComplemento = document.getElementById('complemento');
    if (inputComplemento) {
        inputComplemento.value = "";
    }
}

/**
 * Função principal para buscar o CEP e preencher os campos
 */
function buscarCep(valorCep) {
    const cep = valorCep.replace(/\D/g, '');

    if (cep.length !== 8) {
        limparCamposEndereco();
        return;
    }

    const url = `https://brasilapi.com.br/api/cep/v2/${cep}`;

    limparCamposEndereco();
    const enderecoInput = document.getElementById('endereco');
    if (enderecoInput) enderecoInput.value = "Buscando...";

    fetch(url)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(dados => {
            if (dados.cep) {
                document.getElementById('endereco').value = dados.street || '';
                document.getElementById('bairro').value = dados.neighborhood || '';
                document.getElementById('cidade').value = dados.city || '';

                const estadoSelect = document.getElementById('estado');
                if (estadoSelect) {
                    estadoSelect.value = dados.state || '';
                    estadoSelect.disabled = true;
                }

                const camposBloquear = ['endereco', 'bairro', 'cidade'];
                camposBloquear.forEach(id => {
                    const input = document.getElementById(id);
                    if (input) {
                        input.readOnly = true;
                    }
                });

                document.getElementById('numero').focus();

            } else {
                limparCamposEndereco();
                alert("CEP não encontrado. Por favor, preencha o endereço manualmente.");
            }
        })
        .catch(error => {
            console.error('Erro na busca de CEP:', error.message);
            limparCamposEndereco();

            const camposReabilitar = ['endereco', 'bairro', 'cidade'];
            camposReabilitar.forEach(id => {
                const input = document.getElementById(id);
                if (input) input.readOnly = false;
            });
            const estadoSelect = document.getElementById('estado');
            if (estadoSelect) estadoSelect.disabled = false;

            alert("Erro na consulta de CEP. Preencha o endereço manualmente.");
        });
}


// =======================================================
// MÁSCARAS (Para formatar CPF enquanto digita)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    // Máscara de CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito

            if (value.length > 3) value = value.substring(0, 3) + '.' + value.substring(3);
            if (value.length > 7) value = value.substring(0, 7) + '.' + value.substring(7);
            if (value.length > 11) value = value.substring(0, 11) + '-' + value.substring(11, 13);

            e.target.value = value.substring(0, 14);
        });
    }
});

const form = document.getElementById("cadLcdr");
form.addEventListener("submit", function (e) {
    e.preventDefault();
    const dadosFormulario = new FormData(form);
    console.log("-----------------------------------------");
    console.log("Dados do Formulário Capturados (usando FormData):");
    dadosFormulario.forEach((valor, chave) => {
        console.log(`[${chave}]: ${valor}`);
    });
    console.log("-----------------------------------------");
    const objetoSimples = Object.fromEntries(dadosFormulario.entries());
    console.log("Objeto JSON para envio (Fácil de ver):", objetoSimples);
});
