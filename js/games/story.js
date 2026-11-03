// Story Time — a short story is read aloud (and shown), then a question about it.
// Early levels: short stories, the answer is stated. Later: longer stories, "why" and "how many".
import { el, pick, shuffle } from '../core/util.js';
import { speak } from '../core/voice.js';

// { s: sentences, q: question, a: answer, w: wrong answers, e: picture, hard?: true }
const STORIES = [
  { s: ['Sam has a red ball.', 'He kicks it to his dog.'], q: 'What color is the ball?', a: 'red', w: ['blue', 'green', 'yellow'], e: '🔴' },
  { s: ['Sam has a red ball.', 'He kicks it to his dog.'], q: 'Who does Sam kick the ball to?', a: 'his dog', w: ['his mom', 'a cat', 'a bird'], e: '🐶' },
  { s: ['Mia puts on her coat and hat.', 'Snow falls all day.'], q: 'What is the weather?', a: 'snowy', w: ['sunny', 'rainy', 'hot'], e: '❄️' },
  { s: ['Ben is at the zoo.', 'He sees a tall giraffe and a big lion.'], q: 'Where is Ben?', a: 'at the zoo', w: ['at school', 'at home', 'at the beach'], e: '🦒' },
  { s: ['The cat sat on the mat.', 'Then the cat took a nap.'], q: 'What did the cat do?', a: 'took a nap', w: ['ran fast', 'went for a swim', 'ate lunch'], e: '😴' },
  { s: ['Ana feeds the ducks at the pond.', 'The ducks say quack.'], q: 'What do the ducks say?', a: 'quack', w: ['moo', 'woof', 'meow'], e: '🦆' },
  { s: ['Grandma knits a hat.', 'It is warm and blue.'], q: 'Who made the hat?', a: 'Grandma', w: ['Dad', 'Mia', 'a robot'], e: '🧶' },
  { s: ['The big dog barks at the mail truck.', 'The little cat hides under the bed.'], q: 'Who hides under the bed?', a: 'the cat', w: ['the dog', 'the mail truck', 'the bird'], e: '🐱' },
  { s: ['Zoe and Jay ride the bus to school.', 'Zoe sits by the window.'], q: 'How do they get to school?', a: 'on the bus', w: ['by boat', 'by plane', 'on bikes'], e: '🚌' },
  { s: ['A bee flies to a flower.', 'It drinks the nectar and makes honey.'], q: 'What does the bee make?', a: 'honey', w: ['milk', 'bread', 'juice'], e: '🍯' },
  { s: ['Tom has three red crayons and two blue crayons.'], q: 'Which color does Tom have more of?', a: 'red', w: ['blue', 'green', 'yellow'], e: '🖍️' },
  { s: ['Lily plants a seed.', 'She gives it water and sun.', 'Soon a flower grows.'], q: 'What grows?', a: 'a flower', w: ['a dog', 'a house', 'a car'], e: '🌸', hard: true },
  { s: ['Dad bakes a cake.', 'It is for Jon. Today is his birthday.'], q: 'Why did Dad bake a cake?', a: "It is Jon's birthday", w: ['It is raining', 'Jon is sleepy', 'It is night'], e: '🎂', hard: true },
  { s: ['It is dark. Nina puts on her pajamas.', 'She brushes her teeth and goes to bed.'], q: 'When does this happen?', a: 'at night', w: ['at lunch', 'in the morning', 'at recess'], e: '🌙', hard: true },
  { s: ['Max is sad. His ice cream fell on the ground.', 'His sister shares hers with him.'], q: 'How did his sister help?', a: 'She shared her ice cream', w: ['She ate it', 'She ran away', 'She laughed at him'], e: '🍦', hard: true },
  { s: ['Pip is a little frog.', 'He can jump very high.', 'He jumps over a log.'], q: 'What does Pip jump over?', a: 'a log', w: ['a rock', 'a fence', 'a house'], e: '🐸', hard: true },
  { s: ['The sun went down.', 'The sky turned pink and orange.'], q: 'What happened to the sun?', a: 'it went down', w: ['it came up', 'it turned blue', 'it fell off'], e: '🌅', hard: true },
  { s: ['Kai drops his cup.', 'Splash! Milk is on the floor.', 'Kai gets a towel.'], q: 'What spilled?', a: 'milk', w: ['juice', 'paint', 'soup'], e: '🥛', hard: true },
  { s: ['We went to the park.', 'I swung on the swing.', 'Then I slid down the slide.'], q: 'What did I do last?', a: 'slid down the slide', w: ['swung on the swing', 'ate a snack', 'went to the park'], e: '🛝', hard: true },
  { s: ['Eli has 2 apples.', 'He gives 1 to his friend.'], q: 'How many apples does Eli have now?', a: '1', w: ['2', '3', '0'], e: '🍎', hard: true },
];

// Per difficulty, per level: use the longer/harder stories yet? How many answers to choose from?
const LEVELS = [
  [{ hard: false, n: 3 }, { hard: false, n: 4 }, { hard: true, n: 3 }],      // First Steps
  [{ hard: false, n: 3 }, { hard: true, n: 3 }, { hard: true, n: 4 }],       // Growing Strong
  [{ hard: true, n: 3 }, { hard: true, n: 4 }, { hard: true, n: 4 }],        // Super Star
];

export default {
  id: 'story',
  title: 'Story Time',
  emoji: '📚',
  color: '#8338ec',
  blurb: 'Listen to a story, answer a question',
  rounds: 5,
  maxLevels: LEVELS.map((l) => l.length),

  makeRound(level, history, difficulty = 1) {
    const set = LEVELS[difficulty] || LEVELS[1];
    const cfg = set[Math.min(level, set.length) - 1];
    const pool = STORIES.filter((x) => (cfg.hard ? true : !x.hard));
    let st;
    do { st = pick(pool); } while (history.slice(-4).includes(st.q + st.a));
    const wrong = shuffle(st.w).slice(0, cfg.n - 1);
    return {
      key: st.q + st.a,
      text: st.q,
      say: [...st.s, st.q],
      retrySay: [st.q],
      choices: shuffle([st.a, ...wrong]).map((w) => ({ label: w, correct: w === st.a, className: 'word' })),
      render(v) {
        v.append(el('div', { class: 'story-wrap' },
          el('div', { class: 'story' }, st.s.map((x) => el('p', {}, x))),
          el('button', { class: 'hear-btn', type: 'button', 'aria-label': 'Hear the story again', onclick: () => speak([...st.s, st.q], { force: true }) }, '🔊 Read the story again')));
      },
      reveal: { emoji: st.e, caption: st.a },
      praise: ['Yes!', `${st.a}.`],
    };
  },
};
