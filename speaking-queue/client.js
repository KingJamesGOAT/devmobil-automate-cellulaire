// Client WebSocket pour l application de demande de parole
// Utilise WsMini pour consommer les RPC et s abonner au canal PubSub

import { WSClient } from 'wsmini';

// Elements de l interface utilisateur
const connectionBadge = document.getElementById('connection-badge');
const clientIdElement = document.getElementById('client-id');
const userRoleText = document.getElementById('user-role-text');
const speakerDisplay = document.getElementById('speaker-display');
const queueList = document.getElementById('queue-list');
const queueCount = document.getElementById('queue-count');
const actionBtn = document.getElementById('action-btn');
const feedbackMsg = document.getElementById('feedback-msg');

let myId = null;
let currentState = { speaker: null, waiting: [] };
let isProcessing = false;

// Formatage d un identifiant pour affichage court et lisible
function formatId(id) {
  if (!id) return '';
  return id.length > 8 ? id.substring(0, 8) : id;
}

// Affiche un message de retour (succes ou erreur)
function showFeedback(message, isError = false) {
  feedbackMsg.textContent = message;
  feedbackMsg.className = isError ? 'feedback error' : 'feedback success';
  if (!isError) {
    setTimeout(() => {
      if (feedbackMsg.textContent === message) {
        feedbackMsg.textContent = '';
      }
    }, 4000);
  }
}

// Met a jour l interface graphique selon l etat recu du serveur
function updateUI(state) {
  currentState = state;

  const isCurrentSpeaker = state.speaker === myId;
  const isWaiting = state.waiting.includes(myId);

  // Mise a jour du panneau de parole
  speakerDisplay.className = 'speaker-status';
  if (!state.speaker) {
    speakerDisplay.classList.add('free');
    speakerDisplay.textContent = 'La parole est libre.';
  } else if (isCurrentSpeaker) {
    speakerDisplay.classList.add('mine');
    speakerDisplay.textContent = 'Vous avez la parole !';
  } else {
    speakerDisplay.classList.add('occupied');
    speakerDisplay.textContent = `Parole accordee a : ${formatId(state.speaker)}`;
  }

  // Mise a jour du role personnel
  if (isCurrentSpeaker) {
    userRoleText.textContent = 'Statut : Vous detenez actuellement la parole.';
  } else if (isWaiting) {
    const position = state.waiting.indexOf(myId) + 1;
    userRoleText.textContent = `Statut : En attente dans la file (Position : ${position}).`;
  } else {
    userRoleText.textContent = 'Statut : Vous n etes pas dans la file.';
  }

  // Mise a jour de la liste d attente
  queueCount.textContent = state.waiting.length;
  queueList.innerHTML = '';

  if (state.waiting.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = 'Aucun participant en attente.';
    queueList.appendChild(emptyItem);
  } else {
    state.waiting.forEach((id, index) => {
      const item = document.createElement('li');
      item.className = 'queue-item';

      const isMe = id === myId;
      if (isMe) item.classList.add('mine');

      item.innerHTML = `
        <span><strong>${index + 1}.</strong> Participant ${formatId(id)} ${isMe ? '(Vous)' : ''}</span>
        ${isMe ? '<span class="queue-item-badge">Moi</span>' : ''}
      `;
      queueList.appendChild(item);
    });
  }

  // Adaptation du bouton d action selon la situation du participant
  actionBtn.disabled = isProcessing;
  actionBtn.className = 'btn';

  if (isCurrentSpeaker) {
    actionBtn.textContent = 'Liberer la parole';
    actionBtn.classList.add('btn-success');
    actionBtn.onclick = handleRelease;
  } else if (isWaiting) {
    actionBtn.textContent = 'Annuler ma demande';
    actionBtn.classList.add('btn-warning');
    actionBtn.onclick = handleCancel;
  } else {
    actionBtn.textContent = 'Demander la parole';
    actionBtn.classList.add('btn-primary');
    actionBtn.onclick = handleRequest;
  }
}

// Action RPC : Demande de prise de parole
async function handleRequest() {
  if (isProcessing) return;
  isProcessing = true;
  actionBtn.disabled = true;

  try {
    const res = await ws.rpc('requestSpeech');
    if (res.isSpeaker) {
      showFeedback('Parole obtenue immediatement.');
    } else {
      showFeedback('Demande enregistree dans la file d attente.');
    }
  } catch (err) {
    showFeedback(err.message || 'Erreur lors de la demande.', true);
  } finally {
    isProcessing = false;
    actionBtn.disabled = false;
  }
}

// Action RPC : Annulation de la demande en file
async function handleCancel() {
  if (isProcessing) return;
  isProcessing = true;
  actionBtn.disabled = true;

  try {
    await ws.rpc('cancelSpeech');
    showFeedback('Votre demande a ete retiree de la file.');
  } catch (err) {
    showFeedback(err.message || 'Erreur lors de l annulation.', true);
  } finally {
    isProcessing = false;
    actionBtn.disabled = false;
  }
}

// Action RPC : Liberation de la parole
async function handleRelease() {
  if (isProcessing) return;
  isProcessing = true;
  actionBtn.disabled = true;

  try {
    await ws.rpc('releaseSpeech');
    showFeedback('Vous avez libere la parole.');
  } catch (err) {
    showFeedback(err.message || 'Erreur lors de la liberation.', true);
  } finally {
    isProcessing = false;
    actionBtn.disabled = false;
  }
}

// Initialisation du client WebSocket et connexion
const ws = new WSClient('ws://localhost:8888');

// Gestion des pertes de connexion
ws.on('close', () => {
  connectionBadge.className = 'badge badge-disconnected';
  connectionBadge.textContent = 'Deconnecte';
  userRoleText.textContent = 'Connexion perdue avec le serveur.';
  actionBtn.disabled = true;
  showFeedback('Connexion au serveur perdue. Veuillez recharger la page.', true);
});

async function start() {
  try {
    await ws.connect();

    myId = ws.clientId;
    clientIdElement.textContent = formatId(myId);
    connectionBadge.className = 'badge badge-connected';
    connectionBadge.textContent = 'Connecte';

    // Abonnement aux mises a jour en temps reel (PubSub)
    await ws.sub('speech', (state) => {
      updateUI(state);
    });

    // Recuperation de l etat initial (RPC)
    const initialState = await ws.rpc('getStatus');
    updateUI(initialState);
  } catch (err) {
    console.error('Echec de connexion au serveur WebSocket:', err);
    connectionBadge.className = 'badge badge-disconnected';
    connectionBadge.textContent = 'Erreur';
    clientIdElement.textContent = 'Indisponible';
    actionBtn.disabled = true;
    showFeedback('Impossible de joindre le serveur WebSocket sur ws://localhost:8888', true);
  }
}

start();
