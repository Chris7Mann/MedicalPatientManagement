let patients = [];
let nextId = 1;
let editingPatientId = null;

// Funzioni per la persistenza dei dati
function saveToLocalStorage() {
  try {
    const data = {
      patients: patients,
      nextId: nextId
    };
    localStorage.setItem('patientsData', JSON.stringify(data));
  } catch (error) {
    console.error('Errore nel salvare i dati:', error);
    showAlert('Errore nel salvare i dati', 'error');
  }
}

function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem('patientsData');
    if (savedData) {
      const data = JSON.parse(savedData);
      patients = data.patients || [];
      nextId = data.nextId || 1;
      
      // Aggiorna la tabella dopo aver caricato i dati
      updateTable();
      
      console.log(`Caricati ${patients.length} pazienti dal localStorage`);
    }
  } catch (error) {
    console.error('Errore nel caricare i dati:', error);
    showAlert('Errore nel caricare i dati salvati', 'error');
    // In caso di errore, inizializza con valori vuoti
    patients = [];
    nextId = 1;
  }
}

function showAlert(message, type) {
  const alert = document.getElementById("alert");
  alert.textContent = message;
  alert.className = `alert alert-${type}`;
  alert.style.display = "block";

  setTimeout(() => {
    alert.style.display = "none";
  }, 3000);
}

function validateCodiceFiscale(cf) {
  const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  return regex.test(cf.toUpperCase());
}

function checkDuplicates(codiceFiscale, numeroCartella, excludeId = null) {
  return patients.some(
    (patient) =>
      patient.id !== excludeId &&
      (patient.codiceFiscale.toLowerCase() === codiceFiscale.toLowerCase() ||
        patient.numeroCartella === numeroCartella)
  );
}

function createNoteContent(patient, isExpanded = false) {
  const fragment = document.createDocumentFragment();
  
  // Crea lo span per il testo della nota
  const noteSpan = document.createElement('span');
  noteSpan.className = isExpanded ? 'note-text expanded-note' : 'note-text';
  noteSpan.textContent = isExpanded ? patient.note : truncateNote(patient.note);
  fragment.appendChild(noteSpan);
  
  // Aggiungi il pulsante di espansione se necessario
  if (patient.note && patient.note.length > 50) {
    const expandBtn = document.createElement('button');
    expandBtn.className = 'expand-btn';
    expandBtn.id = `expand-btn-${patient.id}`;
    expandBtn.textContent = isExpanded ? '▲' : '▼';
    expandBtn.addEventListener('click', () => toggleNote(patient.id));
    fragment.appendChild(expandBtn);
  }
  
  return fragment;
}

function truncateNote(note, maxLength = 50) {
  if (!note || note.length <= maxLength) {
    return note || "-";
  }
  return note.substring(0, maxLength) + "...";
}

