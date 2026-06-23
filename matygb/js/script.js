

const STORAGE_KEY = "rutinaviva_habitos";



const formulario = document.getElementById("habito-form");
const inputNombre = document.getElementById("nombre");
const selectCategoria = document.getElementById("categoria");
const selectFrecuencia = document.getElementById("frecuencia");
const inputDiasPorSemana = document.getElementById("diasPorSemana");
const campoDiasSemana = document.getElementById("dias-semana-field");
const inputFechaInicio = document.getElementById("fechaInicio");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
const formFeedback = document.getElementById("form-feedback");

const listaHabitos = document.getElementById("lista-habitos");
const emptyState = document.getElementById("empty-state");
const filtroCategoria = document.getElementById("filtro-categoria");

const statTotal = document.getElementById("stat-total");
const statHoy = document.getElementById("stat-hoy");


let idEnEdicion = null;


function obtenerHabitos() {
  const crudo = localStorage.getItem(STORAGE_KEY);
  if (!crudo) {
    return [];
  }
  try {
    const datos = JSON.parse(crudo);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.warn("No se pudo interpretar el almacenamiento local. Se reinicia la lista.", error);
    return [];
  }
}

function guardarHabitos(habitos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habitos));
}

function generarId() {
  return `habito-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}



const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;


function marcarEstadoCampo(input, esValido, mensaje) {
  const errorElemento = document.getElementById(`error-${input.id}`);
  input.classList.remove("campo-valido", "campo-invalido");
  input.classList.add(esValido ? "campo-valido" : "campo-invalido");
  if (errorElemento) {
    errorElemento.textContent = esValido ? "" : mensaje;
  }
  return esValido;
}

function validarNombre() {
  const valor = inputNombre.value.trim();

  if (valor.length === 0) {
    return marcarEstadoCampo(inputNombre, false, "El nombre del hábito es obligatorio.");
  }
  if (valor.length < 3 || valor.length > 40) {
    return marcarEstadoCampo(inputNombre, false, "Debe tener entre 3 y 40 caracteres.");
  }
  if (!REGEX_NOMBRE.test(valor)) {
    return marcarEstadoCampo(inputNombre, false, "Solo se permiten letras y espacios.");
  }
  return marcarEstadoCampo(inputNombre, true, "");
}

function validarCategoria() {
  const valido = selectCategoria.value !== "";
  return marcarEstadoCampo(selectCategoria, valido, "Selecciona una categoría.");
}

function validarFrecuencia() {
  const valido = selectFrecuencia.value !== "";
  return marcarEstadoCampo(selectFrecuencia, valido, "Selecciona una frecuencia.");
}


function validarDiasPorSemana() {
  if (selectFrecuencia.value !== "semanal") {
    marcarEstadoCampo(inputDiasPorSemana, true, "");
    inputDiasPorSemana.value = "";
    return true;
  }

  const valor = Number(inputDiasPorSemana.value);
  if (!inputDiasPorSemana.value) {
    return marcarEstadoCampo(inputDiasPorSemana, false, "Indica cuántos días a la semana (1 a 6).");
  }
  if (valor < 1 || valor > 6) {
    return marcarEstadoCampo(inputDiasPorSemana, false, "El valor debe estar entre 1 y 6 días.");
  }
  return marcarEstadoCampo(inputDiasPorSemana, true, "");
}


function validarFechaInicio() {
  if (!inputFechaInicio.value) {
    return marcarEstadoCampo(inputFechaInicio, false, "La fecha de inicio es obligatoria.");
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaSeleccionada = new Date(inputFechaInicio.value + "T00:00:00");

  if (fechaSeleccionada < hoy) {
    return marcarEstadoCampo(inputFechaInicio, false, "La fecha no puede ser anterior a hoy.");
  }
  return marcarEstadoCampo(inputFechaInicio, true, "");
}

function validarFormularioCompleto() {
  const nombreValido = validarNombre();
  const categoriaValida = validarCategoria();
  const frecuenciaValida = validarFrecuencia();
  const diasValidos = validarDiasPorSemana();
  const fechaValida = validarFechaInicio();

  return nombreValido && categoriaValida && frecuenciaValida && diasValidos && fechaValida;
}



function actualizarVisibilidadDiasPorSemana() {
  const esSemanal = selectFrecuencia.value === "semanal";
  inputDiasPorSemana.disabled = !esSemanal;
  campoDiasSemana.style.opacity = esSemanal ? "1" : "0.6";
  if (!esSemanal) {
    inputDiasPorSemana.value = "";
    marcarEstadoCampo(inputDiasPorSemana, true, "");
  }
}

function calcularFechaHoyISO() {
  const hoy = new Date();
  const offset = hoy.getTimezoneOffset();
  const local = new Date(hoy.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function crearTagTexto(texto) {
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = texto;
  return tag;
}


function crearTarjetaHabito(habito) {
  const hoyISO = calcularFechaHoyISO();
  const hechoHoy = habito.ultimaFechaCompletado === hoyISO;

  const li = document.createElement("li");
  li.className = "habit-card" + (hechoHoy ? " hecha-hoy" : "");
  li.dataset.id = habito.id;

  const botonCheck = document.createElement("button");
  botonCheck.className = "habit-check";
  botonCheck.type = "button";
  botonCheck.setAttribute("aria-pressed", String(hechoHoy));
  botonCheck.setAttribute("aria-label", "Marcar hábito como hecho hoy");
  botonCheck.textContent = hechoHoy ? "✓" : "";
  botonCheck.dataset.accion = "toggle";

  const info = document.createElement("div");
  info.className = "habit-info";

  const titulo = document.createElement("h3");
  titulo.textContent = habito.nombre;

  const meta = document.createElement("div");
  meta.className = "habit-meta";
  meta.appendChild(crearTagTexto(habito.categoria));
  meta.appendChild(
    crearTagTexto(
      habito.frecuencia === "semanal"
        ? `Semanal · ${habito.diasPorSemana} día(s)`
        : "Diaria"
    )
  );
  meta.appendChild(crearTagTexto(`Desde ${habito.fechaInicio}`));

  info.appendChild(titulo);
  info.appendChild(meta);

  const acciones = document.createElement("div");
  acciones.className = "habit-actions";

  const botonEditar = document.createElement("button");
  botonEditar.type = "button";
  botonEditar.className = "btn-editar";
  botonEditar.textContent = "Editar";
  botonEditar.dataset.accion = "editar";

  const botonEliminar = document.createElement("button");
  botonEliminar.type = "button";
  botonEliminar.className = "btn-eliminar";
  botonEliminar.textContent = "Eliminar";
  botonEliminar.dataset.accion = "eliminar";

  acciones.appendChild(botonEditar);
  acciones.appendChild(botonEliminar);

  li.appendChild(botonCheck);
  li.appendChild(info);
  li.appendChild(acciones);

  return li;
}

function renderizarLista() {
  const habitos = obtenerHabitos();
  const filtro = filtroCategoria.value;

  const habitosFiltrados =
    filtro === "todas" ? habitos : habitos.filter((h) => h.categoria === filtro);

  listaHabitos.innerHTML = "";

  if (habitosFiltrados.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    habitosFiltrados.forEach((habito) => {
      listaHabitos.appendChild(crearTarjetaHabito(habito));
    });
  }

  actualizarEstadisticas(habitos);
}

function actualizarEstadisticas(habitos) {
  const hoyISO = calcularFechaHoyISO();
  const hechosHoy = habitos.filter((h) => h.ultimaFechaCompletado === hoyISO).length;

  statTotal.textContent = String(habitos.length);
  statHoy.textContent = String(hechosHoy);
}


function agregarHabito(habito) {
  const habitos = obtenerHabitos();
  habitos.push(habito);
  guardarHabitos(habitos);
}

function actualizarHabito(id, datosActualizados) {
  const habitos = obtenerHabitos();
  const indice = habitos.findIndex((h) => h.id === id);
  if (indice !== -1) {
    habitos[indice] = { ...habitos[indice], ...datosActualizados };
    guardarHabitos(habitos);
  }
}

function eliminarHabito(id) {
  const habitos = obtenerHabitos().filter((h) => h.id !== id);
  guardarHabitos(habitos);
}

function alternarCompletadoHoy(id) {
  const habitos = obtenerHabitos();
  const habito = habitos.find((h) => h.id === id);
  if (!habito) return;

  const hoyISO = calcularFechaHoyISO();
  habito.ultimaFechaCompletado = habito.ultimaFechaCompletado === hoyISO ? null : hoyISO;
  guardarHabitos(habitos);
}



function limpiarFormulario() {
  formulario.reset();
  [inputNombre, selectCategoria, selectFrecuencia, inputDiasPorSemana, inputFechaInicio].forEach(
    (campo) => {
      campo.classList.remove("campo-valido", "campo-invalido");
    }
  );
  document.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));
  actualizarVisibilidadDiasPorSemana();
  idEnEdicion = null;
  btnGuardar.textContent = "Agregar hábito";
  btnCancelarEdicion.hidden = true;
}

function cargarHabitoEnFormulario(habito) {
  inputNombre.value = habito.nombre;
  selectCategoria.value = habito.categoria;
  selectFrecuencia.value = habito.frecuencia;
  actualizarVisibilidadDiasPorSemana();
  inputDiasPorSemana.value = habito.diasPorSemana || "";
  inputFechaInicio.value = habito.fechaInicio;

  idEnEdicion = habito.id;
  btnGuardar.textContent = "Guardar cambios";
  btnCancelarEdicion.hidden = false;
  inputNombre.focus();
}

function manejarEnvioFormulario(evento) {

  evento.preventDefault();

  const esValido = validarFormularioCompleto();
  if (!esValido) {
    formFeedback.textContent = "Revisa los campos marcados antes de continuar.";
    formFeedback.style.color = "#b3261e";
    return;
  }

  const datos = {
    nombre: inputNombre.value.trim(),
    categoria: selectCategoria.value,
    frecuencia: selectFrecuencia.value,
    diasPorSemana: selectFrecuencia.value === "semanal" ? Number(inputDiasPorSemana.value) : null,
    fechaInicio: inputFechaInicio.value,
  };

  if (idEnEdicion) {
    actualizarHabito(idEnEdicion, datos);
    formFeedback.textContent = "Hábito actualizado correctamente.";
  } else {
    agregarHabito({ ...datos, id: generarId(), ultimaFechaCompletado: null });
    formFeedback.textContent = "Hábito agregado correctamente.";
  }

  formFeedback.style.color = "#2c5f2d";
  limpiarFormulario();
  renderizarLista();
}


function manejarClicEnLista(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const tarjeta = boton.closest(".habit-card");
  const id = tarjeta?.dataset.id;
  if (!id) return;

  const accion = boton.dataset.accion;

  if (accion === "eliminar") {
    const tarjetaAEliminar = tarjeta;
    eliminarHabito(id);
    // Generación dinámica: se elimina el elemento individualmente del DOM
    tarjetaAEliminar.remove();
    renderizarLista();
    return;
  }

  if (accion === "editar") {
    const habito = obtenerHabitos().find((h) => h.id === id);
    if (habito) cargarHabitoEnFormulario(habito);
    return;
  }

  if (accion === "toggle") {
    alternarCompletadoHoy(id);
    renderizarLista();
    return;
  }
}



// 1) submit: validar y guardar el formulario
formulario.addEventListener("submit", manejarEnvioFormulario);

// 2) input: validación en vivo mientras el usuario escribe el nombre
inputNombre.addEventListener("input", validarNombre);

// 3) change: alterna la visibilidad del campo dependiente y revalida
selectFrecuencia.addEventListener("change", () => {
  actualizarVisibilidadDiasPorSemana();
  validarDiasPorSemana();
});

selectCategoria.addEventListener("change", validarCategoria);
inputFechaInicio.addEventListener("change", validarFechaInicio);
inputDiasPorSemana.addEventListener("input", validarDiasPorSemana);

// 4) click: acciones sobre la lista (delegación de eventos) y cancelar edición
listaHabitos.addEventListener("click", manejarClicEnLista);

btnCancelarEdicion.addEventListener("click", () => {
  limpiarFormulario();
  formFeedback.textContent = "Edición cancelada.";
  formFeedback.style.color = "#5b6a57";
});

filtroCategoria.addEventListener("change", renderizarLista);



function inicializarApp() {
  inputFechaInicio.min = calcularFechaHoyISO();
  actualizarVisibilidadDiasPorSemana();
  renderizarLista();
}

document.addEventListener("DOMContentLoaded", inicializarApp);
