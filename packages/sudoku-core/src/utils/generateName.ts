const adjectives = {
    beginner: [
        'tame',
        'friendly',
        'hopeful',
        'brief',
        'lucky',
        'blissful',
        'adorable'
    ],
    easy: [
        'nice',
        'well meaning',
        'agreeable',
        'calm',
        'careless',
        'relaxed',
        'breathless',
        'cute'
    ],
    medium: [
        'aspiring',
        'cheerful',
        'cooperative',
        'eager',
        'capable',
        'secretive',
        'lovely',
        'speedy',
    ],
    hard: [
        'bold',
        'fierce',
        'modern',
        'bountiful',
        'courageous',
        'brainy',
        'alluring',
        'careful'
    ],
    expert: [
        'murky',
        'strange',
        'crooked',
        'outstanding',
        'fearless',
        'passionate',
        'outrageous',
        'mysterious',
        'sizable'
    ],
    artisan: [
        'artisanal',
        'futuristic',
        'irregular',
        'defiant',
        'determined',
        'diligent',
        'cumbersome',
        'majestic'
    ],
    master: [
        'vast',
        'great',
        'masterful',
        'eternal',
        'astronomical',
        'enchanting',
        'erratic',
        'massive'
    ],
    jedi: [
        'incredulous',
        'forceful',
        'ominous',
        'immense',
        'combative',
        'disastrous',
        'ruthless'
    ]
}

const subject = {
    beginner: [
        'teddy bear',
        'child',
        'companion',
        'old lady',
        'gungan',
        'disney character',
        'mouse',
        'cat'
    ],
    easy: [
        'neighbor',
        'friend',
        'farm animal',
        'pokemon',
        'dog',
        'musician',
        'coffee cup',
        'soda bottle'
    ],
    medium: [
        'colleague',
        'buddy',
        'do-gooder',
        'rain forrest',
        'orangutan',
        'meerkat',
        'swimming pool',
        'loud speaker',
    ],
    hard: [
        'candidate',
        'middle manager',
        'gang member',
        'entrance',
        'columns',
        'vessel',
        'vehicle',
        'lion',
        'elephant',
    ],
    expert: [
        'skyscraper',
        'sea creature',
        'board of executives',
        'stadium',
        'detective',
        'commission',
        'adventure',
        'legend'
    ],
    artisan: [
        'sea monster',
        'executive officer',
        'admiral',
        'hydrogen blimp',
        'president',
        'warden',
        'alien',
        'space ship'
    ],
    master: [
        'mountain',
        'ocean',
        'volcano',
        'earthquake',
        'tsunami',
        'avalanche',
        'erruption',
        'prisoner'
    ],
    jedi: [
        'sith lord',
        'universe',
        'solar system',
        'galaxy',
        'solar storm',
        'super nova',
        'black hole'
    ]
}

const rand = (n: number) => Math.floor((Math.random()*n))

export const generateName = (difficulty: string) => {
    return [
        adjectives[difficulty][rand(adjectives[difficulty].length)],
        subject[difficulty][rand(subject[difficulty].length)],
    ].join(' ')
}