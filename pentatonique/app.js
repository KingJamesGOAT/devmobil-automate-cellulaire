import MainLoop from '../lib/mainloop.min.js';
import Tweens from '../class/Tweens.js';
import Circle from '../class/Circle.js';

// Configuration du canvas plein ecran
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Initialisation du synthetiseur WebAudio TinySynth
const synth = new WebAudioTinySynth({ quality: 1, useReverb: 1 });
const audio = synth.getAudioContext();
synth.setMasterVol(0.35);
synth.setProgram(0, 89); // Pad 2 (warm)

// Notes de la gamme pentatonique (Do, Re, Mi, Sol, La) et teintes des bandes
const NOTES = [60, 62, 64, 67, 69];
const HUES = [25, 80, 165, 245, 305];

// Gestion des animations et des cercles a l ecran
const tweens = new Tweens();
const circles = [];

// Suivi des contacts multi-touch
// touches: associe chaque pointerId a ses donnees (note, tranche, cercle, tween)
// activeBands: ensemble des tranches actuellement jouees pour eviter les doublons
const touches = new Map();
const activeBands = new Set();

// Retourne l indice de la tranche (0 a 4) selon la position X
function getBandIndex(x) {
  const bandWidth = canvas.width / NOTES.length;
  const index = Math.floor(x / bandWidth);
  return Math.max(0, Math.min(NOTES.length - 1, index));
}

// Gestion de l appui (souris ou doigt)
canvas.addEventListener('pointerdown', (e) => {
  // Le navigateur suspend l audio jusqu au premier geste utilisateur
  audio.resume();

  const bandIndex = getBandIndex(e.clientX);

  // Règle: ignorer un nouveau contact sur une tranche deja occupee
  if (activeBands.has(bandIndex)) return;

  activeBands.add(bandIndex);
  const note = NOTES[bandIndex];

  // Jouer la note avec une velocite constante de 90
  synth.noteOn(0, note, 90);

  // Creer le cercle visuel associe au contact
  const color = `oklch(85% 0.14 ${HUES[bandIndex]})`;
  const circle = new Circle(e.clientX, e.clientY, 32, color, 0.85);
  circles.push(circle);

  // Animation de pulsation continue tant que le contact est maintenu
  const pulseTween = tweens.create({
    dur: 650,
    from: 28,
    to: 42,
    loop: true,
    yoyo: true,
    ease: 'quadInOut',
    animate: (radius) => {
      circle.radius = radius;
    },
  });

  touches.set(e.pointerId, {
    bandIndex,
    note,
    circle,
    pulseTween,
  });
});

// Arret de la note et declenchement du tween de disparition
function releaseTouch(pointerId) {
  const touch = touches.get(pointerId);
  if (!touch) return;

  // Arret du son
  synth.noteOff(0, touch.note);

  // Liberation de la tranche
  activeBands.delete(touch.bandIndex);

  // Arret de la pulsation
  tweens.delete(touch.pulseTween);

  // Transition de relachement: agrandissement et fondu vers la transparence
  const startRadius = touch.circle.radius;
  const startOpacity = touch.circle.opacity;

  tweens.create({
    dur: 500,
    from: 0,
    to: 1,
    ease: 'quadOut',
    animate: (progress) => {
      touch.circle.radius = startRadius + 55 * progress;
      touch.circle.opacity = startOpacity * (1 - progress);
    },
    onComplete: () => {
      // Suppression definitive du cercle une fois l animation terminee
      const index = circles.indexOf(touch.circle);
      if (index !== -1) {
        circles.splice(index, 1);
      }
    },
  });

  touches.delete(pointerId);
}

canvas.addEventListener('pointerup', (e) => releaseTouch(e.pointerId));
canvas.addEventListener('pointercancel', (e) => releaseTouch(e.pointerId));

// Boucle principale d animation
MainLoop.setSimulationTimestep(1000 / 60);

MainLoop.setUpdate((delta) => {
  tweens.update(delta);
});

MainLoop.setDraw(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const circle of circles) {
    circle.draw(ctx);
  }
});

MainLoop.start();
