import { createTestBoardFromStr } from '../util'
import { getTechniquesRequiredForSolvingBoard } from '../../core/solve'

const jedi1 = '305080000087690000690005000004070010070900200000230078803700009002069000069000740'
const jedi2 = '004000071230070004671900030090080706000706090006590003309025167000000300000000025'
const jedi3 = '200030967400007085007080030820013600003600000000024003300140796100000302090002008'

const run = (str: string) => {
    const board = createTestBoardFromStr(str)
    return getTechniquesRequiredForSolvingBoard(board)
}

test('jedi 1', () => {
    const techniques = run(jedi1)
    expect(techniques).not.toContain('bruteForce')
})

test('jedi 2', () => {
    const techniques = run(jedi2)
    expect(techniques).not.toContain('bruteForce')
})

test('jedi 3', () => {
    const techniques = run(jedi3)
    expect(techniques).not.toContain('bruteForce')
})