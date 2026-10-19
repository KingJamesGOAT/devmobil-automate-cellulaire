import MainLoop from './lib/mainloop.min.js';
import Automaton from './class/Automaton.js';

// Récupération du canvas et de son contexte graphique 2D
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// Adaptation de la taille du canvas à la taille de la fenêtre
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Paramètres de la grille
const cellSize = 10;
const cols = Math.floor(canvas.width / cellSize);
const rows = Math.floor(canvas.height / cellSize);

// Règles du Jeu de la Vie classique : B3/S23
const birthRules = new Set([3]);
const survivalRules = new Set([2, 3]);

// Création de l'automate et initialisation aléatoire avec une probabilité de 0.1
const automaton = new Automaton(cols, rows, cellSize, '#FFFFFF', '#222222', birthRules, survivalRules);
automaton.randomize(0.1);

// Gestion du clic ou du toucher pour inverser l'état d'une cellule
canvas.addEventListener('pointerdown', (event) => {
  const col = Math.floor(event.clientX / cellSize);
  const row = Math.floor(event.clientY / cellSize);
  automaton.toggleCell(row, col);
});

// Réglage du rythme de simulation en millisecondes (100 ms = 10 générations par seconde)
MainLoop.setSimulationTimestep(100);

// Le tick de simulation calcule uniquement la génération suivante
MainLoop.setUpdate(() => {
  automaton.nextGeneration();
});

// Le tick de rendu affiche uniquement l'état actuel de la grille
MainLoop.setDraw(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  automaton.draw(ctx);
});

// Démarrage de la boucle temps réel
MainLoop.start();
