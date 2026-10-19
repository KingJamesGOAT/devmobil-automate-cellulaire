import MainLoop from './lib/mainloop.min.js';
import Automaton from './class/Automaton.js';
import Circle from './class/Circle.js';
import Keyboard from './class/Keyboard.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const cellSize = 10;
const cols = Math.floor(canvas.width / cellSize);
const rows = Math.floor(canvas.height / cellSize);

const automaton = new Automaton(cols, rows, cellSize, '#FFFFFF', '#141414');
automaton.randomize(0.1);

canvas.addEventListener('pointerdown', (event) => {
  if (currentProject !== 'automaton') return;
  const col = Math.floor(event.clientX / cellSize);
  const row = Math.floor(event.clientY / cellSize);
  automaton.toggleCell(row, col);
});

const keyboard = new Keyboard();
const circle = new Circle(canvas.width / 2, canvas.height / 2, 24, '#38bdf8');

let currentProject = 'automaton';

function setProject(projectName) {
  currentProject = projectName;

  document.querySelectorAll('.project-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.project === projectName);
  });

  if (projectName === 'automaton') {
    MainLoop.setSimulationTimestep(100);
  } else {
    MainLoop.setSimulationTimestep(1000 / 60);
  }
}

document.querySelectorAll('.project-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    setProject(e.target.dataset.project);
  });
});

MainLoop.setSimulationTimestep(100);

MainLoop.setUpdate((delta) => {
  if (currentProject === 'automaton') {
    automaton.nextGeneration();
  } else if (currentProject === 'circles') {
    circle.update(delta, keyboard, canvas.width, canvas.height);
  }
});

MainLoop.setDraw(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentProject === 'automaton') {
    automaton.draw(ctx);
  } else if (currentProject === 'circles') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    circle.draw(ctx);
  }
});

MainLoop.start();