function toggleNote(patientId) {
  const noteCell = document.getElementById(`note-${patientId}`);
  const patient = patients.find(p => p.id === patientId);
  
  if (!patient || !patient.note) return;
  
  const isExpanded = noteCell.classList.contains('expanded');
  
  // Pulisci la cella
  while (noteCell.firstChild) {
    noteCell.removeChild(noteCell.firstChild);
  }
  
  // Aggiungi il nuovo contenuto
  const newContent = createNoteContent(patient, !isExpanded);
  noteCell.appendChild(newContent);
  
  // Aggiorna la classe
  if (isExpanded) {
    noteCell.classList.remove('expanded');
  } else {
    noteCell.classList.add('expanded');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function createTableRow(patient) {
  const row = document.createElement('tr');
  
  // Evidenzia la riga se in modifica
  if (editingPatientId === patient.id) {
    row.style.backgroundColor = '#fff3cd';
  }
  
  // Nome
  const nomeCell = document.createElement('td');
  nomeCell.textContent = patient.nome;
  row.appendChild(nomeCell);
  
  // Cognome
  const cognomeCell = document.createElement('td');
  cognomeCell.textContent = patient.cognome;
  row.appendChild(cognomeCell);
  
  // Codice Fiscale
  const cfCell = document.createElement('td');
  cfCell.textContent = patient.codiceFiscale;
  row.appendChild(cfCell);
  
  // Numero Cartella
  const cartellaCell = document.createElement('td');
  cartellaCell.textContent = patient.numeroCartella;
  row.appendChild(cartellaCell);
  
  // Data Registrazione
  const dataCell = document.createElement('td');
  dataCell.className = 'date-cell';
  dataCell.textContent = patient.dataRegistrazione ? formatDate(patient.dataRegistrazione) : '-';
  row.appendChild(dataCell);
  
  // Note
  const noteCell = document.createElement('td');
  noteCell.className = 'note-cell';
  noteCell.id = `note-${patient.id}`;
  noteCell.appendChild(createNoteContent(patient));
  row.appendChild(noteCell);
  
  // Azioni
  const actionsCell = document.createElement('td');
  
  // Pulsante Modifica
  const editBtn = document.createElement('button');
  editBtn.className = 'action-btn edit-btn';
  editBtn.textContent = '✏️ Modifica';
  editBtn.disabled = editingPatientId === patient.id;
  editBtn.addEventListener('click', () => modificaPaziente(patient.id));
  actionsCell.appendChild(editBtn);
  
  // Pulsante Elimina
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'action-btn delete-btn';
  deleteBtn.textContent = '🗑️ Elimina';
  deleteBtn.disabled = editingPatientId === patient.id;
  deleteBtn.addEventListener('click', () => eliminaPaziente(patient.id));
  actionsCell.appendChild(deleteBtn);
  
  row.appendChild(actionsCell);
  
  return row;
}

function registraPaziente() {
  const nome = document.getElementById("nome").value.trim();
  const cognome = document.getElementById("cognome").value.trim();
  const codiceFiscale = document
    .getElementById("codiceFiscale")
    .value.trim()
    .toUpperCase();
  const numeroCartella = document.getElementById("numeroCartella").value.trim();
  const note = document.getElementById("note").value.trim();

  // Validazioni
  if (!nome || !cognome || !codiceFiscale || !numeroCartella) {
    showAlert("Tutti i campi obbligatori devono essere compilati", "error");
    return;
  }

  if (codiceFiscale.length !== 16) {
    showAlert("Il codice fiscale deve essere di 16 caratteri", "error");
    return;
  }

  if (editingPatientId) {
    // Modalità modifica
    if (checkDuplicates(codiceFiscale, numeroCartella, editingPatientId)) {
      showAlert("Codice fiscale o numero cartella già esistente", "error");
      return;
    }

    const patientIndex = patients.findIndex((p) => p.id === editingPatientId);
    if (patientIndex !== -1) {
      patients[patientIndex] = {
        id: editingPatientId,
        nome,
        cognome,
        codiceFiscale,
        numeroCartella,
        note,
        dataRegistrazione: patients[patientIndex].dataRegistrazione || new Date().toISOString(), // Mantieni la data originale o aggiungi una nuova
      };

      resetFormAfterEdit();
      showAlert("Paziente modificato con successo", "success");
      saveToLocalStorage(); // Salva dopo la modifica
    }
  } else {
    // Modalità inserimento
    if (checkDuplicates(codiceFiscale, numeroCartella)) {
      showAlert(
        "Paziente già registrato (codice fiscale o numero cartella duplicato)",
        "error"
      );
      return;
    }

    const patient = {
      id: nextId++,
      nome,
      cognome,
      codiceFiscale,
      numeroCartella,
      note,
      dataRegistrazione: new Date().toISOString(), // Aggiungi la data di registrazione
    };

    patients.push(patient);
    showAlert("Paziente registrato con successo", "success");
    saveToLocalStorage(); // Salva dopo l'inserimento
  }

  updateTable();
  document.getElementById("patientForm").reset();
}

function modificaPaziente(id) {
  const patient = patients.find((p) => p.id === id);
  if (!patient) return;

  // Popola i campi del form
  document.getElementById("nome").value = patient.nome;
  document.getElementById("cognome").value = patient.cognome;
  document.getElementById("codiceFiscale").value = patient.codiceFiscale;
  document.getElementById("numeroCartella").value = patient.numeroCartella;
  document.getElementById("note").value = patient.note || "";

  // Imposta la modalità modifica
  editingPatientId = id;

  // Cambia il testo del bottone
  const submitBtn = document.querySelector(".btn-primary");
  submitBtn.textContent = "Salva Modifiche";
  submitBtn.style.backgroundColor = "#27ae60";

  // Aggiungi bottone annulla
  const buttonGroup = document.querySelector(".button-group");
  if (!document.getElementById("cancelEdit")) {
    const cancelBtn = document.createElement("button");
    cancelBtn.id = "cancelEdit";
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Annulla Modifica";
    cancelBtn.style.backgroundColor = "#95a5a6";
    cancelBtn.style.color = "white";
    cancelBtn.onclick = annullaModifica;
    buttonGroup.insertBefore(cancelBtn, buttonGroup.firstChild);
  }

  // Scroll verso il form
  document.querySelector(".container").scrollIntoView({ behavior: "smooth" });

  showAlert(
    'Modalità modifica attivata. Modifica i dati e clicca "Salva Modifiche"',
    "success"
  );
}

function resetFormAfterEdit() {
  editingPatientId = null;
  document.getElementById("patientForm").reset();

  // Ripristina il bottone
  const submitBtn = document.querySelector(".btn-primary");
  submitBtn.textContent = "Registra Paziente";
  submitBtn.style.backgroundColor = "#5b9bd5";

  // Rimuovi bottone annulla
  const cancelBtn = document.getElementById("cancelEdit");
  if (cancelBtn) {
    cancelBtn.remove();
  }
}

function annullaModifica() {
  resetFormAfterEdit();
  showAlert("Modifica annullata", "success");
}

function updateTable() {
  const tbody = document.getElementById("patientTableBody");

  // Pulisci la tabella
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  if (patients.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'empty-state';
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 7; // Aumentato da 6 a 7 per includere la colonna data
    emptyCell.textContent = 'Nessun paziente registrato';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    return;
  }

  // Aggiungi le righe dei pazienti
  patients.forEach(patient => {
    tbody.appendChild(createTableRow(patient));
  });
}

document.getElementById("patientForm").addEventListener("submit", function (e) {
  e.preventDefault();
  registraPaziente();
});

function svuotaCampi() {
  if (editingPatientId) {
    annullaModifica();
  } else {
    document.getElementById("patientForm").reset();
    showAlert("Campi svuotati", "success");
  }
}

function cancellaTabella() {
  if (patients.length === 0) {
    showAlert("La tabella è già vuota", "error");
    return;
  }

  if (
    confirm(
      "Sei sicuro di voler cancellare tutti i dati dei pazienti? Questa operazione non può essere annullata."
    )
  ) {
    patients = [];
    nextId = 1;
    editingPatientId = null;

    // Ripristina il form se era in modalità modifica
    const submitBtn = document.querySelector(".btn-primary");
    submitBtn.textContent = "Registra Paziente";
    submitBtn.style.backgroundColor = "#5b9bd5";

    const cancelBtn = document.getElementById("cancelEdit");
    if (cancelBtn) {
      cancelBtn.remove();
    }

    updateTable();
    document.getElementById("patientForm").reset();
    saveToLocalStorage(); // Salva lo stato vuoto
    showAlert("Tabella cancellata con successo", "success");
  }
}

function eliminaPaziente(id) {
  if (confirm("Sei sicuro di voler eliminare questo paziente?")) {
    patients = patients.filter((patient) => patient.id !== id);

    // Se stavo modificando questo paziente, annulla la modifica
    if (editingPatientId === id) {
      annullaModifica();
    }

    updateTable();
    saveToLocalStorage(); // Salva dopo l'eliminazione
    showAlert("Paziente eliminato con successo", "success");
  }
}

// Formattazione automatica codice fiscale
document
  .getElementById("codiceFiscale")
  .addEventListener("input", function (e) {
    e.target.value = e.target.value.toUpperCase();
  });

// Carica i dati all'avvio della pagina
document.addEventListener('DOMContentLoaded', function() {
  loadFromLocalStorage();
});