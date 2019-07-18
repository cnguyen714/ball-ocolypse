
import Game from "./game";

window.addEventListener("DOMContentLoaded", () => {
  const cvs = document.getElementById('ceaseless-battle');
  const ctx = cvs.getContext('2d');
  const game = new Game(cvs, ctx);

  game.init();
});