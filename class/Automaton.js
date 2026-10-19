import { moduloEuclidian } from '../lib/math.js';

export default class Automaton {
  /**
   * Constructeur de l'automate cellulaire.
   * Initialise les dimensions, l'apparence, les règles B/S et la matrice vide.
   */
  constructor(
    cols,
    rows,
    cellSize = 10,
    aliveColor = '#FFFFFF',
    deadColor = '#222222',
    birth = new Set([3]),
    survival = new Set([2, 3])
  ) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.aliveColor = aliveColor;
    this.deadColor = deadColor;
    this.birth = birth;
    this.survival = survival;

    // Création de la matrice 2D remplie de 0 (toutes les cellules sont mortes)
    this.matrix = [];
    for (let r = 0; r < this.rows; r++) {
      this.matrix[r] = new Array(this.cols).fill(0);
    }
  }

  /**
   * Initialise chaque cellule à l'état vivant (1) selon une probabilité donnée entre 0 et 1.
   */
  randomize(prob = 0.1) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.matrix[r][c] = Math.random() < prob ? 1 : 0;
      }
    }
  }

  /**
   * Dessine l'état actuel de l'automate sur le contexte 2D du canvas.
   * Laisse une marge externe de 1 pixel pour simuler visuellement une grille.
   */
  draw(ctx) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        ctx.fillStyle = this.matrix[r][c] === 1 ? this.aliveColor : this.deadColor;
        const x = c * this.cellSize;
        const y = r * this.cellSize;
        const size = this.cellSize - 1;
        ctx.fillRect(x, y, size, size);
      }
    }
  }

  /**
   * Compte le nombre de voisins vivants autour de la cellule (row, col) selon le voisinage de Moore.
   * Utilise le modulo euclidien pour gérer les bords comme un tore plat.
   */
  countAliveNeighbors(row, col) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        // Ne pas compter la cellule elle-même
        if (dr === 0 && dc === 0) continue;

        const neighborRow = moduloEuclidian(row + dr, this.rows);
        const neighborCol = moduloEuclidian(col + dc, this.cols);

        count += this.matrix[neighborRow][neighborCol];
      }
    }
    return count;
  }

  /**
   * Calcule et applique le passage à la génération suivante selon les règles Birth et Survival.
   * Les modifications sont stockées dans une liste temporaire avant d'être appliquées.
   */
  nextGeneration() {
    const cellsToSwitch = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const neighbors = this.countAliveNeighbors(r, c);
        const isAlive = this.matrix[r][c] === 1;

        if (isAlive) {
          // Si la cellule est vivante et que son nombre de voisins n'est pas dans survival, elle meurt
          if (!this.survival.has(neighbors)) {
            cellsToSwitch.push([r, c]);
          }
        } else {
          // Si la cellule est morte et que son nombre de voisins est dans birth, elle naît
          if (this.birth.has(neighbors)) {
            cellsToSwitch.push([r, c]);
          }
        }
      }
    }

    // Application des changements d'état après le parcours complet de la matrice
    for (const [r, c] of cellsToSwitch) {
      this.matrix[r][c] = this.matrix[r][c] === 1 ? 0 : 1;
    }
  }

  /**
   * Inverse l'état d'une cellule spécifique (vivant devient mort, mort devient vivant).
   */
  toggleCell(row, col) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.matrix[row][col] = this.matrix[row][col] === 1 ? 0 : 1;
    }
  }
}
