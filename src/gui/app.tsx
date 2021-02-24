import React from 'react'
import { BoardDisplay } from './board'
import { Solver } from './solver'
import { Point } from '../core/types'
import { boardFromStr } from '../core/sudoku'
import useEventListener from '@use-it/event-listener'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import { PuzzleSelect } from './puzzle-select'
import { Dialog } from '@material-ui/core'
import { DigitSelector } from './digit-selector'
import { Help } from './help'
import { ImportExport } from './import-export'
import { useSelector } from 'react-redux'
import { selectHasError, selectIsComplete, selectSolution } from '../selectors'
import { actions } from '../index'
import { Hints } from './hints'
import { State } from '../state'

const dummyBoard = boardFromStr('000000000000000000000000000000000000000000000000000000000000000000000000000000000')

export function App(){
    const [hintsOpen, setHintsOpen] = React.useState(false)
    const [puzzleSelectOpen, setPuzzleSelectOpen] = React.useState(false)
    const [importExportOpen, setImportExportOpen] = React.useState(false)
    const [helpOpen, setHelpOpen] = React.useState(false)

    const inputMode = useSelector((state: State) => state.inputMode)
    const solverState = useSelector((state: State) => state.game?.solver ?? null)
    const boardStack = useSelector((state: State) => state.game?.boardStack ?? [])
    const selectedCells = useSelector((state: State) => state.selectedCells)
    const selectedDigit = useSelector((state: State) => state.selectedDigit)
    const board = useSelector((state: State) => state.game?.board ?? dummyBoard)
    const boardMetaData = useSelector((state: State) => state.game?.boardMetaData ?? null)

    const solutionBoard = useSelector(selectSolution)
    const isComplete = useSelector(selectIsComplete)
    const hasError = useSelector(selectHasError)

    const toggleSolver = React.useCallback(() => {
        actions.toggleSolver(solutionBoard)
    }, [solutionBoard])

    const toggleHints = React.useCallback(() => {
        setHintsOpen(x => !x)
    }, [])

    const onSetDigit = React.useCallback((digit: number, points: Point[]) => {
        actions.setDigit(digit, points, solutionBoard)
    }, [solutionBoard])

    const onSelectDigit = React.useCallback((digit: number) => {
        actions.selectDigit(digit)
    }, [])

    const clearSelected = React.useCallback(() => {
        actions.setSelectedCells([])
    }, [])

    const onGlobalKeyDown = React.useCallback((e: KeyboardEvent) => {
        if(e.key.toLowerCase() === 'a') actions.setInputMode('value')
        if(e.key.toLowerCase() === 's') actions.setInputMode('candidates')
        if(e.key.toLowerCase() === 'n') actions.undo()
        if(e.key.toLowerCase() === 'c') toggleSolver()
        if(e.key.toLowerCase() === 'h') toggleHints()
        if(e.key.toLowerCase() === 'd') clearSelected()
        if(/\d/.test(e.key)){
            const number = parseInt(e.key, 10)
            if(number >= 1 && number <= 9){
                if(selectedCells.length > 0){
                    onSetDigit(number, selectedCells)
                }else{
                    onSelectDigit(number)
                }
            }
        }
    }, [toggleSolver, toggleHints, onSetDigit, selectedCells, clearSelected, onSelectDigit])

    useEventListener('keydown', onGlobalKeyDown)

    return (
        <div style={{ height: '100%', minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ height: '100%', minHeight: 0, display: 'flex', padding: 16 }}>
                <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <Paper style={{ padding: 16, marginBottom: 16 }}>
                        <div style={{ display: 'flex' }}>
                            <div style={{ marginRight: 16 }}>
                                <Button color='primary' variant='contained' onClick={() => setPuzzleSelectOpen(true)}>
                                    Select puzzle
                                </Button>
                            </div>
                            <div>
                                <Button color='secondary' variant='contained' onClick={() => setImportExportOpen(true)}>
                                    Import / Export
                                </Button>
                            </div>
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant={'outlined'} onClick={() => setHelpOpen(true)}>
                                    Help
                                </Button>
                            </div>
                        </div>
                    </Paper>
                    <Paper style={{ padding: 16 }}>
                        {boardMetaData &&
                        <h4 style={{ margin: 0, paddingBottom: 16 }}>Puzzle: {boardMetaData.name} - Difficulty: {boardMetaData.difficulty.difficulty}</h4>
                        }
                        <BoardDisplay
                            board={solverState ? solverState.boardBeforeSolve : board}
                            solveResult={solverState?.solveResult ?? null}
                            celebration={isComplete && !hasError}
                        />
                        <div>
                            <Button onClick={() => actions.setInputMode('value')} disabled={inputMode === 'value'}>Digit (a)</Button>
                            <Button onClick={() => actions.setInputMode('candidates')} disabled={inputMode === 'candidates'}>Candidate (s)</Button>
                            <Button onClick={actions.undo} disabled={boardStack.length === 0}>Undo (n)</Button>
                            <Button onClick={clearSelected} disabled={selectedCells.length === 0}>Deselect all (d)</Button>
                            <Button onClick={toggleHints}>{hintsOpen ? 'Hide hints (h)' : 'Show hints (h)'}</Button>
                            <Button onClick={toggleSolver} disabled={hasError ?? false}>{!!solverState ? 'Hide solver (c)' : 'Show solver (c)'}</Button>
                        </div>
                        <br />
                        <div>
                            <DigitSelector
                                board={board}
                                direction={'row'}
                                onClickDigit={onSelectDigit}
                                selectedDigit={selectedDigit}
                            />
                        </div>
                    </Paper>
                </div>
                {hintsOpen &&
                <Paper style={{ height: '100%', width: 300, padding: 16, marginLeft: 16, overflowY: 'auto' }}>
                    <Hints />
                </Paper>
                }
                {!!solverState &&
                    <Paper style={{ height: '100%', width: 300, padding: 16, marginLeft: 16, overflowY: 'auto' }}>
                        <Solver
                            board={solverState.solveResult?.board ?? solverState.boardBeforeSolve}
                            solveResult={solverState.solveResult}
                            onSolveResult={actions.setSolveResult}
                            onPlayFromHere={actions.playFromSolver}
                        />
                    </Paper>
                }
            </div>
            <Dialog
                fullWidth
                maxWidth={'lg'}
                open={puzzleSelectOpen}
                onClose={() => setPuzzleSelectOpen(false)}
            >
                <Paper style={{ padding: 16 }}>
                    <PuzzleSelect
                        onPuzzleSelect={(puzzle, fromProgress) => {
                            actions.startPuzzle(puzzle, fromProgress)
                            setPuzzleSelectOpen(false)
                        }}
                    />
                </Paper>
            </Dialog>
            <Dialog
                fullWidth
                maxWidth={'lg'}
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
            >
                <Paper style={{ padding: 16 }}>
                    <Help />
                </Paper>
            </Dialog>
            <Dialog
                fullWidth
                maxWidth={'lg'}
                open={importExportOpen}
                onClose={() => setImportExportOpen(false)}
            >
                <Paper style={{ padding: 16 }}>
                    <ImportExport />
                </Paper>
            </Dialog>
        </div>
    )
}