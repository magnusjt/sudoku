import React from 'react'
import { BoardDisplay } from './board'
import { Solver } from './solver'
import { Board, InputMode, Point, SolveResult } from '../core/types'
import {
    applyInputValue,
    boardFromStr,
    boardToStr,
    getTechniquesUntilNextValue,
    prepareBoardForSolver
} from '../core/sudoku'
import { getSolution } from '../core/solve'
import useEventListener from '@use-it/event-listener'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import { PuzzleSelect } from './puzzle-select'
import { Dialog } from '@material-ui/core'
import { BoardMetaData } from '../core/utils/getBoardMetaData'
import { DigitSelector } from './digit-selector'
import { boardHasError, boardIsComplete } from '../core/utils/sudokuUtils'
import { loadUserData, storeUserData, UserData } from './storage'
import { Help } from './help'
import { ImportExport } from './import-export'

type SolverState = {
    boardBeforeSolve: Board
    solveResult: SolveResult | null
}

const initalUserData = loadUserData()

const dummyBoard = boardFromStr('000000000000000000000000000000000000000000000000000000000000000000000000000000000')

export function App(){
    const [userData, _setUserData] = React.useState(initalUserData)
    const [initialBoard, setInitialBoard] = React.useState(dummyBoard)
    const [board, setBoard] = React.useState(initialBoard)
    const solutionBoard = React.useMemo(() => getSolution(initialBoard), [initialBoard])
    const [boardStack, setBoardStack] = React.useState<Board[]>([])
    const [solverState, setSolverState] = React.useState<SolverState | null>(null)
    const [inputMode, setInputMode] = React.useState<InputMode>('value')
    const [hintsEnabled, setHintsEnabled] = React.useState(false)
    const [puzzleSelectOpen, setPuzzleSelectOpen] = React.useState(false)
    const [importExportOpen, setImportExportOpen] = React.useState(false)
    const [helpOpen, setHelpOpen] = React.useState(false)
    const [boardMetaData, setBoardMetaData] = React.useState<BoardMetaData | null>(null)
    const [selectedCells, setSelectedCells] = React.useState<Point[]>([])
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null)

    const isValid = board !== dummyBoard
    const isComplete = React.useMemo(() => isValid && boardIsComplete(board), [board, isValid])
    const hasError = React.useMemo(() => isValid && boardHasError(board, solutionBoard), [board, solutionBoard, isValid])

    const inputEnabled = !solverState && isValid && !isComplete

    const hints = React.useMemo(() => {
        if(hasError || !hintsEnabled) return []
        return getTechniquesUntilNextValue(prepareBoardForSolver(board))
    }, [board, hasError, hintsEnabled])

    const setUserData = React.useCallback((userData: UserData) => {
        storeUserData(userData)
        _setUserData(userData)
    }, [])

    const onNewUserData = React.useCallback((userData: UserData) => {
      _setUserData(userData)
    }, [])

    const updateSolvedBoards = React.useCallback((boardStr: string) => {
        const nextUserData = {
            ...userData,
            solved: [...userData.solved, boardStr],
        }
        delete nextUserData.progress[boardStr]
        setUserData(nextUserData)
    }, [userData, setUserData])

    const updateBoardInProgress = React.useCallback((boardStr: string, board: Board) => {
        setUserData({...userData, progress: {
            ...userData.progress,
            [boardStr]: board
        }})
    }, [userData, setUserData])

    const onSetSolveResult = React.useCallback((solveResult: SolveResult | null, boardBeforeSolve: Board) => {
        setSolverState({
            solveResult,
            boardBeforeSolve
        })
    }, [])

    const toggleSolver = React.useCallback(() => {
        if(solverState){
            setSolverState(null)
        }else{
            if(!hasError && isValid){
                setSolverState({
                    boardBeforeSolve: prepareBoardForSolver(board),
                    solveResult: null
                })
                setSelectedCells([]) // A bit annoying since the highlight colors overlap with the solver
            }
        }
    }, [solverState, board, hasError, isValid])

    const onCopyFromSolver = React.useCallback(() => {
        if(solverState){
            setBoardStack(stack => [board, ...stack])
            setBoard(solverState.boardBeforeSolve)
            setSolverState(null)
        }
    }, [solverState, board])

    const toggleHints = React.useCallback(() => {
        setHintsEnabled(x => !x)
    }, [])

    const onSetDigit = React.useCallback((digit: number, points: Point[]) => {
        if(!inputEnabled) return
        const nextBoard = applyInputValue(board, points, digit, inputMode)
        if(boardIsComplete(nextBoard) && !boardHasError(nextBoard, solutionBoard)){
            updateSolvedBoards(boardToStr(initialBoard))
        }else{
            updateBoardInProgress(boardToStr(initialBoard), nextBoard)
        }
        setBoardStack(stack => [board, ...stack])
        setBoard(nextBoard)
        setSolverState(null) // Remove solve result whenever input is applied. The solve may not be valid anymore.
    }, [board, inputMode, inputEnabled, initialBoard, updateSolvedBoards, updateBoardInProgress, solutionBoard])

    const onUndo = React.useCallback(() => {
        if(!inputEnabled) return
        if(boardStack.length === 0){
            return
        }
        setBoard(boardStack[0])
        setBoardStack(stack => stack.slice(1))
    }, [boardStack, inputEnabled])

    const onPuzzleSelect = React.useCallback((puzzle: BoardMetaData, progress?: Board) => {
        const nextBoard = boardFromStr(puzzle.boardData)
        setInitialBoard(nextBoard)
        setBoard(progress ?? nextBoard)
        setSolverState(null)
        setPuzzleSelectOpen(false)
        setBoardMetaData(puzzle)
    }, [])

    const onSelectDigit = React.useCallback((digit: number) => {
        setSelectedDigit(selectedDigit => digit === selectedDigit ? null : digit)
    }, [])

    const clearSelected = React.useCallback(() => {
        setSelectedCells([])
    }, [])

    const onGlobalKeyDown = React.useCallback((e: KeyboardEvent) => {
        if(e.key.toLowerCase() === 'a') setInputMode('value')
        if(e.key.toLowerCase() === 's') setInputMode('candidates')
        if(e.key.toLowerCase() === 'n') onUndo()
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
    }, [onUndo, toggleSolver, toggleHints, onSetDigit, selectedCells, clearSelected, onSelectDigit])

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
                            solutionBoard={solutionBoard}
                            selectedCells={selectedCells}
                            setSelectedCells={setSelectedCells}
                            selectedDigit={selectedDigit}
                            celebration={isComplete && !hasError}
                        />
                        <div>
                            <Button onClick={() => setInputMode('value')} disabled={inputMode === 'value'}>Digit (a)</Button>
                            <Button onClick={() => setInputMode('candidates')} disabled={inputMode === 'candidates'}>Candidate (s)</Button>
                            <Button onClick={onUndo} disabled={boardStack.length === 0}>Undo (n)</Button>
                            <Button onClick={clearSelected} disabled={selectedCells.length === 0}>Deselect all (d)</Button>
                            <Button onClick={toggleHints}>{hintsEnabled ? 'Hide hints (h)' : 'Show hints (h)'}</Button>
                            <Button onClick={toggleSolver} disabled={hasError}>{!!solverState ? 'Hide solver (c)' : 'Show solver (c)'}</Button>
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
                {hintsEnabled &&
                <Paper style={{ height: '100%', width: 300, padding: 16, marginLeft: 16, overflowY: 'auto' }}>
                    <div>
                        <h3>Hints</h3>
                        <p>If all candidates are placed in the current board, the following techniques are required to get the next digit</p>
                        <ul>
                            {hints.map(t => <li>{t}</li>)}
                        </ul>
                    </div>
                </Paper>
                }
                {!!solverState &&
                    <Paper style={{ height: '100%', width: 300, padding: 16, marginLeft: 16, overflowY: 'auto' }}>
                        <Solver
                            board={solverState.solveResult?.board ?? solverState.boardBeforeSolve}
                            solveResult={solverState.solveResult}
                            onSolveResult={onSetSolveResult}
                            onPlayFromHere={onCopyFromSolver}
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
                        onPuzzleSelect={onPuzzleSelect}
                        userData={userData}
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
                    <ImportExport
                        onNewUserData={onNewUserData}
                    />
                </Paper>
            </Dialog>
        </div>
    )
}