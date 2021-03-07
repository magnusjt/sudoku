import { getPointId } from './sudokuUtils'
import { randomOrder } from './misc'

export const pattern1 = [
    '____X____',
    '_X_XXX_X_',
    '____X____',
    '____X____',
    '_X_XXX_X_',
    '____X____',
    '____X____',
    '_X_XXX_X_',
    '____X____',
]

export const pattern2 = [
    'XXXXXXXXX',
    'X_______X',
    'X_______X',
    'X_______X',
    'X_______X',
    'X_______X',
    'X_______X',
    'X_______X',
    'XXXXXXXXX',
]

export const pattern3 = [
    '_________',
    '_________',
    '_________',
    'XXXXXXXXX',
    'XXXXXXXXX',
    'XXXXXXXXX',
    '_________',
    '_________',
    '_________',
]

export const pattern4 = [
    '__X_X_X_X',
    '_X_X_X_X_',
    'X_X_X_X__',
    '_X_X_X___',
    'X_X_X____',
    '_X_X_____',
    'X_X______',
    '_X_______',
    'X________',
]

export const pattern5 = [
    '___X_X___',
    '___X_X___',
    'XXXX_XXXX',
    '___X_X___',
    '___X_X___',
    '___X_X___',
    'XXXX_XXXX',
    '___X_X___',
    '___X_X___',
]

export const pattern6 = [
    '____X____',
    '_X__X__X_',
    '___X_X___',
    '__X___X__',
    '_X__X__X_',
    '__X___X__',
    '___X_X___',
    '_X__X__X_',
    '____X____',
]

export const pattern7 = [
    '_X__X__X_',
    'XXXXXXXXX',
    '_X__X__X_',
    '_X__X__X_',
    'XXXXXXXXX',
    '_X__X__X_',
    '_X__X__X_',
    'XXXXXXXXX',
    '_X__X__X_',
]

const createOrderFromPattern = (pattern: string[]) => {
    const patternPoints = pattern
        .flatMap((line, y) => {
            return line.split('')
                .map((char, x) => {
                    return { on: char === 'X', point: { x, y, id: getPointId(x, y) }}
                })
        })

    const on = patternPoints.filter(x => x.on).map(x => x.point)
    const off = patternPoints.filter(x => !x.on).map(x => x.point)

    return [
        ...randomOrder(off),
        ...randomOrder(on)
    ]
}

export const createPatterns = () => [
    pattern1,
    pattern2,
    pattern3,
    pattern4,
    pattern5,
    pattern6,
    pattern7
]
.map(createOrderFromPattern)