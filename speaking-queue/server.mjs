// Serveur WebSocket pour l application de demande de parole
// Utilise WsMini pour gerer les RPC et la diffusion PubSub

import { WSServerPubSub, WSServerError } from 'wsmini';

const PORT = 8888;
const wsServer = new WSServerPubSub({ port: PORT });

// File d attente des participants stockee en memoire (tableau d identifiants)
// queue[0] represente la personne qui a actuellement la parole
// queue.slice(1) represente les personnes en attente dans l ordre
let queue = [];

// Construit l objet d etat actuel de la file
function getQueueState() {
  return {
    speaker: queue.length > 0 ? queue[0] : null,
    waiting: queue.length > 1 ? queue.slice(1) : [],
  };
}

// Diffuse l etat a l ensemble des clients abonnes au canal speech
function broadcastQueue() {
  wsServer.pub('speech', getQueueState());
}

// Canal PubSub "speech" : diffusion reservee au serveur (usersCanPub: false)
// hookUnsub : declenche lors d un desabonnement ou de la fermeture d une connexion
wsServer.addChannel('speech', {
  usersCanPub: false,
  hookUnsub: (client) => {
    const clientId = client.id;
    if (queue.includes(clientId)) {
      // Retrait du participant et passage automatique de la parole si besoin
      queue = queue.filter((id) => id !== clientId);
      console.log(`Depart du participant ${clientId}, file mise a jour`);
      broadcastQueue();
    }
  },
});

// RPC 1 : Obtenir l etat actuel de la file
wsServer.addRpc('getStatus', () => {
  return getQueueState();
});

// RPC 2 : Demander la parole
wsServer.addRpc('requestSpeech', (_data, client) => {
  const clientId = client.id;

  // Verifier si le client est deja dans la file ou detient deja la parole
  if (queue.includes(clientId)) {
    throw new WSServerError('Vous etes deja dans la file ou possedez deja la parole.');
  }

  queue.push(clientId);
  console.log(`Demande enregistree pour ${clientId}. Position : ${queue.length}`);
  broadcastQueue();

  return {
    success: true,
    isSpeaker: queue[0] === clientId,
  };
});

// RPC 3 : Annuler sa demande quand on est dans la file d attente
wsServer.addRpc('cancelSpeech', (_data, client) => {
  const clientId = client.id;
  const waitingList = queue.slice(1);

  if (!waitingList.includes(clientId)) {
    throw new WSServerError('Vous n etes pas dans la file d attente.');
  }

  queue = queue.filter((id) => id !== clientId);
  console.log(`Annulation de la demande pour ${clientId}`);
  broadcastQueue();

  return { success: true };
});

// RPC 4 : Liberer la parole quand on la possede
wsServer.addRpc('releaseSpeech', (_data, client) => {
  const clientId = client.id;

  if (queue.length === 0 || queue[0] !== clientId) {
    throw new WSServerError('Vous ne detenez pas la parole actuellement.');
  }

  // Le premier element est retire, le suivant dans la file prend la place
  queue.shift();
  console.log(`Parole liberee par ${clientId}`);
  broadcastQueue();

  return { success: true };
});

wsServer.start();
console.log(`Serveur de demande de parole demarre sur le port ${PORT}`);
