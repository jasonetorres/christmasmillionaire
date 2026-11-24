export const shows = [
  { id: 'price', title: 'The Price Is Merry', icon: '🏷️', description: 'Guess the price without going over.' },
  { id: 'feud', title: 'Holiday Family Feud', icon: '☃️', description: 'Find the answers on the survey board.' },
  { id: 'wheel', title: 'Wheel of Winter', icon: '❄️', description: 'Spin, call a letter, and solve the holiday puzzle.' },
  { id: 'deal', title: 'Deal or No Sleigh', icon: '🎁', description: 'Pick a gift and decide when to take the banker’s offer.' },
  { id: 'password', title: 'North Pole Password', icon: '🔑', description: 'Give one-word clues and guess the hidden holiday word.' },
] as const;

export const prices = [
  ['Box of candy canes', 399], ['String of 100 holiday lights', 1299],
  ['Gingerbread house kit', 1499], ['Pair of fleece slippers', 2499],
  ['Tabletop artificial tree', 3499], ['Holiday cookie tin', 1199],
  ['Set of four festive mugs', 2199], ['Light-up lawn reindeer', 6999],
] as const;

export const puzzles = [
  ['Winter activity', 'SKATING UNDER THE STARS'],
  ['Holiday tradition', 'LEAVING COOKIES FOR SANTA'],
  ['Winter weather', 'SNOW DAY'],
  ['Around the house', 'STOCKINGS BY THE FIREPLACE'],
  ['Holiday food', 'GINGERBREAD HOUSE'],
  ['Holiday movie', 'THE MUPPET CHRISTMAS CAROL'],
  ['Winter gear', 'MITTENS AND A SCARF'],
  ['Holiday tradition', 'DRIVING TO SEE THE LIGHTS'],
] as const;

export const surveys = [
  ['Name something people forget when wrapping a gift.', [['Tape', 34], ['Scissors', 24], ['Gift tag', 19], ['Ribbon', 13], ['The gift receipt', 10]]],
  ['Name something you might find in a stocking.', [['Candy', 33], ['Socks', 24], ['Gift card', 21], ['Small toy', 14], ['Orange', 8]]],
  ['Name something that makes a snow day better.', [['Hot cocoa', 32], ['Sledding', 26], ['Sleeping in', 19], ['A movie', 15], ['Snowball fight', 8]]],
  ['Name a sound you hear during the holidays.', [['Bells', 35], ['Carols', 28], ['Wrapping paper', 17], ['Fire crackling', 12], ['Snowblower', 8]]],
  ['Name a holiday cookie people make.', [['Sugar cookie', 33], ['Gingerbread', 26], ['Chocolate chip', 19], ['Shortbread', 13], ['Thumbprint', 9]]],
  ['Name something that goes wrong with holiday lights.', [['Tangled wires', 36], ['A dead bulb', 28], ['Cord too short', 16], ['They fall down', 11], ['Wrong color', 9]]],
] as const;

export const passwords = [
  'Tinsel', 'Mistletoe', 'Snowflake', 'Reindeer', 'Ornament', 'Chimney',
  'Fruitcake', 'Stocking', 'Nutcracker', 'Sleigh', 'Wreath', 'Gingerbread',
  'Workshop', 'Snowman', 'Eggnog', 'Icicle', 'Caroler', 'Poinsettia',
  'Fireplace', 'December', 'Ribbon', 'Blizzard', 'Cocoa', 'Evergreen',
];
