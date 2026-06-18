# slitherbot
<img src="assets/demo.gif" height=350>
  

basic bot i made to play [slither.io](slither.io) based on exposed game data through the window object

it still lacks a lot of features (i.e. avoiding other snakes, favoring pellet clusters vs individual pellets, etc)..but it moves! i may have spent a bit too much time on the math side of it...

this project uses [selenium](selenium.dev) to interact with the browser and is entirely written in typescript (with some...questionable logic...) - since slither exposes data about the environment via the window object (try going into slither.io and running stuff like `window.slither` or `window.foods`), you can use the data it provides to automate gameplay!

by using the data about nearby pellets as well as some basic trigonometry, you can determine the turn angle needed to get a pellet, which allows you to "score" nearby pellets and determine which one to go towards, which is what i've tried to implement here, though on a pretty mediocre level

to run, clone the project, run `bun i` to install dependencies, then `bun src/index.ts` to launch the selenium window