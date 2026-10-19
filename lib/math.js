/**
 * Calcule le modulo euclidien de deux nombres.
 * Permet de gérer les indices négatifs pour boucler sur les bords de la matrice.
 */
export function moduloEuclidian(op1, op2) {
  return ((op1 % op2) + op2) % op2;
}
