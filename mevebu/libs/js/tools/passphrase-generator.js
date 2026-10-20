// A passphrase from a bundled word list. The entropy reading is arithmetic on
// the size of that list, not an estimate: log2(length) bits per word.
import {
  el, icon, toast, bench, stack, panel, numberInput, selectInput, button,
  actions, toolcard, notice, checkbox, rangeInput, copyButton, chipRow,
} from "../core.js";

const WORDS = `acorn amber anchor apple arrow aspen attic autumn badge bagel baker bamboo
banjo barrel basil basket beach beacon bean bear beaver bell belt bench berry birch biscuit
bison blade blanket bloom board boat bolt bonfire book boot bottle boulder bowl box braid branch
brass bread brick bridge broom brush bubble bucket buffalo bugle bulb bunny burrow bus butter
button cabin cactus camel candle candy canoe canvas canyon carbon cargo carpet carrot cart castle
cedar chalk cherry chess chest chicken chisel cider cinema circle city clamp clay cliff cloak clock
cloud clover coach coast cobra cocoa comet compass copper coral cork corn cotton couch cougar
country court cove crab crane crater crayon creek crest cricket crimson crow crown crystal cube
cupboard curl curtain cycle daisy dance dawn deer delta denim desert desk diamond dice diner dock
dolphin dome donkey door dove dragon drift drum dune dusk eagle earth easel echo egg elbow elder
elk ember engine envelope falcon fang farm feather fence fern ferry field fig finch fire fish flag
flame flask fleet flint float flock flute foam fog forest fork fossil fountain fox frame frost fruit
galley garden garlic gate gecko gem ginger glacier glass glove goat gold goose gourd grain grape
grass gravel green grove guitar gull gust hammer harbor harp harvest hawk hay hedge helmet heron
hill hinge hive holly honey hoof hook horn horse hotel hut iceberg ink inlet iron island ivory ivy
jacket jade jaguar jar jasmine jelly jewel jigsaw jungle juniper kayak kettle key kite kitten kiwi
knife knot koala ladder lagoon lake lamp lantern lapel laser latch lattice leaf ledge lemon lens
letter lever lily lime linen lion lizard lobster lock log lotus lumber lunar lynx magnet magneto
maize mango maple marble march marsh mask mast meadow medal melon mesa metal meteor mint mirror
mist mitten mole monkey moon moose mortar moss moth motor mound mountain mouse mushroom music
napkin needle nest nettle nickel night noodle north note nugget oak oasis ocean olive onion opal
orange orbit orchid otter oven owl oxide oyster paddle page palm panda panel paper parcel parrot
pasture patio peach peanut pear pebble pelican pen pencil pepper perch petal piano picnic pier
pigeon pillar pine piston pitcher plain plane planet plank plant plaster plate plaza plum pocket
pond pony poppy porch portal potato prairie prism pumpkin puzzle quail quarry quartz quill quiver
rabbit radar raft rail rain rake ram ranch raven ravine ray razor reef relay ribbon rice ridge
rifle ring river road robin rocket rod roof root rope rose rowboat ruby rug ruler saddle sage sail
salmon sand sapphire satchel saw scarf school scooter scout sea seal seed shade shark sheep shelf
shell shield ship shoe shore shovel shrub silk silver siren skate sketch sky sled slope snail snake
snow soap sock sofa solar song soup sparrow spice spider spike spine sponge spoon spring spruce
square squid stable stack star statue steam steel stem step stick stone stool storm stove strap
stream street string sugar summer sun swan sweat sweet swift swing table tackle tail talon tank
tapir tea teal temple tent thistle thorn thread thunder tide tiger timber tin toad toast tomato
tone tool tooth topaz torch tower track trail train trap tray tree trek trench tribe trout truck
trumpet trunk tulip tunnel turtle twig valley vanilla vase velvet vine violet violin vista wagon
walnut walrus wand wave wax wheat wheel whip whisper willow wind window wing winter wire wolf wood
wool wrench yacht yarn yellow yew zebra zinc zipper zone`.split(/\s+/).filter(Boolean);

const SEPARATORS = [
  { value: "-", label: "hyphen" },
  { value: " ", label: "space" },
  { value: ".", label: "dot" },
  { value: "_", label: "underscore" },
];

export function mount(slot) {
  let phrase = "";

  const count = rangeInput({ min: "2", max: "12", step: "1", value: "5", "aria-label": "Words" });
  const countLabel = el("span", { class: "text-sm font-semibold text-ink-2 tabular-nums" }, "5 words");
  const separator = selectInput(SEPARATORS, { value: "-", "aria-label": "Separator" });
  const capitalize = checkbox("Capitalize each word", { checked: false });
  const number = checkbox("Add a number", { checked: false });
  const symbol = checkbox("Add a symbol", { checked: false });

  const error = notice("warn");
  const output = el("p", {
    class: "m-0 wrap-anywhere font-mono text-[clamp(20px,3.4vw,28px)] font-bold leading-[1.4] tracking-[-0.01em] text-ink",
    "aria-live": "polite",
  }, "");
  const entropy = el("p", { class: "m-0 text-sm text-ink-2" });
  const panelBody = el("div", { class: "grid gap-2 rounded-r2 border border-orbit bg-deck-2 p-4" }, output, entropy);

  function make() {
    error.write("");
    if (!WORDS.length) {
      error.write("The word list is empty.");
      return;
    }
    const size = Math.max(2, Math.min(12, Number(count.value) || 5));
    const random = crypto.getRandomValues(new Uint32Array(size + 2));
    const parts = [];
    for (let i = 0; i < size; i++) {
      let word = WORDS[random[i] % WORDS.length];
      if (capitalize.input.checked) word = word[0].toUpperCase() + word.slice(1);
      parts.push(word);
    }
    if (number.input.checked) parts.push(String(random[size] % 100));
    if (symbol.input.checked) parts.push("!@#$%&*?"[random[size + 1] % 9]);

    const join = separator.value === " " ? " " : separator.value;
    phrase = parts.join(join);

    // Each word is log2(WORDS.length) bits, because every index is equally
    // likely. The optional number and symbol add about 6.6 and 3.2 bits.
    const bits = size * Math.log2(WORDS.length) + (number.input.checked ? Math.log2(100) : 0) + (symbol.input.checked ? Math.log2(9) : 0);
    // Half the space on average, at 100 billion guesses a second.
    const seconds = 2 ** (bits - 1) / 1e11;
    entropy.textContent = `${Math.round(bits)} bits · ${formatTime(seconds)} to guess at 100 billion tries a second`;
    output.textContent = phrase;
  }

  function formatTime(seconds) {
    if (seconds < 1) return "under a second";
    if (seconds < 60) return `about ${Math.round(seconds)} seconds`;
    const years = seconds / 31_557_600;
    if (seconds < 3600) return `about ${Math.max(1, Math.round(seconds / 60))} minutes`;
    if (seconds < 86400) return `about ${Math.round(seconds / 3600)} hours`;
    if (years < 1) return `about ${Math.round(seconds / 86400)} days`;
    if (years < 1000) return `about ${Math.round(years)} years`;
    if (years < 1e6) return `about ${Math.round(years / 1000)} thousand years`;
    if (years < 1e9) return `about ${Math.round(years / 1e6)} million years`;
    return "longer than the universe has existed";
  }

  count.addEventListener("input", () => {
    countLabel.textContent = `${count.value} word${count.value === "1" ? "" : "s"}`;
    make();
  });
  separator.addEventListener("change", make);
  capitalize.input.addEventListener("change", make);
  number.input.addEventListener("change", make);
  symbol.input.addEventListener("change", make);

  const regenerate = button("Generate", { icon: "refresh-cw", kind: "fill", onclick: make });
  const copy = copyButton(() => phrase, "Copy passphrase");

  make();

  const shell = toolcard({
    body: bench(
      stack(
        el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "Words"), count, countLabel),
        panel("Separator", separator),
        capitalize,
        number,
        symbol,
        error
      ),
      stack(panelBody,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "The word list is bundled with the app, so this works offline. Each word is worth about 9 bits; five words is about 46 bits, which suits a login with rate limiting. Use more words for anything that protects money."))
    ),
    foot: actions(regenerate, copy),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
